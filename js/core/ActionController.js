// (file path: js/core/ActionController.js)

import { appState } from '../state/appState.js';
import { startPlayback, stopPlayback } from '../playback.js';
import { startSnap } from './animation.js';
// --- ADDED: Import the new service ---
import { savePreferences } from '../services/PreferencesService.js';

/**
 * A centralized controller for all state-changing actions in the application.
 * This makes the app scriptable and easy to control from any component.
 */
export const ActionController = {
  
  toggleAccidental(type) {
    appState.display[type] = !appState.display[type];
    // Ensure at least one accidental is always active
    if (!appState.display.sharp && !appState.display.flat) {
      const otherType = type === 'sharp' ? 'flat' : 'sharp';
      appState.display[otherType] = true;
    }
  },

  toggleDarkMode() {
    appState.ui.darkMode = !appState.ui.darkMode;
    document.body.classList.toggle('dark-mode', appState.ui.darkMode);
    // --- ADDED: Save the preference ---
    savePreferences({ darkMode: appState.ui.darkMode });
  },

  togglePlayback() {
    if (appState.playback.isPlaying) {
      stopPlayback();
    } else if (!appState.drag.active && !appState.animation) {
      startPlayback();
    }
  },

  toggleSidebar(forceState) {
    appState.ui.sidebarOpen = typeof forceState === 'boolean' ? forceState : !appState.ui.sidebarOpen;
  },

  setOrientation(orientation) {
    if (appState.belts.orientation === orientation) return; // No change needed
    appState.belts.orientation = orientation;
    
    // Reset state for the change
    appState.rings.pitchClass = 0;
    appState.rings.degree = 0;
    appState.rings.chromatic = 0;
    appState.rings.highlightPosition = 0;
    appState.belts.init = false; // This is the correct place to reset the belts
    
    // This is the only direct DOM manipulation, which is acceptable
    // as it relates to a top-level class on the main container.
    document.querySelector('.main-container').classList.toggle('vertical-layout', orientation === 'vertical');
  },
  
  snapTo(targets, onComplete) {
    startSnap(targets, onComplete);
  }
};