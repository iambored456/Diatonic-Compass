// js/state/appState.js
// Holds the core mutable state of the application as properties of an exported object.

import { normalizeAngle } from '../utils/helpers.js';
import { diatonicDegreeIndices, ANGLE_STEP } from '../config/constants.js';

// --- Main State Object ---
export const appState = {
    // --- Ring State ---
    rings: {
        greyRotation: 0,       // Rotation for Pitch Name Ring/Belt
        greyTargetRotation: 0,
        greyAnimating: false,

        whiteRotation: 0,       // Rotation for Scale Degree Ring/Belt
        whiteTargetRotation: 0,
        whiteAnimating: false,

        // Rotation for the innermost ring visuals (labels, canvas cursor) AND Chromatic Belt
        chromaticRotation: 0,       // Current visual rotation
        chromaticTargetRotation: 0, // Target after animation/snap
        chromaticAnimating: false,  // Animation flag for chromatic snap group

        // Mode state (based on white ring relative position)
        whiteDiatonicIndex: 0,
    },

    // --- Drag State ---
    drag: {
        // Canvas Drag
        isDragging: false,
        startX: 0,
        startY: 0,
        // Store initial rotations of ALL rings when a drag starts
        startGreyRotation: 0,
        startWhiteRotation: 0,
        startChromaticRotation: 0,
        activeRing: null,   // 'outer', 'middle', or 'inner'

        // Belt Drag
        isDraggingBelt: false,
        beltStartX: 0,
        // Store initial rotations of ALL rings when a belt drag starts
        beltStartGreyRotation: 0,
        beltStartWhiteRotation: 0,
        beltStartChromaticRotation: 0,
        activeBeltElement: null, // Element being dragged
    },

    // --- Dimensions ---
    dimensions: {
        canvasCenterX: 0,
        canvasCenterY: 0,
        canvasSize: 0,
    },

    // --- Belt Specific State ---
    belts: {
        itemWidths: { pitchBelt: 0, degreeBelt: 0, chromaticBelt: 0 },
        tracks: { pitchBelt: null, degreeBelt: null, chromaticBelt: null },
        lastKnownModeIndices: [],
        isInitialSetupDone: false,
    }
};


// --- Initialization Function ---
export function initializeState() {
    appState.rings.greyRotation = 0;
    appState.rings.greyTargetRotation = 0;
    appState.rings.whiteDiatonicIndex = 0;
    // Calculate initial white rotation to align '1' with top before any chromatic rotation
    const initialWhiteOffset = normalizeAngle(-diatonicDegreeIndices[appState.rings.whiteDiatonicIndex] * ANGLE_STEP);
    appState.rings.whiteRotation = initialWhiteOffset;
    appState.rings.whiteTargetRotation = initialWhiteOffset;
    appState.rings.chromaticRotation = 0; // Initialize chromatic rotation
    appState.rings.chromaticTargetRotation = 0;

    // Reset animation flags
    appState.rings.greyAnimating = false;
    appState.rings.whiteAnimating = false;
    appState.rings.chromaticAnimating = false; // Add chromatic flag reset

    // Reset drag state
    appState.drag.isDragging = false;
    appState.drag.isDraggingBelt = false;
    appState.drag.activeRing = null;
    appState.drag.activeBeltElement = null;

    // Reset drag start angles
    appState.drag.startGreyRotation = 0;
    appState.drag.startWhiteRotation = initialWhiteOffset;
    appState.drag.startChromaticRotation = 0;
    appState.drag.beltStartGreyRotation = 0;
    appState.drag.beltStartWhiteRotation = initialWhiteOffset;
    appState.drag.beltStartChromaticRotation = 0;

    console.log("Initial appState object set (Direct Control):", appState);
}
