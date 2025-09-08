// (file path: js/core/logic.js)

import { CHROMATIC_NOTES, DIATONIC_INTERVALS, DEGREE_MAP, MODE_NAME } from './constants.js';
import { indexAtTop, normAngle } from './math.js';
import { PerformanceUtils } from '../utils/PerformanceUtils.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * Custom key generator for memoization - only includes relevant state
 * @param {Array} args - Function arguments
 * @returns {string} Cache key
 */
function labelCacheKey([state]) {
  const { sharp, flat } = state.display;
  return `${sharp}-${flat}`;
}

/**
 * Custom key generator for result text memoization
 * @param {Array} args - Function arguments  
 * @returns {string} Cache key
 */
function resultCacheKey([state]) {
  const { sharp, flat } = state.display;
  const { pitchClass, degree, chromatic } = state.rings;
  
  // Round angles to reduce cache misses from tiny differences
  const roundedPitch = Math.round(pitchClass * 1000) / 1000;
  const roundedDegree = Math.round(degree * 1000) / 1000;
  const roundedChromatic = Math.round(chromatic * 1000) / 1000;
  
  return `${sharp}-${flat}-${roundedPitch}-${roundedDegree}-${roundedChromatic}`;
}

/**
 * Process a label based on accidental settings
 * @param {string} label - Label to process (may contain '/')
 * @param {boolean} sharp - Whether sharp names are enabled
 * @param {boolean} flat - Whether flat names are enabled
 * @returns {string} Processed label
 */
function applyAccidentalPreference(label, sharp, flat) {
  try {
    if (!label || !label.includes('/')) {
      return label || '';
    }
    
    const [sharpName, flatName] = label.split('/');
    
    // Validate parts exist
    if (!sharpName || !flatName) {
      console.warn(`Invalid label format: ${label}`);
      return label;
    }

    // Return based on settings
    if (sharp && flat) return `${sharpName}<br>${flatName}`;
    if (sharp) return sharpName;
    if (flat) return flatName;

    // Fallback (should not happen due to UI constraints)
    return `${sharpName}<br>${flatName}`;
    
  } catch (error) {
    ErrorHandler.handle(error, 'Logic', () => {
      console.warn(`Label processing failed for: ${label}`);
    });
    return label || '';
  }
}

/**
 * Generate display labels for chromatic and diatonic intervals
 * This function is memoized for performance
 * @param {object} state - App state object
 * @returns {object} Object containing chromaticLabels and diatonicLabels arrays
 */
function _generateDisplayLabels(state) {
  try {
    const { sharp, flat } = state.display;
    
    // Validate display state
    if (typeof sharp !== 'boolean' || typeof flat !== 'boolean') {
      throw new Error('Invalid display state - sharp/flat must be booleans');
    }

    // Process all labels
    const chromaticLabels = CHROMATIC_NOTES.map(label => applyAccidentalPreference(label, sharp, flat));
    const diatonicLabels = DIATONIC_INTERVALS.map(label => applyAccidentalPreference(label, sharp, flat));
    
    // Validate results
    if (chromaticLabels.length !== 12 || diatonicLabels.length !== 12) {
      throw new Error('Invalid label array lengths');
    }

    return { chromaticLabels, diatonicLabels };
    
  } catch (error) {
    ErrorHandler.handle(error, 'Logic', () => {
      console.warn('Falling back to default labels');
    });
    
    // Fallback to basic labels
    return {
      chromaticLabels: CHROMATIC_NOTES.slice(),
      diatonicLabels: DIATONIC_INTERVALS.slice()
    };
  }
}

// Create memoized version of the function
export const generateDisplayLabels = PerformanceUtils.memoize(
  _generateDisplayLabels,
  labelCacheKey,
  50 // Cache up to 50 label combinations
);

/**
 * Calculate the current musical result (key and mode)
 * This function is memoized for performance
 * @param {object} state - App state object
 * @returns {object} Object containing pitch, mode, and formatted result
 */
function _calculateMusicalResult(state) {
  try {
    const { sharp, flat } = state.display;
    const { pitchClass, degree, chromatic } = state.rings;
    
    // Validate ring state
    if (typeof pitchClass !== 'number' || typeof degree !== 'number' || typeof chromatic !== 'number') {
      throw new Error('Invalid ring state - angles must be numbers');
    }

    // Process chromatic labels for pitch names
    const processLabel = (label) => {
      if (!label.includes('/')) return label;
      const [sharpName, flatName] = label.split('/');
      if (sharp && flat) return label; // Keep both for result display
      if (sharp) return sharpName;
      if (flat) return flatName;
      return sharpName; // Default fallback
    };
    
    const chromaticLabels = CHROMATIC_NOTES.map(processLabel);

    // Calculate effective rotations
    const effectivePitchRotation = normAngle(pitchClass - chromatic);
    const effectiveDegreeRotation = normAngle(degree - chromatic);

    // Get indices at top position
    const rootNoteIndex = indexAtTop(effectivePitchRotation);
    const modeDegreeIndex = indexAtTop(effectiveDegreeRotation);
    
    // Validate indices
    if (rootNoteIndex < 0 || rootNoteIndex >= 12 || modeDegreeIndex < 0 || modeDegreeIndex >= 12) {
      throw new Error(`Invalid note indices: root=${rootNoteIndex}, mode=${modeDegreeIndex}`);
    }
    
    // Get pitch and interval names
    const pitch = chromaticLabels[rootNoteIndex];
    const tonicInterval = DIATONIC_INTERVALS[modeDegreeIndex];
    const modeKey = DEGREE_MAP[tonicInterval] || null;
    const modeName = modeKey ? MODE_NAME[modeKey] : '...';
    
    // Validate results
    if (!pitch || !modeName) {
      throw new Error('Could not determine pitch or mode name');
    }
    
    const result = `${pitch} ${modeName}`;
    
    return {
      pitch,
      modeName,
      result,
      rootNoteIndex,
      modeDegreeIndex,
      modeKey
    };
    
  } catch (error) {
    ErrorHandler.handle(error, 'Logic', () => {
      console.warn('Musical result calculation failed');
    });
    
    // Fallback result
    return {
      pitch: 'C',
      modeName: 'Major',
      result: 'C Major',
      rootNoteIndex: 0,
      modeDegreeIndex: 0,
      modeKey: '1'
    };
  }
}

