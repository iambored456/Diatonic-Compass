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
    
    // Apply saved belt order
    if (Array.isArray(savedPrefs.beltOrder)) {
      const requiredBelts = ['pitch', 'degree', 'intervals', 'chromatic'];
      const hasAllBelts = requiredBelts.every(belt => savedPrefs.beltOrder.includes(belt));
      if (hasAllBelts && savedPrefs.beltOrder.length === requiredBelts.length) {
        appState.belts.order = savedPrefs.beltOrder;
        
        // Apply order immediately to DOM elements
        const beltsContainer = document.querySelector('.belts-container');
        if (beltsContainer) {
          const beltMapping = {
            'pitch': '.pitch-belt',
            'degree': '.degree-belt', 
            'intervals': '.interval-brackets-wrapper',
            'chromatic': '.chromatic-belt'
          };
          
          savedPrefs.beltOrder.forEach((beltId, index) => {
            const selector = beltMapping[beltId];
            if (selector) {
              const element = beltsContainer.querySelector(selector);
              if (element) {
                element.style.order = index + 1;
              }
            }
          });
        }
      }
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