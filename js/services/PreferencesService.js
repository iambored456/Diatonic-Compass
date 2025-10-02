// (file path: js/services/PreferencesService.js)

import { ErrorHandler } from '../utils/ErrorHandler.js';

const PREFERENCES_KEY = 'diatonicCompassPreferences';
const BACKUP_KEY = 'diatonicCompassPreferencesBackup';

/**
 * Saves user preferences to localStorage with error handling and backup.
 * @param {object} prefs - The preferences object to save (e.g., { darkMode: true }).
 * @returns {boolean} True if save was successful
 */
export function savePreferences(prefs) {
  try {
    // Validate input
    if (!prefs || typeof prefs !== 'object') {
      throw new Error('Invalid preferences object');
    }

    // Check if localStorage is available
    if (!ErrorHandler.isFeatureSupported('localStorage')) {
      console.warn('localStorage not available - preferences will not persist');
      return false;
    }

    // Get existing preferences to merge
    const existing = loadPreferences() || {};
    const merged = { ...existing, ...prefs };
    
    // Validate merged preferences
    const validated = validatePreferences(merged);
    
    const json = JSON.stringify(validated);
    
    // Try to save backup first
    try {
      localStorage.setItem(BACKUP_KEY, localStorage.getItem(PREFERENCES_KEY) || '{}');
    } catch (backupError) {
      // Backup failed but continue with main save
      console.warn('Could not create preferences backup');
    }
    
    // Save main preferences
    localStorage.setItem(PREFERENCES_KEY, json);
    
    return true;
    
  } catch (error) {
    ErrorHandler.handle(error, 'LocalStorage', () => {
      console.warn('Preferences could not be saved - will use session defaults');
    });
    return false;
  }
}

/**
 * Loads user preferences from localStorage with error handling and recovery.
 * @returns {object | null} The loaded preferences object, or null if none exist or an error occurs.
 */
export function loadPreferences() {
  try {
    // Check if localStorage is available
    if (!ErrorHandler.isFeatureSupported('localStorage')) {
      return getDefaultPreferences();
    }

    const json = localStorage.getItem(PREFERENCES_KEY);
    
    if (!json) {
      return null;
    }

    const preferences = JSON.parse(json);
    
    // Validate loaded preferences
    const validated = validatePreferences(preferences);
    
    // If validation changed the preferences, save the corrected version
    if (JSON.stringify(validated) !== json) {
      console.log('Preferences were corrected during load - saving updated version');
      savePreferences(validated);
    }
    
    return validated;
    
  } catch (error) {
    ErrorHandler.handle(error, 'LocalStorage', () => {
      // Try to load from backup
      const backup = loadBackupPreferences();
      if (backup) {
        console.log('Loaded preferences from backup');
        return backup;
      }
    });
    
    // Return defaults if everything fails
    return getDefaultPreferences();
  }
}

/**
 * Load preferences from backup
 * @returns {object | null} Backup preferences or null
 */
function loadBackupPreferences() {
  try {
    const backupJson = localStorage.getItem(BACKUP_KEY);
    if (backupJson) {
      const backup = JSON.parse(backupJson);
      return validatePreferences(backup);
    }
  } catch (error) {
    console.warn('Could not load backup preferences');
  }
  return null;
}

/**
 * Validate and sanitize preferences object
 * @param {object} prefs - Preferences to validate
 * @returns {object} Validated preferences
 */