// Create memoized version
const calculateMusicalResult = PerformanceUtils.memoize(
  _calculateMusicalResult,
  resultCacheKey,
  100 // Cache up to 100 musical results
);

/**
 * Update result text element with current musical information
 * @param {object} state - App state object
 * @param {HTMLElement} resultElement - DOM element to update
 */
export function updateResultText(state, resultElement) {
  try {
    // Validate inputs
    if (!state || !resultElement) {
      throw new Error('Invalid state or result element');
    }

    // Calculate result using memoized function
    const musicalResult = calculateMusicalResult(state);
    
    // Only update DOM if text has changed (avoid unnecessary reflows)
    if (resultElement.textContent !== musicalResult.result) {
      resultElement.textContent = musicalResult.result;
    }
    
  } catch (error) {
    ErrorHandler.handle(error, 'Logic', () => {
      // Fallback: set safe default text
      if (resultElement) {
        resultElement.textContent = 'C Major';
      }
    });
  }
}

/**
 * Get detailed musical information for the current state
 * Useful for debugging or advanced displays
 * @param {object} state - App state object
 * @returns {object} Detailed musical information
 */
export function getMusicalInfo(state) {
  try {
    const musicalResult = calculateMusicalResult(state);
    const labels = generateDisplayLabels(state);
    
    return {
      ...musicalResult,
      labels,
      angles: {
        pitchClass: state.rings.pitchClass,
        degree: state.rings.degree,
        chromatic: state.rings.chromatic,
        effectivePitch: normAngle(state.rings.pitchClass - state.rings.chromatic),
        effectiveDegree: normAngle(state.rings.degree - state.rings.chromatic)
      },
      display: {
        sharp: state.display.sharp,
        flat: state.display.flat
      }
    };
    
  } catch (error) {
    ErrorHandler.handle(error, 'Logic');
    return null;
  }
}

/**
 * Validate musical state for consistency
 * @param {object} state - App state object
 * @returns {boolean} True if state is valid
 */
export function validateMusicalState(state) {
  try {
    if (!state || typeof state !== 'object') {
      return false;
    }
    
    // Check required properties exist
    const requiredPaths = [
      'rings.pitchClass',
      'rings.degree', 
      'rings.chromatic',
      'display.sharp',
      'display.flat'
    ];
    
    for (const path of requiredPaths) {
      const value = getNestedValue(state, path);
      if (value === undefined || value === null) {
        console.warn(`Missing required state property: ${path}`);
        return false;
      }
    }
    
    // Validate types
    const { pitchClass, degree, chromatic } = state.rings;
    if (typeof pitchClass !== 'number' || typeof degree !== 'number' || typeof chromatic !== 'number') {
      console.warn('Ring angles must be numbers');
      return false;
    }
    
    // Validate ranges (angles should be 0 to 2π)
    const angles = [pitchClass, degree, chromatic];
    for (const angle of angles) {
      if (angle < 0 || angle >= Math.PI * 2 || !isFinite(angle)) {
        console.warn(`Invalid angle value: ${angle}`);
        return false;
      }
    }
    
    // Validate display settings
    const { sharp, flat } = state.display;
    if (typeof sharp !== 'boolean' || typeof flat !== 'boolean') {
      console.warn('Display settings must be booleans');
      return false;
    }
    
    // At least one accidental must be enabled
    if (!sharp && !flat) {
      console.warn('At least one accidental type must be enabled');
      return false;
    }
    
    return true;
    
  } catch (error) {
    ErrorHandler.handle(error, 'Logic');
    return false;
  }
}

/**
 * Get nested object value by path string
 * @param {object} obj - Object to search
 * @param {string} path - Dot-separated path
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  } catch (error) {
    return undefined;
  }
}

/**
 * Clear all memoization caches (useful for testing or memory management)
 */
export function clearLogicCaches() {
  try {
    generateDisplayLabels.clearCache();
    calculateMusicalResult.clearCache();
    console.log('Logic caches cleared');
  } catch (error) {
    ErrorHandler.handle(error, 'Logic');
  }
}

/**
 * Get cache statistics for performance monitoring
 * @returns {object} Cache statistics
 */
export function getLogicCacheStats() {
  try {
    return {
      displayLabels: generateDisplayLabels.getCacheStats(),
      musicalResult: calculateMusicalResult.getCacheStats()
    };
  } catch (error) {
    ErrorHandler.handle(error, 'Logic');
    return { displayLabels: null, musicalResult: null };
  }
}