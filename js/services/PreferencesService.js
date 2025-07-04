// (file path: js/services/PreferencesService.js)

const PREFERENCES_KEY = 'diatonicCompassPreferences';

/**
 * Saves user preferences to localStorage.
 * @param {object} prefs - The preferences object to save (e.g., { darkMode: true }).
 */
export function savePreferences(prefs) {
  try {
    const json = JSON.stringify(prefs);
    localStorage.setItem(PREFERENCES_KEY, json);
  } catch (error) {
    console.error("Could not save preferences to localStorage.", error);
  }
}

/**
 * Loads user preferences from localStorage.
 * @returns {object | null} The loaded preferences object, or null if none exist or an error occurs.
 */
export function loadPreferences() {
  try {
    const json = localStorage.getItem(PREFERENCES_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error("Could not load preferences from localStorage.", error);
    return null;
  }
}