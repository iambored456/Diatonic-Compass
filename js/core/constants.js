// (file path: js/core/constants.js)

/**
 * Centralized configuration for Diatonic Compass
 * All magic numbers and configuration values are organized here
 */

// === MUSICAL DATA ===
export const CHROMATIC_NOTES = [
  'C','C♯/D♭','D','D♯/E♭','E','F',
  'F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'
];

export const DIATONIC_INTERVALS = [
  '1','♯1/♭2','2','♯2/♭3','3','4',
  '♯4/♭5','5','♯5/♭6','6','♯6/♭7','7'
];

export const SEMITONES = [...Array(12).keys()];
export const CHROMATIC_DIVISIONS = 12; // Number of semitones in an octave
export const DIATONIC_DEGREE_INDICES = [0,2,4,5,7,9,11];

export const PIANO_KEY_COLOUR = {
  'C':true,'C♯/D♭':false,'D':true,'D♯/E♭':false,'E':true,'F':true,
  'F♯/G♭':false,'G':true,'G♯/A♭':false,'A':true,'A♯/B♭':false,'B':true
};

export const FIXED_INTERVAL_COLOUR = {
  // Diatonic degrees (original colors)
  0:'#f090ae', // 1
  2:'#ea9e5e', // 2
  4:'#a8bd61', // 3
  5:'#76c788', // 4
  7:'#33c6dc', // 5
  9:'#94adff', // 6
  11:'#dd95d6', // 7
  // Chromatic degrees (new colors)
  1:'#a46055',  // #1/b2
  3:'#8a722f',  // #2/b3
  6:'#258677',  // #4/b5
  8:'#3d7ca5',  // #5/b6
  10:'#7d68a3'  // #6/b7
};

export const MODE_SCALE_DEGREES = {
  '1':[0,2,4,5,7,9,11], '2':[0,2,3,5,7,9,10], '3':[0,1,3,5,7,8,10],
  '4':[0,2,4,6,7,9,11], '5':[0,2,4,5,7,9,10], '6':[0,2,3,5,7,8,10], '7':[0,1,3,5,6,8,10]
};

export const DEGREE_MAP = {
  '1':'1','♯1/♭2':'2','2':'2','♯2/♭3':'3','3':'3','4':'4',
  '♯4/♭5':'5','5':'5','♯5/♭6':'6','6':'6','♯6/♭7':'7','7':'7'
};

export const MODE_NAME = { 
  '1':'Major','2':'Dorian','3':'Phrygian','4':'Lydian','5':'Mixolydian','6':'Minor','7':'Locrian' 
};

export const MAJOR_SCALE_INTERVAL_STEPS = [2,2,1,2,2,2,1];

// === MATHEMATICAL CONSTANTS ===
export const TAU = Math.PI * 2;
export const ANGLE_STEP = TAU / 12;

