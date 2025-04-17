// js/canvas/interaction.js
// Handles drag interactions directly on the canvas element.

import { appState } from '../state/appState.js';
import { normalizeAngle, minimalAngleDifference, getIndexAtTop } from '../utils/helpers.js';
import { ANGLE_STEP, diatonicDegreeIndices } from '../config/constants.js';
import { animateChromaticSnap } from '../core/animation.js'; // Import the grouped animation

let canvasElement = null;
let redrawCallback = null;
let animateGreyCallback = null;
let animateWhiteCallback = null;
let updateResultCallback = null;
// Note: animateChromaticSnap is imported directly

export function initializeCanvasInteraction(canvas, redrawFn, animateGreyFn, animateWhiteFn, updateResultFn) {
    canvasElement = canvas;
    redrawCallback = redrawFn;
    animateGreyCallback = animateGreyFn; // Still needed for individual ring snapping
    animateWhiteCallback = animateWhiteFn; // Still needed for individual ring snapping
    updateResultCallback = updateResultFn;

    canvasElement.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    canvasElement.addEventListener('mousemove', updateCursor);
    window.addEventListener('blur', handleDragEnd);

    console.log("Canvas interaction initialized.");
}

function updateCursor(e) {
    if (appState.drag.isDragging) return;
    const { x, y, radius } = getCanvasCoordinates(e);
    const outerRadius = appState.dimensions.canvasSize * 0.5;
    const middleRadius = appState.dimensions.canvasSize * 0.35;
    const innerRadius = appState.dimensions.canvasSize * 0.2;

    if ((radius < outerRadius && radius > middleRadius) ||
        (radius < middleRadius && radius > innerRadius) ||
        (radius <= innerRadius && radius > 0)) { // Include inner ring edge
        canvasElement.style.cursor = 'grab';
    } else {
        canvasElement.style.cursor = 'default';
    }
}

function handleDragStart(e) {
    e.preventDefault();
    const { x, y, radius } = getCanvasCoordinates(e);
    const outerRadius = appState.dimensions.canvasSize * 0.5;
    const middleRadius = appState.dimensions.canvasSize * 0.35;
    const innerRadius = appState.dimensions.canvasSize * 0.2;

    // Stop any ongoing animations
    if (appState.rings.greyAnimating) animateGreyCallback(true);
    if (appState.rings.whiteAnimating) animateWhiteCallback(true);
    if (appState.rings.chromaticAnimating) animateChromaticSnap(true); // Stop grouped animation

    // Determine which ring and store initial state of ALL rings
    if (radius < outerRadius && radius > middleRadius) {
        appState.drag.activeRing = 'outer';
    } else if (radius < middleRadius && radius > innerRadius) {
        appState.drag.activeRing = 'middle';
    } else if (radius <= innerRadius && radius > 0) {
        appState.drag.activeRing = 'inner';
    } else {
        appState.drag.activeRing = null;
        return;
    }

    // Store initial positions of all rings for relative calculations during drag
    appState.drag.startGreyRotation = appState.rings.greyRotation;
    appState.drag.startWhiteRotation = appState.rings.whiteRotation;
    appState.drag.startChromaticRotation = appState.rings.chromaticRotation;

    // Set dragging state
    appState.drag.isDragging = true;
    appState.drag.startX = x;
    appState.drag.startY = y;
    canvasElement.style.cursor = 'grabbing';
}

function handleDrag(e) {
    if (!appState.drag.isDragging || !appState.drag.activeRing) return;

    e.preventDefault();
    canvasElement.style.cursor = 'grabbing';
    const { x, y } = getCanvasCoordinates(e);

    // Calculate angle difference from drag start position
    const startDragAngleRad = Math.atan2(appState.drag.startY, appState.drag.startX);
    const currentDragAngleRad = Math.atan2(y, x);
    const deltaAngle = currentDragAngleRad - startDragAngleRad; // How much the drag point has rotated

    // Apply rotation based on which ring is active
    if (appState.drag.activeRing === 'outer') {
        // Only grey ring moves relative to its start position
        const newGreyRotation = normalizeAngle(appState.drag.startGreyRotation + deltaAngle);
        appState.rings.greyRotation = newGreyRotation;
        appState.rings.greyTargetRotation = newGreyRotation;
    } else if (appState.drag.activeRing === 'middle') {
        // Only white ring moves relative to its start position
        const newWhiteRotation = normalizeAngle(appState.drag.startWhiteRotation + deltaAngle);
        appState.rings.whiteRotation = newWhiteRotation;
        appState.rings.whiteTargetRotation = newWhiteRotation;
        updateSnappedDiatonicIndex(newWhiteRotation); // Update mode index based on new white rotation
        updateResultCallback();
    } else if (appState.drag.activeRing === 'inner') {
        // ALL rings move together by the delta, relative to their start positions
        const newChromaticRotation = normalizeAngle(appState.drag.startChromaticRotation + deltaAngle);
        const newGreyRotation = normalizeAngle(appState.drag.startGreyRotation + deltaAngle);
        const newWhiteRotation = normalizeAngle(appState.drag.startWhiteRotation + deltaAngle);

        appState.rings.chromaticRotation = newChromaticRotation;
        appState.rings.chromaticTargetRotation = newChromaticRotation;
        appState.rings.greyRotation = newGreyRotation;
        appState.rings.greyTargetRotation = newGreyRotation;
        appState.rings.whiteRotation = newWhiteRotation;
        appState.rings.whiteTargetRotation = newWhiteRotation;
        // Re-calculate snapped index based on the new white rotation AFTER chromatic drag moves it
        updateSnappedDiatonicIndex(newWhiteRotation);
        updateResultCallback();
    }

    redrawCallback(); // Redraw after any update
}

