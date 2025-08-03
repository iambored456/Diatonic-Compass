// (file path: js/state/appState.js)

import { CONFIG } from '../core/constants.js';

/**
 * Application state with improved organization while maintaining compatibility
 * Keeps existing structure but adds logical groupings where possible
 */
export const appState = {
  // === CORE MUSICAL STATE (unchanged) ===
  rings: {
    pitchClass: 0,        // Rotation of the pitch class ring (outer)
    degree: 0,            // Rotation of the degree ring (middle)
    chromatic: 0,         // Rotation of the chromatic ring (inner)
    highlightPosition: 0, // Position of the scale degree highlight
  },

  // === DRAG STATE (unchanged for compatibility) ===
  drag: { 
    active: null,           // Which element is being dragged
    startX: 0,              // Initial drag X position
    startY: 0,              // Initial drag Y position
    startPitchClass: 0,     // Initial pitch class angle
    startDegree: 0,         // Initial degree angle
    startChrom: 0,          // Initial chromatic angle
    startHighlight: 0,      // Initial highlight angle
  },

  // === ANIMATION STATE (unchanged for compatibility) ===
  animation: null,          // Current animation object (null when not animating)

  // === COMPONENT STATE (unchanged for compatibility) ===
  belts: { 
    itemSize: {},           // Size of belt items for each belt type
    tracks: {},             // References to belt track elements
    init: false,            // Whether belts are initialized
    orientation: 'horizontal', // 'horizontal' or 'vertical'
  },
  
  dimensions: { 
    size: 0,              // Canvas size (square)
    cx: 0,                // Center X coordinate
    cy: 0,                // Center Y coordinate
    dpr: 1,               // Device pixel ratio
  },

  // === AUDIO/PLAYBACK STATE (unchanged for compatibility) ===
  playback: {
    isPlaying: false,       // Whether scale is currently playing
    currentNoteIndex: null, // Index of currently playing note
    sequence: [],           // Array of note indices to play
    timeoutId: null,        // Timeout ID for next note
    audioContext: null,     // Web Audio API context
    rootNoteIndexForPlayback: null, // Root note when playback started
  },

  // === DISPLAY PREFERENCES (unchanged for compatibility) ===
  display: {
    sharp: true,            // Show sharp note names
    flat: true,             // Show flat note names
  },

  // === NEW: UI STATE (organized additions) ===
  ui: {
    sidebarOpen: false,     // Whether settings sidebar is open
    darkMode: false,        // Dark mode toggle
    
    // Future UI state can be added here
    display: {              // Reference to main display for consistency
      get sharp() { return appState.display.sharp; },
      get flat() { return appState.display.flat; },
      set sharp(value) { appState.display.sharp = value; },
      set flat(value) { appState.display.flat = value; },
    },
  },
};

/**
 * Get default state values
 * @returns {object} Default state object
 */
export function getDefaultState() {
  return {
    rings: {
      pitchClass: 0,
      degree: 0,
      chromatic: 0,
      highlightPosition: 0,
    },
    drag: { 
      active: null, startX: 0, startY: 0, 
      startPitchClass: 0, startDegree: 0, startChrom: 0, startHighlight: 0 
    },
    animation: null,
    belts: { 
      itemSize: {}, 
      tracks: {}, 
      init: false,
      orientation: 'horizontal',
    },
    dimensions: { 
      size: 0, cx: 0, cy: 0, dpr: 1 
    },
    playback: { 
      isPlaying: false, currentNoteIndex: null, sequence: [], 
      timeoutId: null, audioContext: null, rootNoteIndexForPlayback: null 
    },
    display: { 
      sharp: true, flat: true 
    },
    ui: {
      sidebarOpen: false,
      darkMode: false,
    },
  };
}

/**
 * Reset state to defaults
 * @param {object} state - State object to reset
 * @param {Array<string>} sections - Specific sections to reset (optional)
 */
export function resetState(state, sections = null) {
  const defaults = getDefaultState();
  
  if (sections) {
    // Reset only specified sections
    sections.forEach(section => {
      if (section in defaults) {
        Object.assign(state[section], defaults[section]);
      }
    });
  } else {
    // Reset entire state
    Object.assign(state, defaults);
  }
}

/**
 * Get state summary for debugging
 * @param {object} state - State object
 * @returns {object} State summary
 */
export function getStateSummary(state) {
  return {
    rings: { ...state.rings },
    ui: {
      sidebarOpen: state.ui.sidebarOpen,
      darkMode: state.ui.darkMode,
      display: { sharp: state.display.sharp, flat: state.display.flat },
    },
    belts: {
      orientation: state.belts.orientation,
      init: state.belts.init,
    },
    playback: {
      isPlaying: state.playback.isPlaying,
    },
    interaction: {
      isDragging: !!state.drag.active,
      isAnimating: !!state.animation,
    },
  };
}