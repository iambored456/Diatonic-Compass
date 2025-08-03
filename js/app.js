// (file path: js/app.js)
import { appState } from './state/appState.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { checkCanvasSize } from './utils/canvas.js';
import { generateDisplayLabels } from './core/logic.js';
import { stepAnim } from './core/animation.js';
import { DIATONIC_DEGREE_INDICES } from './core/constants.js';
import { ActionController } from './core/ActionController.js';
import { startTutorial } from './tutorial.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { PerformanceUtils } from './utils/PerformanceUtils.js';

import Wheel from './components/Wheel.js';
import Belts from './components/Belts.js';
import UIControls from './components/UIControls.js';

export default class App {
  constructor(container) {
    this.container = container;
    this.state = appState;
    this.isInitialized = false;
    this.cleanupFunctions = [];

    // Performance monitoring (only in development)
    this.performanceMonitor = null;
    
    // Accessibility managers (will be initialized if modules are available)
    this.keyboardManager = null;
    this.screenReaderManager = null;
    
    try {
      this._initializeApp();
    } catch (error) {
      ErrorHandler.handle(error, 'App', () => {
        console.error('Failed to initialize app');
      });
    }
  }

  _initializeApp() {
    // Add skip link for accessibility
    this._addSkipLink();
    
    // Find required elements
    this.elements = {
      canvas: this.container.querySelector('#chromaWheel'),
      beltsContainer: this.container.querySelector('.belts-container'),
    };

    // Validate required elements
    if (!this.elements.canvas) {
      throw new Error('Canvas element not found');
    }
    if (!this.elements.beltsContainer) {
      throw new Error('Belts container not found');
    }

    // Set up control callbacks with basic accessibility
    const controlCallbacks = {
      onToggleFlat: ErrorHandler.wrap(() => {
        ActionController.toggleAccidental('flat');
        this._announceChange(`Flat names ${this.state.display.flat ? 'enabled' : 'disabled'}`);
      }, 'UI'),
      onToggleSharp: ErrorHandler.wrap(() => {
        ActionController.toggleAccidental('sharp');
        this._announceChange(`Sharp names ${this.state.display.sharp ? 'enabled' : 'disabled'}`);
      }, 'UI'),
      onToggleDarkMode: ErrorHandler.wrap(() => {
        ActionController.toggleDarkMode();
        this._announceChange(`${this.state.ui.darkMode ? 'Dark' : 'Light'} mode enabled`);
      }, 'UI'),
      onTogglePlayback: ErrorHandler.wrap(() => {
        ActionController.togglePlayback();
        this._announceChange(this.state.playback.isPlaying ? 'Scale playing' : 'Playback stopped');
      }, 'UI'),
      onToggleSidebar: ErrorHandler.wrap((state) => {
        ActionController.toggleSidebar(state);
        this._announceChange(`Settings ${this.state.ui.sidebarOpen ? 'opened' : 'closed'}`);
      }, 'UI'),
      onToggleOrientation: ErrorHandler.wrap(() => {
        const newOrientation = this.state.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        ActionController.setOrientation(newOrientation);
        this._announceChange(`Layout changed to ${newOrientation}`);
      }, 'UI'),
      onStartTutorial: ErrorHandler.wrap(() => {
        this._announceChange('Tutorial started');
        startTutorial();
      }, 'Tutorial'),
    };

    // Initialize components with error handling
    try {
      this.wheel = new Wheel(this.elements.canvas, this.state, this.onInteractionEnd.bind(this));
    } catch (error) {
      ErrorHandler.handle(error, 'Wheel', () => {
        console.error('Wheel component failed to initialize');
      });
    }

    try {
      this.belts = new Belts(this.elements.beltsContainer, this.state, this.onInteractionEnd.bind(this));
    } catch (error) {
      ErrorHandler.handle(error, 'Belts', () => {
        console.error('Belts component failed to initialize');
      });
    }

    try {
      this.uiControls = new UIControls(this.container, this.state, controlCallbacks);
    } catch (error) {
      ErrorHandler.handle(error, 'UIControls', () => {
        console.error('UI Controls failed to initialize');
      });
    }
    
    // Initialize accessibility features if available
    this._initializeAccessibility();
    
    // Set up responsive logic with performance optimization
    this._setupResponsiveLogic();

    // Start render loop with error handling
    try {
      makeRenderLoop(ErrorHandler.wrap(this.redraw.bind(this), 'RenderLoop'));
    } catch (error) {
      ErrorHandler.handle(error, 'RenderLoop', () => {
        console.error('Render loop failed to start');
      });
    }

    // Set up performance monitoring in development
    if (this._isDevelopment()) {
      this._setupPerformanceMonitoring();
    }

    // Monitor for accessibility preferences changes
    this._setupAccessibilityMonitoring();

    this.isInitialized = true;
  }

