// (file path: js/core/ActionController.js)

import { appState } from '../state/appState.js';
import { startPlayback, stopPlayback } from '../playback.js';
import { startSnap } from './animation.js';
import { savePreferences } from '../services/PreferencesService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { CONFIG } from './constants.js';

/**
 * Enhanced centralized controller for all state-changing actions in the application.
 * Updated to work with both original and new state structure for compatibility.
 */
export const ActionController = {
  
  /**
   * Toggle accidental display (sharp/flat)
   * @param {string} type - 'sharp' or 'flat'
   */
  toggleAccidental(type) {
    try {
      if (!['sharp', 'flat'].includes(type)) {
        throw new Error(`Invalid accidental type: ${type}`);
      }

      const currentValue = appState.display[type];
      const newValue = !currentValue;
      
      // Validate that at least one accidental will remain active
      const otherType = type === 'sharp' ? 'flat' : 'sharp';
      const otherValue = appState.display[otherType];
      
      if (!newValue && !otherValue) {
        // If turning off this type would leave no accidentals, turn on the other
        appState.display[otherType] = true;
      }
      
      appState.display[type] = newValue;
      
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  },

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    try {
      const newDarkMode = !appState.ui.darkMode;
      
      appState.ui.darkMode = newDarkMode;
      
      // Update DOM class
      document.body.classList.toggle('dark-mode', newDarkMode);
      
      // Save preference
      savePreferences({ darkMode: newDarkMode });
      
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI, () => {
        // Fallback: just toggle the class without state update
        document.body.classList.toggle('dark-mode');
      });
    }
  },

  /**
   * Toggle audio playback
   */
  togglePlayback() {
    try {
      if (appState.playback.isPlaying) {
        stopPlayback();
      } else if (!appState.drag.active && !appState.animation) {
        startPlayback();
      }
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.AUDIO);
    }
  },

  /**
   * Toggle sidebar open/closed
   * @param {boolean} forceState - Force specific state (optional)
   */
  toggleSidebar(forceState) {
    try {
      const newState = typeof forceState === 'boolean' ? forceState : !appState.ui.sidebarOpen;
      appState.ui.sidebarOpen = newState;
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  },

  /**
   * Set layout orientation
   * @param {string} orientation - 'horizontal' or 'vertical'
   */
  setOrientation(orientation) {
    try {
      if (!['horizontal', 'vertical'].includes(orientation)) {
        throw new Error(`Invalid orientation: ${orientation}`);
      }
      
      if (appState.belts.orientation === orientation) {
        return; // No change needed
      }
      
      // Update state
      appState.belts.orientation = orientation;
      
      // Reset ring positions for layout change
      appState.rings.pitchClass = 0;
      appState.rings.degree = 0;
      appState.rings.chromatic = 0;
      appState.rings.highlightPosition = 0;
      
      // Reset belts initialization
      appState.belts.init = false;
      
      // Update DOM class
      const mainContainer = document.querySelector('.main-container');
      if (mainContainer) {
        mainContainer.classList.toggle('vertical-layout', orientation === 'vertical');
      }
      
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  },
  
  /**
   * Start snap animation to targets
   * @param {object} targets - Target angles for rings
   * @param {Function} onComplete - Callback when animation completes
   */
  snapTo(targets, onComplete) {
    try {
      startSnap(targets, onComplete);
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.ANIMATION);
    }
  },

  /**
   * Set a ring angle directly (for internal use by actions.js)
   * @param {string} ringName - Name of the ring
   * @param {number} angle - New angle value
   */
  setRingAngle(ringName, angle) {
    try {
      const validRings = ['pitchClass', 'degree', 'chromatic', 'highlightPosition'];
      if (!validRings.includes(ringName)) {
        throw new Error(`Invalid ring name: ${ringName}`);
      }
      
      if (typeof angle !== 'number' || !isFinite(angle)) {
        throw new Error(`Invalid angle value: ${angle}`);
      }
      
      appState.rings[ringName] = angle;
      
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  },

  /**
   * Reset all rings to default positions
   */
  resetRings() {
    try {
      appState.rings.pitchClass = 0;
      appState.rings.degree = 0;
      appState.rings.chromatic = 0;
      appState.rings.highlightPosition = 0;
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  },

  /**
   * Get current state summary for debugging
   * @returns {object} Current state summary
   */
  getStateSummary() {
    try {
      return {
        rings: { ...appState.rings },
        ui: {
          sidebarOpen: appState.ui.sidebarOpen,
          darkMode: appState.ui.darkMode,
          display: { sharp: appState.display.sharp, flat: appState.display.flat },
        },
        belts: {
          orientation: appState.belts.orientation,
          init: appState.belts.init,
        },
        playback: {
          isPlaying: appState.playback.isPlaying,
        },
        interaction: {
          isDragging: !!appState.drag.active,
          isAnimating: !!appState.animation,
        },
      };
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.APP);
      return null;
    }
  },
};