// === CENTRALIZED CONFIGURATION ===
export const CONFIG = {
  // Animation settings
  ANIMATION: {
    DURATION_MS: 300,
    EASING_FUNCTION: 'easeInOutQuad',
    REDUCED_MOTION_DURATION_MS: 150, // Shorter for accessibility
  },

  // Wheel/Canvas settings
  WHEEL: {
    SEGMENTS: 12,
    RADII: {
      OUTER: 0.5,    // Pitch ring (outer)
      MIDDLE: 0.35,  // Degree ring (middle)  
      INNER: 0.2,    // Chromatic ring (inner)
      INNER_CONTENT: 0.125, // Inner marker start
    },
    FONTS: {
      OUTER_FACTOR: 0.057,   // For pitch names (C, C#, etc.)
      MIDDLE_FACTOR: 0.052,  // For degree names (1, #1/b2, etc.)
      INNER_FACTOR: 0.042,   // For chromatic numbers (0-11)
      FAMILY: "'Atkinson Hyperlegible Next', system-ui, sans-serif",
    },
    STROKE: {
      WIDTH_FACTOR: 0.002,   // Ring border width
      MARKER_WIDTH_FACTOR: 0.006, // Red marker width
    },
  },

  // Belt settings
  BELTS: {
    REPETITIONS: 3,           // How many times belt content repeats
    VISIBLE_CELLS: 12,        // Cells visible at once
    TOTAL_CELLS: 39,          // Total cells (12 * 3 + 3)
    TEXT_STACK_THRESHOLD: 45, // Min height to stack sharp/flat text
    TRANSITION_DURATION: '0.3s', // CSS transition for belt updates
  },

  // Audio settings
  AUDIO: {
    BASE_FREQUENCY: 261.63,   // C4 frequency in Hz
    NOTE_DURATION_MS: 250,    // How long each note plays
    PAUSE_BETWEEN_NOTES_MS: 50, // Pause between notes
    ATTACK_TIME_SEC: 0.01,    // Note attack (fade in)
    MAX_RELEASE_TIME_SEC: 0.1, // Maximum note release (fade out)
    RELEASE_RATIO: 0.3,       // Release time as ratio of note duration
    VOLUME: 0.3,              // Master volume (0-1)
    WAVEFORM: 'sine',         // Oscillator waveform
  },

  // Performance settings
  PERFORMANCE: {
    RESIZE_DEBOUNCE_MS: 150,  // Debounce window resize events
    MEMOIZE_CACHE_SIZE: {
      LABELS: 50,             // Cache size for label generation
      MUSICAL_RESULTS: 100,   // Cache size for musical calculations
    },
    FPS_MONITOR_INTERVAL: 120, // Frames between FPS measurements
    MEMORY_CHECK_INTERVAL_MS: 30000, // How often to check memory usage
    MEMORY_WARNING_THRESHOLD_MB: 100, // Warn if memory usage exceeds this
  },

  // Canvas/Display settings
  CANVAS: {
    MAX_DEVICE_PIXEL_RATIO: 3, // Cap DPR for performance
    MAX_BUFFER_SIZE: 4096,     // Maximum canvas buffer size (4K)
    GUTTER_FACTOR: 0.02,       // Canvas padding factor
    OPTIMIZATION: {
      IMAGE_SMOOTHING: true,
      IMAGE_SMOOTHING_QUALITY: 'high',
      WILL_READ_FREQUENTLY: false,
      ALPHA: true,
    },
  },

  // UI/Layout settings
  UI: {
    SIDEBAR_WIDTH: '18.75rem',        // 300px
    SIDEBAR_MAX_WIDTH: '80%',         // Mobile max width
    SIDEBAR_TRANSITION_DURATION: '0.3s',
    SETTINGS_BUTTON: {
      SIZE: '3.125rem',               // 50px
      ICON_SIZE: '2rem',              // 32px
      POSITION: {
        TOP: '1.25rem',               // 20px
        RIGHT: '1.25rem',             // 20px
      },
    },
    RESULT_CONTAINER: {
      MAX_WIDTH: '28.125rem',         // 450px
      HEIGHT: '3.75rem',              // 60px
      FONT_SIZE: '1.8rem',
    },
    ACCIDENTAL_TOGGLE: {
      FONT_SIZE: '1.625rem',
      OPACITY_INACTIVE: 0.4,
      OPACITY_ACTIVE: 1,
    },
  },

  // Responsive breakpoints
  RESPONSIVE: {
    ORIENTATION_SWITCH_RATIO: 1,      // width/height ratio for vertical layout
    MOBILE_MAX_WIDTH: '50rem',        // Maximum width on mobile
  },

  // Tutorial settings
  TUTORIAL: {
    BUBBLE_POSITION: {
      BOTTOM: '20px',
      BOTTOM_ELEVATED: '110px',       // When elevated above UI elements
    },
    MASK_OPACITY: 0.7,
    ANIMATION_DURATION: 0.4,
    SPOTLIGHT_PADDING: 10,            // Padding around highlighted elements
  },

  // Error handling
  ERROR_HANDLING: {
    MAX_ERROR_LOG_ENTRIES: 20,
    SESSION_STORAGE_KEY: 'diatonic-errors',
    CONTEXTS: {
      AUDIO: 'AudioContext',
      CANVAS: 'Canvas', 
      ANIMATION: 'Animation',
      STORAGE: 'LocalStorage',
      RESIZE: 'Resize',
      UI: 'UI',
      WHEEL: 'Wheel',
      BELTS: 'Belts',
      TUTORIAL: 'Tutorial',
      RENDER_LOOP: 'RenderLoop',
      LOGIC: 'Logic',
      APP: 'App',
    },
  },

  // Feature flags for progressive enhancement
  FEATURES: {
    ENABLE_AUDIO: true,
    ENABLE_ANIMATIONS: true,
    ENABLE_PERFORMANCE_MONITORING: false, // Will be enabled in development
    ENABLE_ADVANCED_CANVAS_FEATURES: true,
    ENABLE_KEYBOARD_NAVIGATION: true,
    ENABLE_SCREEN_READER_SUPPORT: true,
  },
};

// === DERIVED CONSTANTS (computed from CONFIG) ===

// Font factors for backward compatibility
export const FONT_FACTOR_OUTER = CONFIG.WHEEL.FONTS.OUTER_FACTOR;
export const FONT_FACTOR_MIDDLE = CONFIG.WHEEL.FONTS.MIDDLE_FACTOR;
export const FONT_FACTOR_INNER = CONFIG.WHEEL.FONTS.INNER_FACTOR;

// Animation duration for backward compatibility
export const ANIM_MS = CONFIG.ANIMATION.DURATION_MS;

// Belt constants for backward compatibility
export const BELT_TEXT_STACK_THRESHOLD = CONFIG.BELTS.TEXT_STACK_THRESHOLD;

// Canvas constants for backward compatibility
export const CANVAS_GUTTER_FACTOR = CONFIG.CANVAS.GUTTER_FACTOR;

// Audio constants for backward compatibility
export const PLAYBACK_NOTE_DURATION_MS = CONFIG.AUDIO.NOTE_DURATION_MS;
export const PLAYBACK_PAUSE_MS = CONFIG.AUDIO.PAUSE_BETWEEN_NOTES_MS;
export const BASE_NOTE_FREQUENCY = CONFIG.AUDIO.BASE_FREQUENCY;

// === VALIDATION HELPERS ===

/**
 * Get a configuration value by path
 * @param {string} path - Dot-separated path (e.g., 'WHEEL.RADII.OUTER')
 * @returns {*} Configuration value or undefined
 */
export function getConfigValue(path) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], CONFIG);
  } catch (error) {
    console.warn(`Invalid config path: ${path}`);
    return undefined;
  }
}

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature
 * @returns {boolean} True if feature is enabled
 */
export function isFeatureEnabled(featureName) {
  return CONFIG.FEATURES[featureName] === true;
}