function validatePreferences(prefs) {
  if (!prefs || typeof prefs !== 'object') {
    return getDefaultPreferences();
  }
  
  const defaults = getDefaultPreferences();
  const validated = {};
  
  // Validate each preference with type checking
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (key in prefs) {
      const value = prefs[key];
      const expectedType = typeof defaultValue;
      
      if (typeof value === expectedType) {
        // Additional validation for specific keys
        switch (key) {
          case 'darkMode':
            validated[key] = Boolean(value);
            break;
          case 'orientation':
            validated[key] = ['horizontal', 'vertical'].includes(value) ? value : defaultValue;
            break;
          case 'volume':
            validated[key] = Math.max(0, Math.min(1, Number(value))) || defaultValue;
            break;
          case 'tutorialCompleted':
            validated[key] = Boolean(value);
            break;
          case 'beltOrder':
            // Validate belt order array
            if (Array.isArray(value)) {
              const requiredBelts = ['pitch', 'degree', 'intervals', 'chromatic'];
              const hasAllBelts = requiredBelts.every(belt => value.includes(belt));
              if (hasAllBelts && value.length === requiredBelts.length) {
                validated[key] = [...value]; // Clone array
              } else {
                validated[key] = defaultValue;
              }
            } else {
              validated[key] = defaultValue;
            }
            break;
          case 'cursorColor':
            validated[key] = ['red', 'blue', 'green', 'yellow'].includes(value) ? value : defaultValue;
            break;
          case 'cursorFill':
            validated[key] = Boolean(value);
            break;
          default:
            validated[key] = value;
        }
      } else {
        console.warn(`Invalid type for preference ${key}: expected ${expectedType}, got ${typeof value}`);
        validated[key] = defaultValue;
      }
    } else {
      validated[key] = defaultValue;
    }
  }
  
  // Remove any unknown preferences to keep storage clean
  return validated;
}

/**
 * Get default preferences
 * @returns {object} Default preferences object
 */
function getDefaultPreferences() {
  return {
    darkMode: false,
    orientation: 'horizontal',
    volume: 0.5,
    tutorialCompleted: false,
    showAdvancedControls: false,
    beltOrder: ['pitch', 'degree', 'intervals', 'chromatic'],
    cursorColor: 'red',
    cursorFill: false
  };
}

/**
 * Reset preferences to defaults
 * @returns {boolean} True if reset was successful
 */
export function resetPreferences() {
  try {
    if (ErrorHandler.isFeatureSupported('localStorage')) {
      localStorage.removeItem(PREFERENCES_KEY);
      localStorage.removeItem(BACKUP_KEY);
    }
    return true;
  } catch (error) {
    ErrorHandler.handle(error, 'LocalStorage');
    return false;
  }
}

/**
 * Get a specific preference with fallback
 * @param {string} key - Preference key
 * @param {*} fallback - Fallback value if not found
 * @returns {*} Preference value or fallback
 */
export function getPreference(key, fallback = null) {
  try {
    const prefs = loadPreferences();
    return prefs && key in prefs ? prefs[key] : fallback;
  } catch (error) {
    ErrorHandler.handle(error, 'LocalStorage');
    return fallback;
  }
}

/**
 * Set a specific preference
 * @param {string} key - Preference key
 * @param {*} value - Preference value
 * @returns {boolean} True if successful
 */
export function setPreference(key, value) {
  try {
    return savePreferences({ [key]: value });
  } catch (error) {
    ErrorHandler.handle(error, 'LocalStorage');
    return false;
  }
}

/**
 * Check if preferences are available (localStorage working)
 * @returns {boolean} True if preferences can be saved/loaded
 */
export function arePreferencesAvailable() {
  return ErrorHandler.isFeatureSupported('localStorage');
}

/**
 * Get preferences storage info for debugging
 * @returns {object} Storage information
 */
export function getPreferencesInfo() {
  try {
    const prefs = loadPreferences();
    const size = localStorage.getItem(PREFERENCES_KEY)?.length || 0;
    
    return {
      available: arePreferencesAvailable(),
      size: size,
      preferences: prefs,
      hasBackup: !!localStorage.getItem(BACKUP_KEY)
    };
  } catch (error) {
    ErrorHandler.handle(error, 'LocalStorage');
    return {
      available: false,
      size: 0,
      preferences: null,
      hasBackup: false
    };
  }
}