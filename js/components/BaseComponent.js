// (file path: js/components/BaseComponent.js)

import { ErrorHandler } from '../utils/ErrorHandler.js';
import { CONFIG } from '../core/constants.js';

/**
 * Base component class providing lifecycle management, error handling,
 * and common utilities for all Diatonic Compass components
 */
export class BaseComponent {
  constructor(container, state, name = 'Component') {
    this.container = container;
    this.state = state;
    this.name = name;
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Event listener tracking for cleanup
    this.listeners = [];
    this.timeouts = [];
    this.intervals = [];
    this.animationFrames = [];
    
    // Component-specific cleanup functions
    this.cleanupFunctions = [];
    
    // Performance monitoring
    this.updateCount = 0;
    this.lastUpdateTime = 0;
    
    try {
      this.initialize();
    } catch (error) {
      ErrorHandler.handle(error, this.name, () => {
        console.error(`${this.name} component failed to initialize`);
      });
    }
  }

  /**
   * Initialize the component - override in subclasses
   * Called automatically during construction
   */
  initialize() {
    if (this.isInitialized) {
      console.warn(`${this.name} component already initialized`);
      return;
    }

    try {
      // Validate container
      if (!this.container) {
        throw new Error(`No container provided for ${this.name} component`);
      }

      // Call subclass initialization
      this.setupElements();
      this.bindEvents();
      this.setupInitialState();
      
      this.isInitialized = true;
      this.onInitialized();
      
    } catch (error) {
      ErrorHandler.handle(error, this.name);
      throw error; // Re-throw to let parent handle
    }
  }

  /**
   * Set up DOM elements - implement in subclasses
   */
  setupElements() {
    // Override in subclasses
  }

  /**
   * Bind event listeners - implement in subclasses
   */
  bindEvents() {
    // Override in subclasses
  }

  /**
   * Set up initial component state - implement in subclasses
   */
  setupInitialState() {
    // Override in subclasses
  }

  /**
   * Called after successful initialization - override in subclasses
   */
  onInitialized() {
    // Override in subclasses if needed
  }

