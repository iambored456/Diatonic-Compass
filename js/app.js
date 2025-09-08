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
      onToggleDarkMode: ErrorHandler.wrap((forceDark) => {
        if (typeof forceDark === 'boolean') {
          // Handle explicit dark mode setting from toggle switches
          if (this.state.ui.darkMode !== forceDark) {
            ActionController.toggleDarkMode();
          }
        } else {
          // Handle regular toggle
          ActionController.toggleDarkMode();
        }
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
      onToggleOrientation: ErrorHandler.wrap((forceOrientation) => {
        let newOrientation;
        if (typeof forceOrientation === 'string') {
          // Handle explicit orientation setting from toggle switches
          newOrientation = forceOrientation;
        } else {
          // Handle regular toggle
          newOrientation = this.state.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        }
        
        if (this.state.belts.orientation !== newOrientation) {
          ActionController.setOrientation(newOrientation);
          this._announceChange(`Layout changed to ${newOrientation}`);
        }
      }, 'UI'),
      onStartTutorial: ErrorHandler.wrap(() => {
        this._announceChange('Tutorial started');
        startTutorial();
      }, 'Tutorial'),
      onShowKeyboardHelp: ErrorHandler.wrap(() => {
        this._showKeyboardHelp();
      }, 'UI'),
      onOrderChange: ErrorHandler.wrap((layoutOrder, beltOrder) => {
        console.log('Order change triggered:', { layoutOrder, beltOrder });
        this._applyComponentOrder(layoutOrder, beltOrder);
      }, 'UI'),
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
      // Don't interfere with text input or system shortcuts
      if (this._isTextInputActive()) return;
      
      // Don't interfere with browser navigation shortcuts
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          // Only handle if focused on interactive music elements
          if (e.target.id === 'chromaWheel' || e.target.closest('.belt')) {
            e.preventDefault();
            this._rotateRing('pitchClass', -1);
            this._announceChange('Pitch ring rotated left');
          }
          break;
        case 'ArrowRight':
          // Only handle if focused on interactive music elements
          if (e.target.id === 'chromaWheel' || e.target.closest('.belt')) {
            e.preventDefault();
            this._rotateRing('pitchClass', 1);
            this._announceChange('Pitch ring rotated right');
          }
          break;
        case 'ArrowUp':
          // Handle up/down for belt navigation in vertical layout or general wheel navigation
          if (e.target.id === 'chromaWheel' || e.target.closest('.belt')) {
            e.preventDefault();
            this._rotateRing('pitchClass', 1);
            this._announceChange('Pitch ring rotated up');
          }
          break;
        case 'ArrowDown':
          // Handle up/down for belt navigation in vertical layout or general wheel navigation  
          if (e.target.id === 'chromaWheel' || e.target.closest('.belt')) {
            e.preventDefault();
            this._rotateRing('pitchClass', -1);
            this._announceChange('Pitch ring rotated down');
          }
          break;
        case ' ':
        case 'Enter':
          // Play scale globally (unless interacting with buttons/inputs)
          if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('select')) {
            e.preventDefault();
            ActionController.togglePlayback();
          }
          break;
        case 'Escape':
          // Escape should work globally but not prevent other uses
          ActionController.toggleSidebar();
          this._announceChange(this.state.ui.sidebarOpen ? 'Settings opened' : 'Settings closed');
          break;
        case 'f':
        case 'F':
          // Only handle if not in a text field and not a system shortcut
          e.preventDefault();
          ActionController.toggleAccidental('flat');
          this._announceChange(`Flat names ${this.state.display.flat ? 'enabled' : 'disabled'}`);
          break;
        case 's':
        case 'S':
          // Only handle if not a system shortcut (Ctrl+S is save)
          e.preventDefault();
          ActionController.toggleAccidental('sharp');
          this._announceChange(`Sharp names ${this.state.display.sharp ? 'enabled' : 'disabled'}`);
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          const newOrientation = this.state.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal';
          ActionController.setOrientation(newOrientation);
          this._announceChange(`Layout changed to ${newOrientation}`);
          break;
        // Don't handle Tab, Shift+Tab, or other navigation keys - let browser handle them
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
   * Apply component order changes to the actual layout
   */
  _applyComponentOrder(layoutOrder, beltOrder) {
    console.log('Applying component order:', { layoutOrder, beltOrder });
    
    const currentOrientation = this.state.belts.orientation;
    const order = layoutOrder[currentOrientation];
    console.log(`Current orientation: ${currentOrientation}, order:`, order);
    
    // Always restore structure first before applying new layout
    let container = this.container.querySelector('.main-container');
    if (!container) {
      container = document.querySelector('.main-container');
    }
    if (container) {
      this._restoreOriginalStructure(container);
    }
    
    if (currentOrientation === 'horizontal') {
      console.log('Calling _applyHorizontalOrder');
      this._applyHorizontalOrder(order);
    } else {
      console.log('Calling _applyVerticalOrder');
      this._applyVerticalOrder(order);
    }
    
    // Apply belt order within belts container (after structure is established)
    if (beltOrder) {
      console.log('Applying belt order:', beltOrder);
      this._applyBeltOrder(beltOrder);
    }
  }

  /**
   * Apply horizontal layout order
   */
  _applyHorizontalOrder(order) {
    console.log('_applyHorizontalOrder called with order:', order);
    
    // Try multiple ways to find the main container
    let container = this.container.querySelector('.main-container');
    if (!container) {
      container = document.querySelector('.main-container');
    }
    if (!container) {
      console.log('ERROR: main-container not found anywhere');
      console.log('this.container is:', this.container);
      return;
    }

    console.log('Container element:', container);
    console.log('Container classes:', container.className);
    console.log('Container computed styles before:', {
      display: getComputedStyle(container).display,
      flexDirection: getComputedStyle(container).flexDirection,
      width: getComputedStyle(container).width,
      height: getComputedStyle(container).height
    });

    // Get all components including individual belts
    const beltsContainer = container.querySelector('.belts-container');
    const components = {
      compass: container.querySelector('.wheel-container'),
      result: container.querySelector('#result-container'),
      pitch: beltsContainer?.querySelector('.pitch-belt'),
      degree: beltsContainer?.querySelector('.degree-belt'),
      intervals: beltsContainer?.querySelector('.interval-brackets-wrapper'),
      chromatic: beltsContainer?.querySelector('.chromatic-belt')
    };

    console.log('Found components:', Object.keys(components).reduce((acc, key) => {
      acc[key] = !!components[key];
      return acc;
    }, {}));

    console.log('Components dimensions before flattening:', {
      compass: components.compass ? {
        width: components.compass.offsetWidth,
        height: components.compass.offsetHeight,
        display: getComputedStyle(components.compass).display
      } : null,
      beltsContainer: beltsContainer ? {
        width: beltsContainer.offsetWidth,
        height: beltsContainer.offsetHeight,
        display: getComputedStyle(beltsContainer).display
      } : null
    });

    // Temporarily move belts out of belts-container to be direct children
    const belts = ['pitch', 'degree', 'intervals', 'chromatic'];
    const beltElements = [];
    
    belts.forEach(beltId => {
      const element = components[beltId];
      if (element) {
        // Store original parent and position for later restoration
        element._originalParent = element.parentNode;
        element._originalNextSibling = element.nextSibling;
        
        // Move to main container temporarily
        container.appendChild(element);
        beltElements.push(element);
      }
    });

    // Hide the now-empty belts container
    if (beltsContainer) {
      beltsContainer.style.display = 'none';
    }

    console.log('After flattening, container children:', Array.from(container.children).map(child => ({
      tagName: child.tagName,
      className: child.className,
      id: child.id,
      display: getComputedStyle(child).display,
      flex: getComputedStyle(child).flex,
      width: child.offsetWidth,
      height: child.offsetHeight
    })));

    // Apply order to all individual components
    order.forEach((componentId, index) => {
      const element = components[componentId];
      if (element) {
        element.style.setProperty('order', index + 1, 'important');
        console.log(`Set order ${index + 1} for component:`, componentId);
        console.log(`Element after order applied:`, {
          width: element.offsetWidth,
          height: element.offsetHeight,
          display: getComputedStyle(element).display,
          flex: getComputedStyle(element).flex,
          order: getComputedStyle(element).order
        });
      }
    });

    console.log('Container computed styles after:', {
      display: getComputedStyle(container).display,
      flexDirection: getComputedStyle(container).flexDirection,
      width: getComputedStyle(container).width,
      height: getComputedStyle(container).height
    });

    // Store the flattened state so we can restore later
    container._isFlattened = true;
    container._beltElements = beltElements;
    container._beltsContainer = beltsContainer;
  }

  /**
   * Apply vertical layout order 
   */
  _applyVerticalOrder(order) {
    // In vertical mode, restore DOM structure and only reorder compass vs belts group
    let container = this.container.querySelector('.main-container');
    if (!container) {
      container = document.querySelector('.main-container');
    }
    if (!container) return;

    // First, restore the DOM structure if it was flattened
    this._restoreOriginalStructure(container);

    const compassIndex = order.indexOf('compass');
    const resultIndex = order.indexOf('result');
    
    console.log('Vertical layout indices:', {
      order,
      compassIndex,
      resultIndex,
      compassFirst: compassIndex < resultIndex
    });
    
    // The mapping should be intuitive:
    // - Sidebar TOP (compass first) → Main app LEFT 
    // - Sidebar BOTTOM (compass last) → Main app RIGHT
    // BUT user expects the opposite behavior based on feedback
    
    if (compassIndex > resultIndex) {
      // Compass comes AFTER result in sidebar (bottom) → put compass on LEFT in main app
      container.style.gridTemplateAreas = `
        "wheel belts"
        "wheel result"
      `;
      console.log('Applied vertical order: compass left, belts right (compass after result)');
    } else {
      // Compass comes BEFORE result in sidebar (top) → put belts on LEFT in main app  
      container.style.gridTemplateAreas = `
        "belts wheel"
        "result wheel"
      `;
      console.log('Applied vertical order: belts left, compass right (compass before result)');
    }
  }

  /**
   * Restore original DOM structure (belts back to belts-container)
   */
  _restoreOriginalStructure(container) {
    if (!container._isFlattened) return;

    console.log('Restoring original DOM structure');
    
    // Restore belts to their original container
    if (container._beltElements && container._beltsContainer) {
      container._beltElements.forEach(element => {
        // Clear the temporary order style
        element.style.removeProperty('order');
        
        // Restore to original position
        if (element._originalNextSibling) {
          element._originalParent.insertBefore(element, element._originalNextSibling);
        } else {
          element._originalParent.appendChild(element);
        }
        
        // Clean up temp properties
        delete element._originalParent;
        delete element._originalNextSibling;
      });

      // Show the belts container again
      container._beltsContainer.style.display = '';
    }

    // Clean up container temp properties
    delete container._isFlattened;
    delete container._beltElements;
    delete container._beltsContainer;
  }

  /**
   * Apply belt order within the belts container
   */
  _applyBeltOrder(beltOrder) {
    const beltsContainer = this.elements.beltsContainer;
    if (!beltsContainer) return;

    const belts = {
      pitch: beltsContainer.querySelector('.pitch-belt'),
      degree: beltsContainer.querySelector('.degree-belt'),
      intervals: beltsContainer.querySelector('.interval-brackets-wrapper'),
      chromatic: beltsContainer.querySelector('.chromatic-belt')
    };

    // Apply CSS order property to belts
    beltOrder.forEach((beltId, index) => {
      const element = belts[beltId];
      if (element) {
        element.style.setProperty('order', index + 1, 'important');
        console.log(`Set belt order ${index + 1} for belt:`, beltId);
      }
    });
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
- Tab: Navigate between controls
- Arrow keys: Rotate pitch ring (when focused on wheel/belts)
- Ctrl + arrows: Large steps (when focused on wheel/belts)
- Space/Enter: Play scale (when focused on wheel/result)
- F: Toggle flat note names
- S: Toggle sharp note names  
- V: Toggle vertical/horizontal layout
- H: Show this help
- Escape: Open/close settings

Focus the wheel or belts first, then use arrow keys to rotate rings.
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