  /**
   * Add skip link for keyboard navigation
   */
  _addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#chromaWheel';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--color-surface, white);
      color: var(--color-text-primary, black);
      padding: 8px;
      z-index: 10000;
      text-decoration: none;
      border-radius: 4px;
      border: 2px solid #33c6dc;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    this.cleanupFunctions.push(() => {
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink);
      }
    });
  }

  /**
   * Initialize accessibility features gradually
   */
  _initializeAccessibility() {
    try {
      // Try to load accessibility modules dynamically
      this._loadAccessibilityModules().then(() => {
        console.log('Accessibility features loaded');
      }).catch(() => {
        console.log('Using basic accessibility features');
        this._setupBasicAccessibility();
      });
      
    } catch (error) {
      ErrorHandler.handle(error, 'Accessibility', () => {
        console.warn('Some accessibility features may not be available');
        this._setupBasicAccessibility();
      });
    }
  }

  /**
   * Dynamically load accessibility modules
   */
  async _loadAccessibilityModules() {
    try {
      // Try to import accessibility modules
      const { KeyboardManager } = await import('./accessibility/KeyboardManager.js');
      const { ScreenReaderManager } = await import('./accessibility/ScreenReaderManager.js');
      
      KeyboardManager.init();
      ScreenReaderManager.init();
      
      this.keyboardManager = KeyboardManager;
      this.screenReaderManager = ScreenReaderManager;
      
      return true;
    } catch (error) {
      throw new Error('Accessibility modules not available');
    }
  }

  /**
   * Set up basic accessibility without external modules
   */
  _setupBasicAccessibility() {
    // Basic keyboard navigation
    this._setupBasicKeyboard();
    
    // Basic ARIA enhancements
    this._setupBasicARIA();
    
    // Basic announcements
    this._setupBasicAnnouncements();
  }

  /**
   * Set up basic keyboard navigation
   */
  _setupBasicKeyboard() {
    const handleKeyDown = (e) => {
      if (this._isTextInputActive()) return;
      
      const step = e.ctrlKey ? 3 : 1; // Larger steps with Ctrl
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this._rotateRing('pitchClass', -step);
          this._announceChange('Pitch ring rotated left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          this._rotateRing('pitchClass', step);
          this._announceChange('Pitch ring rotated right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._rotateRing('degree', step);
          this._rotateRing('highlightPosition', step);
          this._announceChange('Degree ring rotated up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          this._rotateRing('degree', -step);
          this._rotateRing('highlightPosition', -step);
          this._announceChange('Degree ring rotated down');
          break;
        case ' ':
        case 'Enter':
          if (e.target.id === 'chromaWheel' || e.target.id === 'result-container') {
            e.preventDefault();
            ActionController.togglePlayback();
          }
          break;
        case 'Escape':
          ActionController.toggleSidebar(false);
          break;
        case 'h':
        case 'H':
          if (!e.ctrlKey && !e.altKey) {
            e.preventDefault();
            this._showKeyboardHelp();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    this.cleanupFunctions.push(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  /**
   * Rotate a ring by steps
   */
  _rotateRing(ringName, steps) {
    const stepAngle = steps * (Math.PI * 2 / 12);
    const currentAngle = this.state.rings[ringName];
    const newAngle = (currentAngle + stepAngle) % (Math.PI * 2);
    ActionController.setRingAngle(ringName, newAngle);
  }

  /**
   * Check if text input is active
   */
  _isTextInputActive() {
    const activeElement = document.activeElement;
    const textInputs = ['INPUT', 'TEXTAREA', 'SELECT'];
    return textInputs.includes(activeElement?.tagName) || 
           activeElement?.contentEditable === 'true';
  }

  /**
   * Set up basic ARIA attributes
   */
  _setupBasicARIA() {
    // Main container
    this.container.setAttribute('role', 'main');
    this.container.setAttribute('aria-label', 'Diatonic Compass Music Theory Tool');
    
    // Canvas
    if (this.elements.canvas) {
      this.elements.canvas.setAttribute('tabindex', '0');
      this.elements.canvas.setAttribute('role', 'application');
      this.elements.canvas.setAttribute('aria-label', 'Interactive Diatonic Compass - use arrow keys to explore');
    }
    
    // Result container
    const resultContainer = document.querySelector('#result-container');
    if (resultContainer) {
      resultContainer.setAttribute('tabindex', '0');
      resultContainer.setAttribute('aria-label', 'Current musical key and mode - click to play');
    }
  }

  /**
   * Set up basic announcement system
   */
  _setupBasicAnnouncements() {
    // Create basic live region
    const liveRegion = document.createElement('div');
    liveRegion.id = 'basic-announcements';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'false');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    
    this.cleanupFunctions.push(() => {
      if (liveRegion.parentNode) {
        liveRegion.parentNode.removeChild(liveRegion);
      }
    });
  }

  /**
   * Basic announcement function
   */
  _announceChange(message) {
    const liveRegion = document.getElementById('basic-announcements');
    if (liveRegion) {
      liveRegion.textContent = '';
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 100);
    }
    
    // Also try screen reader manager if available
    if (this.screenReaderManager) {
      this.screenReaderManager.queueAnnouncement(message);
    }
  }

  /**
   * Show basic keyboard help
   */
  _showKeyboardHelp() {
    const helpText = `
Keyboard Shortcuts:
- Arrow keys: Rotate rings
- Ctrl + arrows: Large steps
- Space/Enter: Play scale
- H: Show this help
- Escape: Close dialogs
    `.trim();
    
    alert(helpText); // Basic fallback - could be enhanced with modal
  }

  /**
   * Set up accessibility preference monitoring
   */
  _setupAccessibilityMonitoring() {
    // Monitor for reduced motion preference changes
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => {
      document.body.classList.toggle('reduced-motion', e.matches);
    };
    
    motionMediaQuery.addListener(handleMotionChange);
    handleMotionChange(motionMediaQuery); // Initial check
    
    this.cleanupFunctions.push(() => {
      motionMediaQuery.removeListener(handleMotionChange);
    });

    // Monitor for high contrast preference
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleContrastChange = (e) => {
      document.body.classList.toggle('high-contrast', e.matches);
    };
    
    contrastMediaQuery.addListener(handleContrastChange);
    handleContrastChange(contrastMediaQuery);
    
    this.cleanupFunctions.push(() => {
      contrastMediaQuery.removeListener(handleContrastChange);
    });
  }
  
  onInteractionEnd() {
    // Announce state change after interaction completes
    setTimeout(() => {
      const resultElement = document.querySelector('#result-text');
      if (resultElement) {
        this._announceChange(`Current key: ${resultElement.textContent}`);
      }
    }, 100);
  }

  _setupResponsiveLogic() {
    // Create debounced resize handler for better performance
    const debouncedHandleResize = PerformanceUtils.debounce(() => {
      try {
        const isWide = window.innerWidth > window.innerHeight;
        const newOrientation = isWide ? 'vertical' : 'horizontal';
        
        if (this.state.belts.orientation !== newOrientation) {
          ActionController.setOrientation(newOrientation);
          this._announceChange(`Layout changed to ${newOrientation}`);
        } else {
          // Just redraw without changing orientation
          this.redraw(performance.now());
        }
      } catch (error) {
        ErrorHandler.handle(error, 'Resize', () => {
          console.warn('Resize handling failed');
        });
      }
    }, 150); // 150ms debounce for responsive but not excessive updates

    // Add resize listener
    window.addEventListener('resize', debouncedHandleResize);
    
    // Store cleanup function
    this.cleanupFunctions.push(() => {
      window.removeEventListener('resize', debouncedHandleResize);
      debouncedHandleResize.cancel(); // Cancel any pending calls
    });

    // Handle initial resize
    try {
      const isWide = window.innerWidth > window.innerHeight;
      const initialOrientation = isWide ? 'vertical' : 'horizontal';
      ActionController.setOrientation(initialOrientation);
    } catch (error) {
      ErrorHandler.handle(error, 'Resize');
    }
  }

  _setupPerformanceMonitoring() {
    // FPS monitoring for development
    this.performanceMonitor = PerformanceUtils.createFPSMonitor((fps) => {
      if (fps < 30) {
        console.warn(`Low FPS detected: ${fps}`);
      }
    }, 120); // Check every 2 seconds

    // Memory monitoring if available
    if (PerformanceUtils.getMemoryInfo()) {
      const memoryCheck = setInterval(() => {
        const memory = PerformanceUtils.getMemoryInfo();
        if (memory && memory.used > 100) { // 100MB threshold
          console.warn(`High memory usage: ${memory.used}MB`);
        }
      }, 30000); // Check every 30 seconds

      this.cleanupFunctions.push(() => clearInterval(memoryCheck));
    }

    // Store cleanup for performance monitor
    this.cleanupFunctions.push(() => {
      if (this.performanceMonitor) {
        this.performanceMonitor();
        this.performanceMonitor = null;
      }
    });
  }

  redraw(time) {
    try {
      // Step animations first
      stepAnim(time);
      
      // Check and update canvas size with error handling
      const canvasResized = checkCanvasSize(this.elements.canvas, this.state.dimensions);
      
      // Skip render if no valid canvas size
      if (!this.state.dimensions.size) {
        return;
      }

      // Generate display labels (this will be memoized in logic.js)
      const labels = generateDisplayLabels(this.state);
      const { rings, playback } = this.state;
      const highlightPattern = DIATONIC_DEGREE_INDICES;
    
      // Update components with error boundaries
      if (this.wheel) {
        try {
          this.wheel.update(rings, labels, playback);
        } catch (error) {
          ErrorHandler.handle(error, 'Wheel', () => {
            console.warn('Wheel update failed - skipping frame');
          });
        }
      }

      if (this.belts) {
        try {
          this.belts.update(labels, highlightPattern);
        } catch (error) {
          ErrorHandler.handle(error, 'Belts', () => {
            console.warn('Belts update failed - skipping frame');
          });
        }
      }

      if (this.uiControls) {
        try {
          this.uiControls.update();
        } catch (error) {
          ErrorHandler.handle(error, 'UIControls', () => {
            console.warn('UI Controls update failed - skipping frame');
          });
        }
      }

    } catch (error) {
      ErrorHandler.handle(error, 'RenderLoop', () => {
        console.error('Critical render error - app may be unstable');
      });
    }
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    try {
      // Clean up accessibility features
      if (this.keyboardManager) {
        // KeyboardManager cleanup would go here if it had a cleanup method
      }
      if (this.screenReaderManager) {
        this.screenReaderManager.cleanup();
      }

      // Run all cleanup functions
      this.cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
      this.cleanupFunctions = [];

      // Clean up components if they have destroy methods
      if (this.wheel && typeof this.wheel.destroy === 'function') {
        this.wheel.destroy();
      }
      if (this.belts && typeof this.belts.destroy === 'function') {
        this.belts.destroy();
      }
      if (this.uiControls && typeof this.uiControls.destroy === 'function') {
        this.uiControls.destroy();
      }

      // Stop performance monitoring
      if (this.performanceMonitor) {
        this.performanceMonitor();
        this.performanceMonitor = null;
      }

      this.isInitialized = false;

    } catch (error) {
      ErrorHandler.handle(error, 'App', () => {
        console.error('App cleanup failed');
      });
    }
  }

  /**
   * Check if running in development mode
   */
  _isDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }

  /**
   * Get app status for debugging
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      components: {
        wheel: !!this.wheel,
        belts: !!this.belts,
        uiControls: !!this.uiControls
      },
      accessibility: {
        keyboardEnabled: this.keyboardManager?.isEnabled,
        screenReaderEnabled: this.screenReaderManager?.isEnabled
      },
      dimensions: this.state.dimensions,
      errors: ErrorHandler.getErrorLog()
    };
  }
}