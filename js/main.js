// (file path: js/main.js)
import App from './app.js';
import { appState } from './state/appState.js';
import { loadPreferences } from './services/PreferencesService.js';

// --- ADDED: Logic to apply saved preferences on load ---
function applyInitialPreferences() {
  const savedPrefs = loadPreferences();
  if (savedPrefs) {
    if (typeof savedPrefs.darkMode === 'boolean') {
      appState.ui.darkMode = savedPrefs.darkMode;
      document.body.classList.toggle('dark-mode', savedPrefs.darkMode);
    }
  }
}

// Ensure the DOM is fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved settings before the app initializes to prevent theme flashing
  applyInitialPreferences(); 

  const mainContainer = document.querySelector('.main-container');
  if (mainContainer) {
    new App(mainContainer);
  }
});