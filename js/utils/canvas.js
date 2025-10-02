// (file path: js/utils/canvas.js)

import { ErrorHandler } from './ErrorHandler.js';

/**
 * Checks if the canvas element has resized and updates the state.
 * This version maintains original behavior while adding error handling.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {object} dimensions - The dimensions object from the app state.
 * @returns {boolean} - True if the canvas was resized.
 */
export function checkCanvasSize(canvas, dimensions) {
  try {
    // Validate inputs - but allow processing to continue if possible
    if (!canvas) {
      console.warn('No canvas element provided');
      return false;
    }
    
    if (!dimensions) {
      console.warn('No dimensions object provided');
      return false;
    }

    if (!canvas.parentElement) {
      // This is normal during initialization, don't warn
      return false;
    }

    // Detect layout mode
    const mainContainer = canvas.closest('.main-container');
    const isVerticalMode = mainContainer && mainContainer.classList.contains('vertical-layout');
    
    // Get container dimensions and debug DOM structure
    const containerWidth = canvas.parentElement.offsetWidth;
    const containerHeight = canvas.parentElement.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const mainContainerWidth = mainContainer ? mainContainer.offsetWidth : 0;
    const mainContainerHeight = mainContainer ? mainContainer.offsetHeight : 0;
    
    // Debug DOM hierarchy
    let element = canvas;
    const hierarchy = [];
    while (element && element !== document.body) {
      hierarchy.push({
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        width: element.offsetWidth,
        height: element.offsetHeight,
        style: {
          width: element.style.width,
          height: element.style.height,
          display: getComputedStyle(element).display,
          position: getComputedStyle(element).position
        }
      });
      element = element.parentElement;
    }
    
    let newSize;
    if (isVerticalMode) {
      // In vertical mode, use at least 80% of viewport width or 80% of viewport height
      // Take whichever is smaller to ensure it fits
      const maxPossibleWidth = Math.max(containerWidth, viewportWidth * 0.8);
      const maxPossibleHeight = Math.max(containerHeight, viewportHeight * 0.8);
      newSize = Math.min(maxPossibleWidth, maxPossibleHeight);
    } else {
      // In horizontal mode: canvas needs to respect flex layout constraints
      // Use available space but cap it to prevent overflow
      const availableSpace = Math.min(containerWidth, containerHeight);
      newSize = Math.min(availableSpace, window.innerHeight * 0.8); // Cap at 80% of viewport height
    }

    if (Math.abs(newSize - (dimensions.size || 0)) > 50) { // Only log on significant changes
      console.log('=== CANVAS CONTAINER DEBUG ===');
      console.log('Vertical mode:', isVerticalMode);
      console.log('Canvas size:', { width: canvas.width, height: canvas.height });
      console.log('Container dimensions:', { containerWidth, containerHeight });
      console.log('Viewport dimensions:', { viewportWidth, viewportHeight });
      console.log('Calculated size:', newSize);
      console.log('DOM Hierarchy (from canvas to body):');
      hierarchy.forEach((elem, index) => {
        console.log(`  ${index}: ${elem.tagName}${elem.id ? '#' + elem.id : ''}${elem.className ? '.' + elem.className.replace(/\s+/g, '.') : ''}`, {
          dimensions: `${elem.width}x${elem.height}`,
          styles: elem.style
        });
      });
    }

    // Return false if size is 0 or unchanged - exactly like original  
    if (newSize === dimensions.size || newSize === 0) {
      return false;
    }
    
    // Skip very small size changes to prevent flickering
    if (dimensions.size && Math.abs(newSize - dimensions.size) < 2) {
      return false;
    }
    
    console.log('Canvas resize proceeding:', {
      oldSize: dimensions.size,
      newSize: newSize,
      difference: Math.abs(newSize - (dimensions.size || 0))
    });

    // Update dimensions - exactly like original
    dimensions.size = newSize;
    dimensions.cx = newSize / 2;
    dimensions.cy = newSize / 2;
    
    // Set device pixel ratio if not already set
    if (!dimensions.dpr || dimensions.dpr === 0) {
      dimensions.dpr = getDevicePixelRatio();
    }

    // Adjust canvas buffer size for device pixel ratio - exactly like original
    const newBufferWidth = newSize * dimensions.dpr;
    const newBufferHeight = newSize * dimensions.dpr;
    
    console.log('Setting canvas dimensions:', {
      cssSize: `${newSize}px`,
      bufferSize: `${newBufferWidth}x${newBufferHeight}`,
      dpr: dimensions.dpr,
      beforeCSS: { width: canvas.style.width, height: canvas.style.height },
      beforeBuffer: { width: canvas.width, height: canvas.height }
    });
    
    canvas.width = newBufferWidth;
    canvas.height = newBufferHeight;

    // Set CSS size to match the calculated size - this ensures proper scaling
    canvas.style.width = `${newSize}px`;
    canvas.style.height = `${newSize}px`;
    
    console.log('Canvas dimensions after setting:', {
      cssSize: { width: canvas.style.width, height: canvas.style.height },
      bufferSize: { width: canvas.width, height: canvas.height },
      offsetSize: { width: canvas.offsetWidth, height: canvas.offsetHeight }
    });

    return true;

  } catch (error) {
    ErrorHandler.handle(error, 'Canvas', () => {
      // Fallback: try the most basic resize possible
      try {
        if (canvas && canvas.parentElement && dimensions) {
          const size = Math.min(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
          if (size > 0 && size !== dimensions.size) {
            dimensions.size = size;
            dimensions.cx = size / 2;
            dimensions.cy = size / 2;
            dimensions.dpr = dimensions.dpr || 1;
            canvas.width = size * dimensions.dpr;
            canvas.height = size * dimensions.dpr;
          }
        }
      } catch (fallbackError) {
        console.error('Canvas resize fallback failed');
      }
    });
    return false;
  }
}

/**
 * Get device pixel ratio with fallbacks for older browsers
 * @returns {number} Device pixel ratio
 */
export function getDevicePixelRatio() {
  try {
    return Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance
  } catch (error) {
    ErrorHandler.handle(error, 'Canvas');
    return 1;
  }
}

/**
 * Test if canvas context is working properly (simplified)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @returns {boolean} True if context is working
 */
export function isCanvasContextWorking(ctx) {
  try {
    // Simple test - just check if basic properties exist
    return ctx && typeof ctx.fillRect === 'function';
  } catch (error) {
    ErrorHandler.handle(error, 'Canvas');
    return false;
  }
}

/**
 * Clear canvas with error handling
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {boolean} True if successful
 */
export function clearCanvas(canvas, width, height) {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    ctx.clearRect(0, 0, width || canvas.width, height || canvas.height);
    return true;
    
  } catch (error) {
    ErrorHandler.handle(error, 'Canvas', () => {
      // Fallback: try to reset canvas
      try {
        canvas.width = canvas.width; // This clears the canvas
      } catch (e) {
        console.error('Canvas clear fallback failed');
      }
    });
    return false;
  }
}