  /**
   * Update component - implement in subclasses
   * @param {...any} args - Update arguments
   */
  update(...args) {
    if (!this.isInitialized || this.isDestroyed) {
      return;
    }

    try {
      const startTime = performance.now();
      
      this.performUpdate(...args);
      
      // Track performance
      this.updateCount++;
      this.lastUpdateTime = performance.now() - startTime;
      
      // Warn about slow updates in development
      if (this._isDevelopment() && this.lastUpdateTime > 16) { // >16ms is slower than 60fps
        console.warn(`${this.name} update took ${this.lastUpdateTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      ErrorHandler.handle(error, this.name, () => {
        console.warn(`${this.name} update failed - skipping frame`);
      });
    }
  }

  /**
   * Perform the actual update - implement in subclasses
   * @param {...any} args - Update arguments
   */
  performUpdate(...args) {
    // Override in subclasses
  }

  /**
   * Add event listener with automatic cleanup tracking
   * @param {Element} element - Element to add listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {object} options - Event listener options
   */
  addListener(element, event, handler, options = {}) {
    try {
      if (!element || !event || !handler) {
        throw new Error('Invalid parameters for addListener');
      }

      // Wrap handler with error handling
      const wrappedHandler = ErrorHandler.wrap(handler, this.name);
      
      element.addEventListener(event, wrappedHandler, options);
      
      // Track for cleanup
      this.listeners.push({
        element,
        event,
        handler: wrappedHandler,
        options
      });
      
    } catch (error) {
      ErrorHandler.handle(error, this.name);
    }
  }

  /**
   * Set timeout with automatic cleanup tracking
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timeout ID
   */
  setTimeout(callback, delay) {
    try {
      const wrappedCallback = ErrorHandler.wrap(callback, this.name);
      const timeoutId = setTimeout(wrappedCallback, delay);
      this.timeouts.push(timeoutId);
      return timeoutId;
    } catch (error) {
      ErrorHandler.handle(error, this.name);
      return null;
    }
  }

  /**
   * Set interval with automatic cleanup tracking
   * @param {Function} callback - Callback function
   * @param {number} interval - Interval in milliseconds
   * @returns {number} Interval ID
   */
  setInterval(callback, interval) {
    try {
      const wrappedCallback = ErrorHandler.wrap(callback, this.name);
      const intervalId = setInterval(wrappedCallback, interval);
      this.intervals.push(intervalId);
      return intervalId;
    } catch (error) {
      ErrorHandler.handle(error, this.name);
      return null;
    }
  }

  /**
   * Request animation frame with automatic cleanup tracking
   * @param {Function} callback - Callback function
   * @returns {number} Animation frame ID
   */
  requestAnimationFrame(callback) {
    try {
      const wrappedCallback = ErrorHandler.wrap(callback, this.name);
      const frameId = requestAnimationFrame(wrappedCallback);
      this.animationFrames.push(frameId);
      return frameId;
    } catch (error) {
      ErrorHandler.handle(error, this.name);
      return null;
    }
  }

  /**
   * Add custom cleanup function
   * @param {Function} cleanupFn - Function to call during cleanup
   */
  addCleanup(cleanupFn) {
    if (typeof cleanupFn === 'function') {
      this.cleanupFunctions.push(cleanupFn);
    }
  }

  /**
   * Find element within component container
   * @param {string} selector - CSS selector
   * @returns {Element|null} Found element or null
   */
  findElement(selector) {
    try {
      if (!this.container) return null;
      return this.container.querySelector(selector);
    } catch (error) {
      ErrorHandler.handle(error, this.name);
      return null;
    }
  }

  /**
   * Find multiple elements within component container
   * @param {string} selector - CSS selector
   * @returns {NodeList} Found elements
   */
  findElements(selector) {
    try {
      if (!this.container) return [];
      return this.container.querySelectorAll(selector);
    } catch (error) {
      ErrorHandler.handle(error, this.name);
      return [];
    }
  }

  /**
   * Safely set element content
   * @param {Element} element - Target element
   * @param {string} content - Content to set
   * @param {boolean} isHTML - Whether content is HTML (default: false)
   */
  setElementContent(element, content, isHTML = false) {
    try {
      if (!element) return;
      
      if (isHTML) {
        element.innerHTML = content;
      } else {
        element.textContent = content;
      }
    } catch (error) {
      ErrorHandler.handle(error, this.name);
    }
  }

  /**
   * Safely add CSS class to element
   * @param {Element} element - Target element
   * @param {string} className - Class name to add
   */
  addClass(element, className) {
    try {
      if (element && className) {
        element.classList.add(className);
      }
    } catch (error) {
      ErrorHandler.handle(error, this.name);
    }
  }

  /**
   * Safely remove CSS class from element
   * @param {Element} element - Target element
   * @param {string} className - Class name to remove
   */
  removeClass(element, className) {
    try {
      if (element && className) {
        element.classList.remove(className);
      }
    } catch (error) {
      ErrorHandler.handle(error, this.name);
    }
  }

  /**
   * Safely toggle CSS class on element
   * @param {Element} element - Target element
   * @param {string} className - Class name to toggle
   * @param {boolean} force - Force add (true) or remove (false)
   */
  toggleClass(element, className, force) {
    try {
      if (element && className) {
        element.classList.toggle(className, force);
      }
    } catch (error) {
      ErrorHandler.handle(error, this.name);
    }
  }

  /**
   * Check if running in development mode
   * @returns {boolean} True if in development
   */
  _isDevelopment() {
    return CONFIG.FEATURES.ENABLE_PERFORMANCE_MONITORING ||
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }

  /**
   * Destroy the component and clean up all resources
   */
  destroy() {
    if (this.isDestroyed) {
      console.warn(`${this.name} component already destroyed`);
      return;
    }

    try {
      // Call pre-destroy hook
      this.onBeforeDestroy();

      // Remove all event listeners
      this.listeners.forEach(({ element, event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn(`Failed to remove listener for ${event}:`, error);
        }
      });
      this.listeners = [];

      // Clear all timeouts
      this.timeouts.forEach(timeoutId => {
        try {
          clearTimeout(timeoutId);
        } catch (error) {
          console.warn(`Failed to clear timeout ${timeoutId}:`, error);
        }
      });
      this.timeouts = [];

      // Clear all intervals
      this.intervals.forEach(intervalId => {
        try {
          clearInterval(intervalId);
        } catch (error) {
          console.warn(`Failed to clear interval ${intervalId}:`, error);
        }
      });
      this.intervals = [];

      // Cancel all animation frames
      this.animationFrames.forEach(frameId => {
        try {
          cancelAnimationFrame(frameId);
        } catch (error) {
          console.warn(`Failed to cancel animation frame ${frameId}:`, error);
        }
      });
      this.animationFrames = [];

      // Run custom cleanup functions
      this.cleanupFunctions.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          console.warn(`Custom cleanup function failed:`, error);
        }
      });
      this.cleanupFunctions = [];

      // Call post-destroy hook
      this.onDestroyed();

      this.isDestroyed = true;
      this.isInitialized = false;

    } catch (error) {
      ErrorHandler.handle(error, this.name, () => {
        console.error(`${this.name} component cleanup failed`);
      });
    }
  }

  /**
   * Called before component destruction - override in subclasses
   */
  onBeforeDestroy() {
    // Override in subclasses if needed
  }

  /**
   * Called after component destruction - override in subclasses
   */
  onDestroyed() {
    // Override in subclasses if needed
  }

  /**
   * Check if component is healthy (initialized and not destroyed)
   * @returns {boolean} True if component is healthy
   */
  isHealthy() {
    return this.isInitialized && !this.isDestroyed;
  }

  /**
   * Get component status for debugging
   * @returns {object} Component status
   */
  getStatus() {
    return {
      name: this.name,
      isInitialized: this.isInitialized,
      isDestroyed: this.isDestroyed,
      hasContainer: !!this.container,
      updateCount: this.updateCount,
      lastUpdateTime: this.lastUpdateTime,
      resourceCounts: {
        listeners: this.listeners.length,
        timeouts: this.timeouts.length,
        intervals: this.intervals.length,
        animationFrames: this.animationFrames.length,
        cleanupFunctions: this.cleanupFunctions.length
      }
    };
  }
}