// (file path: js/utils/ErrorHandler.js)

/**
 * Centralized error handling and recovery system for Diatonic Compass
 * Provides graceful degradation and debugging capabilities
 */
export class ErrorHandler {
  static isDebugMode = false;

  /**
   * Handle errors with context and optional fallback
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @param {Function} fallback - Optional fallback function
   */
  static handle(error, context, fallback = null) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    // Log to console
    console.error(`[${context}] Error:`, error);

    // Store for debugging
    this.logError(errorInfo);

    // Attempt recovery
    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.error(`[${context}] Fallback failed:`, fallbackError);
      }
    }

    // Specific recovery strategies
    this.attemptRecovery(context, error);
  }

  /**
   * Log error information for debugging
   * @param {Object} errorInfo - Error information object
   */
  static logError(errorInfo) {
    try {
      const errorLog = JSON.parse(sessionStorage.getItem('diatonic-errors') || '[]');
      errorLog.push(errorInfo);
      
      // Keep only last 20 errors to prevent storage bloat
      const recentErrors = errorLog.slice(-20);
      sessionStorage.setItem('diatonic-errors', JSON.stringify(recentErrors));
    } catch (storageError) {
      // Silent fail for storage errors - don't create error loops
      if (this.isDebugMode) {
        console.warn('Could not log error to sessionStorage:', storageError);
      }
    }
  }

  /**
   * Attempt context-specific recovery
   * @param {string} context - Error context
   * @param {Error} error - Original error
   */
  static attemptRecovery(context, error) {
    switch (context) {
      case 'AudioContext':
        this.recoverAudioContext();
        break;
      
      case 'Canvas':
        this.recoverCanvas();
        break;
      
      case 'Animation':
        this.recoverAnimation();
        break;
      
      case 'LocalStorage':
        this.recoverLocalStorage();
        break;
      
      case 'Resize':
        // Debounced resize errors usually resolve themselves
        console.warn('Resize error detected - may self-resolve');
        break;
        
      default:
        if (this.isDebugMode) {
          console.warn(`No specific recovery strategy for context: ${context}`);
        }
    }
  }

  /**
   * Recover from audio context errors
   */
  static recoverAudioContext() {
    // Import appState dynamically to avoid circular dependencies
    import('../state/appState.js').then(({ appState }) => {
      if (appState.playback.audioContext) {
        try {
          appState.playback.audioContext.close();
        } catch (e) {
          // Ignore close errors
        }
        appState.playback.audioContext = null;
      }
      
      // Stop any ongoing playback
      if (appState.playback.isPlaying) {
        appState.playback.isPlaying = false;
        appState.playback.currentNoteIndex = null;
        appState.playback.sequence = [];
        if (appState.playback.timeoutId) {
          clearTimeout(appState.playback.timeoutId);
          appState.playback.timeoutId = null;
        }
      }
    });
  }

  /**
   * Recover from canvas errors
   */
  static recoverCanvas() {
    // Canvas errors often resolve with a redraw
    requestAnimationFrame(() => {
      console.log('Attempting canvas recovery via redraw');
    });
  }

  /**
   * Recover from animation errors
   */
  static recoverAnimation() {
    import('../state/appState.js').then(({ appState }) => {
      // Clear any stuck animations
      appState.animation = null;
      appState.drag.active = null;
    });
  }

  /**
   * Recover from localStorage errors
   */
  static recoverLocalStorage() {
    console.warn('LocalStorage unavailable - preferences will not persist');
    // App continues to function without persistence
  }

  /**
   * Get recent error log for debugging
   * @returns {Array} Array of recent errors
   */
  static getErrorLog() {
    try {
      return JSON.parse(sessionStorage.getItem('diatonic-errors') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear error log
   */
  static clearErrorLog() {
    try {
      sessionStorage.removeItem('diatonic-errors');
    } catch (e) {
      // Silent fail
    }
  }

  /**
   * Enable debug mode for development
   */
  static enableDebugMode() {
    this.isDebugMode = true;
    console.log('ErrorHandler debug mode enabled');
  }

  /**
   * Check if a specific feature is supported
   * @param {string} feature - Feature to check
   * @returns {boolean} Whether feature is supported
   */
  static isFeatureSupported(feature) {
    switch (feature) {
      case 'AudioContext':
        return !!(window.AudioContext || window.webkitAudioContext);
      
      case 'localStorage':
        try {
          const test = '__localStorage_test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch (e) {
          return false;
        }
      
      case 'requestIdleCallback':
        return typeof window.requestIdleCallback === 'function';
      
      case 'OffscreenCanvas':
        return typeof OffscreenCanvas !== 'undefined';
      
      default:
        return true;
    }
  }

  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {string} context - Error context
   * @param {Function} fallback - Optional fallback
   * @returns {Function} Wrapped function
   */
  static wrap(fn, context, fallback = null) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, context, fallback);
        return fallback ? fallback(...args) : undefined;
      }
    };
  }
}