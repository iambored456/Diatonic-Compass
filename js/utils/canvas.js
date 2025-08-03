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

    // Get container dimensions - exactly like original
    const containerWidth = canvas.parentElement.offsetWidth;
    const containerHeight = canvas.parentElement.offsetHeight;
    
    // Use the smaller dimension to ensure canvas is always square - exactly like original
    const newSize = Math.min(containerWidth, containerHeight);

    // Return false if size is 0 or unchanged - exactly like original
    if (newSize === dimensions.size || newSize === 0) {
      return false;
    }

    // Update dimensions - exactly like original
    dimensions.size = newSize;
    dimensions.cx = newSize / 2;
    dimensions.cy = newSize / 2;
    
    // Set device pixel ratio if not already set
    if (!dimensions.dpr || dimensions.dpr === 0) {
      dimensions.dpr = getDevicePixelRatio();
    }

    // Adjust canvas buffer size for device pixel ratio - exactly like original
    canvas.width = newSize * dimensions.dpr;
    canvas.height = newSize * dimensions.dpr;

    // DON'T set CSS size - let CSS handle the display size naturally
    // This was the issue - the original doesn't set CSS width/height

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