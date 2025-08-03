// (file path: js/state/StateManager.js)

import { ErrorHandler } from '../utils/ErrorHandler.js';
import { CONFIG } from '../core/constants.js';

/**
 * State management utilities for validation and debugging
 * Provides a layer of safety and consistency over direct state mutations
 */
export class StateManager {
  static updateHistory = [];
  static maxHistorySize = 50;

  /**
   * Validate state structure against expected types
   * @param {object} state - State to validate
   * @returns {boolean} True if valid
   */
  static validateState(state) {
    try {
      const errors = [];

      // Validate rings
      if (!state.rings || typeof state.rings !== 'object') {
        errors.push('Missing or invalid rings object');
      } else {
        const requiredRings = ['pitchClass', 'degree', 'chromatic', 'highlightPosition'];
        requiredRings.forEach(ring => {
          if (typeof state.rings[ring] !== 'number' || !isFinite(state.rings[ring])) {
            errors.push(`Invalid ${ring}: must be a finite number`);
          }
        });
      }

      // Validate interaction
      if (!state.interaction || typeof state.interaction !== 'object') {
        errors.push('Missing or invalid interaction object');
      } else {
        if (!state.interaction.drag || typeof state.interaction.drag !== 'object') {
          errors.push('Missing or invalid drag object');
        }
      }

      // Validate UI
      if (!state.ui || typeof state.ui !== 'object') {
        errors.push('Missing or invalid ui object');
      } else {
        if (typeof state.ui.sidebarOpen !== 'boolean') {
          errors.push('sidebarOpen must be boolean');
        }
        if (typeof state.ui.darkMode !== 'boolean') {
          errors.push('darkMode must be boolean');
        }
        if (!state.ui.display || typeof state.ui.display !== 'object') {
          errors.push('Missing or invalid display object');
        } else {
          if (typeof state.ui.display.sharp !== 'boolean') {
            errors.push('sharp display must be boolean');
          }
          if (typeof state.ui.display.flat !== 'boolean') {
            errors.push('flat display must be boolean');
          }
          // At least one accidental must be active
          if (!state.ui.display.sharp && !state.ui.display.flat) {
            errors.push('At least one accidental type must be enabled');
          }
        }
      }

      // Validate belts
      if (!state.belts || typeof state.belts !== 'object') {
        errors.push('Missing or invalid belts object');
      } else {
        if (!['horizontal', 'vertical'].includes(state.belts.orientation)) {
          errors.push('belts orientation must be "horizontal" or "vertical"');
        }
        if (typeof state.belts.init !== 'boolean') {
          errors.push('belts init must be boolean');
        }
      }

      // Validate dimensions
      if (!state.dimensions || typeof state.dimensions !== 'object') {
        errors.push('Missing or invalid dimensions object');
      } else {
        const requiredDims = ['size', 'cx', 'cy', 'dpr'];
        requiredDims.forEach(dim => {
          if (typeof state.dimensions[dim] !== 'number' || !isFinite(state.dimensions[dim])) {
            errors.push(`Invalid ${dim}: must be a finite number`);
          }
        });
      }

      // Validate playback
      if (!state.playback || typeof state.playback !== 'object') {
        errors.push('Missing or invalid playback object');
      } else {
        if (typeof state.playback.isPlaying !== 'boolean') {
          errors.push('isPlaying must be boolean');
        }
        if (!Array.isArray(state.playback.sequence)) {
          errors.push('sequence must be an array');
        }
      }

      if (errors.length > 0) {
        console.warn('State validation errors:', errors);
        return false;
      }

      return true;

    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.APP);
      return false;
    }
  }

  /**
   * Record state update for debugging
   * @param {string} path - Path that was updated
   * @param {*} oldValue - Previous value
   * @param {*} newValue - New value
   */
  static recordUpdate(path, oldValue, newValue) {
    try {
      this.updateHistory.push({
        timestamp: Date.now(),
        path,
        oldValue: this.deepClone(oldValue),
        newValue: this.deepClone(newValue)
      });

      // Limit history size
      if (this.updateHistory.length > this.maxHistorySize) {
        this.updateHistory.shift();
      }
    } catch (error) {
      // Silent fail for history recording
    }
  }

  /**
   * Deep clone a value (handles primitives, objects, arrays)
   * @param {*} value - Value to clone
   * @returns {*} Cloned value
   */
  static deepClone(value) {
    try {
      if (value === null || typeof value !== 'object') {
        return value;
      }
      
      if (value instanceof Date) {
        return new Date(value);
      }
      
      if (Array.isArray(value)) {
        return value.map(item => this.deepClone(item));
      }
      
      const cloned = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(value[key]);
        }
      }
      return cloned;
    } catch (error) {
      // Fallback to JSON clone for complex objects
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (jsonError) {
        return value; // Return original if all else fails
      }
    }
  }

  /**
   * Deep equality check
   * @param {*} a - First value
   * @param {*} b - Second value
   * @returns {boolean} True if values are deeply equal
   */
  static deepEqual(a, b) {
    try {
      if (a === b) return true;
      
      if (a === null || b === null) return a === b;
      if (typeof a !== typeof b) return false;
      if (typeof a !== 'object') return a === b;
      
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get nested object value by path string
   * @param {object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {*} Value at path or undefined
   */
  static getNestedValue(obj, path) {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Set nested value in object by path
   * @param {object} obj - Object to update
   * @param {string} path - Dot-separated path
   * @param {*} value - New value
   */
  static setNestedValue(obj, path, value) {
    try {
      const keys = path.split('.');
      const lastKey = keys.pop();
      
      // Navigate to parent object
      let current = obj;
      for (const key of keys) {
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Record the update
      const oldValue = current[lastKey];
      this.recordUpdate(path, oldValue, value);
      
      // Set the final value
      current[lastKey] = value;
      
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.APP);
    }
  }

  /**
   * Safe state update with validation
   * @param {object} state - State object to update
   * @param {string} path - Dot-separated path to update
   * @param {*} value - New value
   * @param {Function} validator - Optional validation function
   * @returns {boolean} True if update succeeded
   */
  static updateState(state, path, value, validator = null) {
    try {
      // Validate inputs
      if (!state || typeof state !== 'object') {
        throw new Error('Invalid state object');
      }
      
      if (!path || typeof path !== 'string') {
        throw new Error('Invalid path');
      }

      // Get current value for comparison
      const currentValue = this.getNestedValue(state, path);
      
      // Skip update if value hasn't changed (avoid unnecessary work)
      if (this.deepEqual(currentValue, value)) {
        return true;
      }

      // Run validator if provided
      if (validator && typeof validator === 'function') {
        const validationResult = validator(value, currentValue);
        if (validationResult !== true) {
          console.warn(`Validation failed for ${path}:`, validationResult);
          return false;
        }
      }

      // Perform update
      this.setNestedValue(state, path, value);

      return true;

    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.APP, () => {
        console.warn(`State update failed for path: ${path}`);
      });
      return false;
    }
  }

  /**
   * Get update history for debugging
   * @param {number} count - Number of recent updates to return
   * @returns {Array} Recent state updates
   */
  static getUpdateHistory(count = 10) {
    return this.updateHistory.slice(-count);
  }

  /**
   * Clear update history
   */
  static clearHistory() {
    this.updateHistory = [];
  }

  /**
   * Check state consistency
   * @param {object} state - State to check
   * @returns {object} Consistency report
   */
  static checkConsistency(state) {
    try {
      const issues = [];
      
      // Check ring angle ranges (should be 0 to 2π)
      if (state.rings) {
        Object.entries(state.rings).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (value < 0 || value >= Math.PI * 2) {
              issues.push(`Ring ${key} angle out of range: ${value}`);
            }
          }
        });
      }
      
      // Check dimension consistency
      if (state.dimensions) {
        const { size, cx, cy } = state.dimensions;
        if (size > 0) {
          const expectedCenter = size / 2;
          if (Math.abs(cx - expectedCenter) > 0.1 || Math.abs(cy - expectedCenter) > 0.1) {
            issues.push(`Center coordinates don't match size: cx=${cx}, cy=${cy}, expected=${expectedCenter}`);
          }
        }
      }
      
      // Check playback consistency
      if (state.playback) {
        if (state.playback.isPlaying && (!state.playback.sequence || state.playback.sequence.length === 0)) {
          issues.push('Playback is playing but sequence is empty');
        }
        if (!state.playback.isPlaying && state.playback.currentNoteIndex !== null) {
          issues.push('Playback not playing but currentNoteIndex is set');
        }
      }
      
      return {
        isConsistent: issues.length === 0,
        issues,
        timestamp: Date.now()
      };
      
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.APP);
      return {
        isConsistent: false,
        issues: ['Error during consistency check'],
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get state statistics for monitoring
   * @param {object} state - State to analyze
   * @returns {object} State statistics
   */
  static getStateStats(state) {
    try {
      return {
        totalProperties: this._countProperties(state),
        memoryEstimate: this._estimateMemoryUsage(state),
        updateHistorySize: this.updateHistory.length,
        lastValidation: this.validateState(state),
        consistency: this.checkConsistency(state),
      };
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.APP);
      return null;
    }
  }

  /**
   * Count total properties in state object
   * @param {*} obj - Object to count
   * @returns {number} Property count
   */
  static _countProperties(obj) {
    if (typeof obj !== 'object' || obj === null) return 0;
    
    let count = 0;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        count++;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          count += this._countProperties(obj[key]);
        }
      }
    }
    return count;
  }

  /**
   * Estimate memory usage of state object
   * @param {*} obj - Object to measure
   * @returns {number} Estimated bytes
   */
  static _estimateMemoryUsage(obj) {
    try {
      const jsonString = JSON.stringify(obj);
      return jsonString.length * 2; // Rough estimate (UTF-16)
    } catch (error) {
      return 0;
    }
  }
}