/**
 * Create a high-DPI canvas with proper scaling
 * @param {number} width - Desired width in CSS pixels
 * @param {number} height - Desired height in CSS pixels
 * @returns {Object} Canvas element and context, or null if failed
 */
export function createHiDPICanvas(width, height) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot create canvas 2D context');
    }

    const dpr = getDevicePixelRatio();
    
    // Set buffer size
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale context for high-DPI
    ctx.scale(dpr, dpr);
    
    return { canvas, ctx, dpr };
    
  } catch (error) {
    ErrorHandler.handle(error, 'Canvas');
    return null;
  }
}

/**
 * Monitor canvas for context loss and restoration
 * @param {HTMLCanvasElement} canvas - Canvas to monitor
 * @param {Function} onLost - Callback when context is lost
 * @param {Function} onRestored - Callback when context is restored
 * @returns {Function} Cleanup function
 */
export function monitorCanvasContext(canvas, onLost, onRestored) {
  const handleContextLost = (event) => {
    event.preventDefault();
    console.warn('Canvas context lost');
    ErrorHandler.handle(new Error('Canvas context lost'), 'Canvas');
    if (onLost) onLost();
  };
  
  const handleContextRestored = () => {
    console.log('Canvas context restored');
    if (onRestored) onRestored();
  };
  
  try {
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    // Return cleanup function
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
    
  } catch (error) {
    ErrorHandler.handle(error, 'Canvas');
    return () => {}; // No-op cleanup
  }
}

/**
 * Safely get canvas metrics for responsive behavior
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Object} Canvas metrics or defaults
 */
export function getCanvasMetrics(canvas) {
  try {
    if (!canvas || !canvas.parentElement) {
      return { width: 0, height: 0, ratio: 1 };
    }
    
    const rect = canvas.getBoundingClientRect();
    const parent = canvas.parentElement;
    
    return {
      width: rect.width || parent.offsetWidth || 0,
      height: rect.height || parent.offsetHeight || 0,
      ratio: getDevicePixelRatio(),
      displayWidth: canvas.style.width ? parseInt(canvas.style.width) : rect.width,
      displayHeight: canvas.style.height ? parseInt(canvas.style.height) : rect.height,
      bufferWidth: canvas.width,
      bufferHeight: canvas.height
    };
    
  } catch (error) {
    ErrorHandler.handle(error, 'Canvas');
    return { width: 0, height: 0, ratio: 1 };
  }
}

/**
 * Optimize canvas for better performance
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} options - Optimization options
 */
export function optimizeCanvas(canvas, options = {}) {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const defaults = {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      willReadFrequently: false,
      alpha: true
    };
    
    const settings = { ...defaults, ...options };
    
    // Apply context settings
    if ('imageSmoothingEnabled' in ctx) {
      ctx.imageSmoothingEnabled = settings.imageSmoothingEnabled;
    }
    
    if ('imageSmoothingQuality' in ctx) {
      ctx.imageSmoothingQuality = settings.imageSmoothingQuality;
    }
    
    // Set CSS for better rendering
    canvas.style.imageRendering = settings.imageSmoothingEnabled ? 'auto' : 'pixelated';
    
  } catch (error) {
    ErrorHandler.handle(error, 'Canvas');
  }
}