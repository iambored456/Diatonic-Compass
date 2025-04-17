// js/config/constants.js
// Defines core data structures, mappings, and constants used throughout the application.

// ===== DATA ARRAYS =====
export const chromaticNotes = [
    'C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F',
    'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'
];

export const diatonicIntervals = [
    '1', '♯1/♭2', '2', '♯2/♭3', '3', '4',
    '♯4/♭5', '5', '♯5/♭6', '6', '♯6/♭7', '7'
];

export const semitoneSteps = [ // String representation for display if needed elsewhere
    '0', '1', '2', '3', '4', '5',
    '6', '7', '8', '9', '10', '11'
];

export const chromaticPitchClasses = [ // Numbers 0-11 for chromatic belt content
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
];


// ===== COLOR MAPS =====

// Base colors assigned to the 12 chromatic indices (0-11)
// Used primarily now to DEFINE the fixed colors below.
export const whiteRingColors = {
    0: "#f090ae", 1: "#f59383", 2: "#ea9e5e", 3: "#d0ae4e",
    4: "#a8bd61", 5: "#76c788", 6: "#41cbb5", 7: "#33c6dc",
    8: "#62bbf7", 9: "#94adff", 10: "#bea0f3", 11: "#dd95d6"
};

// Maps the inherent index (0-11) of an interval in diatonicIntervals to its FIXED color
// This is used for coloring the middle ring AND the degree belt background.
export const FIXED_INTERVAL_INDEX_COLORS = {
     0: whiteRingColors[0],  // Index 0 ('1') -> Red/Pink
     // Index 1 ('♯1/♭2') -> Default Grey (no entry)
     2: whiteRingColors[2],  // Index 2 ('2') -> Orange
     // Index 3 ('♯2/♭3') -> Default Grey (no entry)
     4: whiteRingColors[4],  // Index 4 ('3') -> Yellow-Green
     5: whiteRingColors[5],  // Index 5 ('4') -> Green
     // Index 6 ('♯4/♭5') -> Default Grey (no entry)
     7: whiteRingColors[7],  // Index 7 ('5') -> Cyan/Light Blue
     // Index 8 ('♯5/♭6') -> Default Grey (no entry)
     9: whiteRingColors[9],  // Index 9 ('6') -> Blue
     // Index 10 ('♯6/♭7') -> Default Grey (no entry)
    11: whiteRingColors[11]  // Index 11 ('7') -> Purple/Magenta
};

// Maps chromatic note names to boolean indicating if they are "white" piano keys (true) or "black" (false)
// Used for coloring the outer ring AND the pitch name belt background.
export const pianoKeyColors = {
    'C': true, 'C♯/D♭': false, 'D': true, 'D♯/E♭': false, 'E': true, 'F': true,
    'F♯/G♭': false, 'G': true, 'G♯/A♭': false, 'A': true, 'A♯/B♭': false, 'B': true
};

// ===== MODE DEFINITIONS & MAPPINGS =====
// Defines the chromatic indices (0-11) that belong to each diatonic mode rooted on '1'
// Used for highlighting cells in pitch name and chromatic belts.
export const modeScaleDegrees = {
    '1': [0, 2, 4, 5, 7, 9, 11], // Ionian (Major)
    '2': [0, 2, 3, 5, 7, 9, 10], // Dorian
    '3': [0, 1, 3, 5, 7, 8, 10], // Phrygian
    '4': [0, 2, 4, 6, 7, 9, 11], // Lydian
    '5': [0, 2, 4, 5, 7, 9, 10], // Mixolydian
    '6': [0, 2, 3, 5, 7, 8, 10], // Aeolian (Minor)
    '7': [0, 1, 3, 5, 6, 8, 10]  // Locrian
};

// Defines the fundamental diatonic structure (chromatic indices 0-11) relative to '1' (index 0)
// These are the indices corresponding to degrees 1, 2, 3, 4, 5, 6, 7 of the Major scale.
// Used ONLY for calculating the snapped `whiteDiatonicIndex`.
export const diatonicDegreeIndices = [0, 2, 4, 5, 7, 9, 11];

// Maps any interval string (including accidentals) back to its base diatonic number (1-7) for mode lookup
export const degreeMap = {
    '1': '1', '♯1/♭2': '2', '2': '2', '♯2/♭3': '3', '3': '3', '4': '4',
    '♯4/♭5': '5', '5': '5', '♯5/♭6': '6', '6': '6', '♯6/♭7': '7', '7': '7'
};

// Maps the base diatonic number (1-7) to the common mode name
export const modeMapping = {
    '1': 'Major', '2': 'Dorian', '3': 'Phrygian', '4': 'Lydian',
    '5': 'Mixolydian', '6': 'Minor', '7': 'Locrian'
};

// **** ADDED: Major Scale Interval Pattern (Whole/Half steps) ****
// Represents the number of chromatic steps (semitones) between consecutive diatonic degrees.
// W-W-H-W-W-W-H -> 2-2-1-2-2-2-1
export const MAJOR_SCALE_INTERVAL_STEPS = [2, 2, 1, 2, 2, 2, 1];


// ===== MATHEMATICAL/DRAWING CONSTANTS =====
export const PI_2 = Math.PI * 2; // Cache 2 * PI
export const ANGLE_STEP = PI_2 / 12; // Angle for one chromatic step (30 degrees)
export const FONT_SIZE_FACTOR = 0.042; // Factor for calculating font size relative to canvas size
export const ANIMATION_DURATION = 300; // Default animation time in ms