function handleDragEnd() {
    if (!appState.drag.isDragging) return;
    const draggedRing = appState.drag.activeRing;
    appState.drag.isDragging = false;
    appState.drag.activeRing = null;
    if (canvasElement) canvasElement.style.cursor = 'grab';

    // Trigger the appropriate snap function
    if (draggedRing === 'outer') {
        snapGreyRing();
    } else if (draggedRing === 'middle') {
        snapWhiteRing();
    } else if (draggedRing === 'inner') {
        snapInnerRing(); // Snap all together
    }
}

// --- Helper Functions ---
function getCanvasCoordinates(event) {
    if (!canvasElement) return { x: 0, y: 0, radius: 0 };
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left - appState.dimensions.canvasCenterX;
    const y = event.clientY - rect.top - appState.dimensions.canvasCenterY;
    const radius = Math.sqrt(x * x + y * y);
    return { x, y, radius };
}

// **** MODIFIED: Calculates snapped index based on relative angle ****
function updateSnappedDiatonicIndex(currentWhiteRotation) {
    const currentChromaticRotation = appState.rings.chromaticRotation; // Get current chromatic offset
    // Calculate the white ring's angle relative to the chromatic ring's position
    const relativeWhiteAngle = normalizeAngle(currentWhiteRotation - currentChromaticRotation);

    let closestArrayIndex = 0;
    let minDiff = Infinity;

    // Compare the relative angle to the fixed target angles of diatonic degrees (relative to 0)
    diatonicDegreeIndices.forEach((diatonicIndexValue, arrayIndex) => {
        const targetAngle = normalizeAngle(-diatonicIndexValue * ANGLE_STEP);
        const diff = Math.abs(minimalAngleDifference(relativeWhiteAngle, targetAngle));
        if (diff < minDiff) {
            minDiff = diff;
            closestArrayIndex = arrayIndex;
        }
    });

    // Update state only if changed
    if (appState.rings.whiteDiatonicIndex !== closestArrayIndex) {
        // console.log(`WhiteDiatonicIndex updated (Canvas): ${appState.rings.whiteDiatonicIndex} -> ${closestArrayIndex}`);
        appState.rings.whiteDiatonicIndex = closestArrayIndex;
    }
}


// --- Snap Functions ---
function snapGreyRing() {
    // Snaps only the grey ring
    const nearestIndex = getIndexAtTop(appState.rings.greyRotation);
    appState.rings.greyTargetRotation = normalizeAngle(-nearestIndex * ANGLE_STEP);
    if (Math.abs(minimalAngleDifference(appState.rings.greyRotation, appState.rings.greyTargetRotation)) > 1e-5) {
        animateGreyCallback();
    } else {
        appState.rings.greyRotation = appState.rings.greyTargetRotation;
        redrawCallback(); updateResultCallback();
    }
}

// **** MODIFIED: Calculates target based on chromatic rotation ****
function snapWhiteRing() {
    // 1. Update snapped index based on the final relative position
    updateSnappedDiatonicIndex(appState.rings.whiteRotation);

    // 2. Calculate the target angle for that diatonic step relative to 0
    const targetDiatonicPositionValue = diatonicDegreeIndices[appState.rings.whiteDiatonicIndex];
    const targetRelativeAngle = normalizeAngle(-targetDiatonicPositionValue * ANGLE_STEP);

    // 3. Add the current chromatic rotation's TARGET to find the absolute target angle
    //    Use the TARGET chromatic rotation because the chromatic ring might be snapping simultaneously.
    appState.rings.whiteTargetRotation = normalizeAngle(targetRelativeAngle + appState.rings.chromaticTargetRotation);

    // 4. Animate or snap directly
    if (Math.abs(minimalAngleDifference(appState.rings.whiteRotation, appState.rings.whiteTargetRotation)) > 1e-5) {
        animateWhiteCallback();
    } else {
        appState.rings.whiteRotation = appState.rings.whiteTargetRotation;
        redrawCallback(); updateResultCallback();
    }
}

function snapInnerRing() {
    // Calculates snap target for chromatic and triggers grouped animation
    const nearestIndex = getIndexAtTop(appState.rings.chromaticRotation);
    appState.rings.chromaticTargetRotation = normalizeAngle(-nearestIndex * ANGLE_STEP);

    // Also need to determine the final target for white/grey based on this snap
    const deltaSnap = minimalAngleDifference(appState.rings.chromaticRotation, appState.rings.chromaticTargetRotation);
    appState.rings.greyTargetRotation = normalizeAngle(appState.rings.greyRotation + deltaSnap);
    appState.rings.whiteTargetRotation = normalizeAngle(appState.rings.whiteRotation + deltaSnap);

    // Check if animation is needed based on chromatic ring's delta
    if (Math.abs(deltaSnap) > 1e-5) {
        animateChromaticSnap(); // This function moves all rings towards their calculated targets
    } else {
        // Snap all rings directly if already close
        appState.rings.chromaticRotation = appState.rings.chromaticTargetRotation;
        appState.rings.greyRotation = appState.rings.greyTargetRotation;
        appState.rings.whiteRotation = appState.rings.whiteTargetRotation;
        redrawCallback(); updateResultCallback();
    }
}
