// js/canvas/interaction.js
// Handles drag interactions (mouse & touch) directly on the canvas element.

import { appState } from '../state/appState.js';
import { normalizeAngle, minimalAngleDifference, getIndexAtTop } from '../utils/helpers.js';
import { ANGLE_STEP, diatonicDegreeIndices } from '../config/constants.js';
import { animateChromaticSnap } from '../core/animation.js'; // Import the grouped animation

let canvasElement = null;
let redrawCallback = null;
let animateGreyCallback = null;
let animateWhiteCallback = null;
let updateResultCallback = null;

export function initializeCanvasInteraction(canvas, redrawFn, animateGreyFn, animateWhiteFn, updateResultFn) {
    canvasElement = canvas;
    redrawCallback = redrawFn;
    animateGreyCallback = animateGreyFn;
    animateWhiteCallback = animateWhiteFn;
    updateResultCallback = updateResultFn;

    // Mouse Events
    canvasElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove); // Listen on window for moves outside canvas
    window.addEventListener('mouseup', handleMouseUp);   // Listen on window for mouse up anywhere
    canvasElement.addEventListener('mousemove', updateCursor); // Update cursor style on hover
    window.addEventListener('blur', handleDragEndCommon); // End drag if window loses focus

    // Touch Events
    canvasElement.addEventListener('touchstart', handleTouchStart, { passive: true }); // Allow default scroll initially
    // Listen for move/end/cancel on window to capture events outside the canvas
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // Need passive:false to call preventDefault
    window.addEventListener('touchend', handleTouchEndCancel);
    window.addEventListener('touchcancel', handleTouchEndCancel);


    console.log("Canvas interaction initialized (Mouse & Touch).");
}

// --- Coordinate Helper ---

// Accepts either a mouse event or a touch object
function getCanvasCoordinates(eventOrTouch) {
    if (!canvasElement) return { x: 0, y: 0, radius: 0 };
    const rect = canvasElement.getBoundingClientRect();
    const clientX = eventOrTouch.clientX;
    const clientY = eventOrTouch.clientY;

    // Check if coordinates are valid before calculating
    if (clientX === undefined || clientY === undefined) {
        console.warn("Invalid coordinates received in getCanvasCoordinates", eventOrTouch);
        return { x: 0, y: 0, radius: 0 };
    }

    const x = clientX - rect.left - appState.dimensions.canvasCenterX;
    const y = clientY - rect.top - appState.dimensions.canvasCenterY;
    const radius = Math.sqrt(x * x + y * y);
    return { x, y, radius };
}


// --- Shared Drag Logic ---

function startDrag(x, y) {
    const { radius } = getCanvasCoordinates({ clientX: x, clientY: y }); // Use helper but pass object
    const outerRadius = appState.dimensions.canvasSize * 0.5;
    const middleRadius = appState.dimensions.canvasSize * 0.35;
    const innerRadius = appState.dimensions.canvasSize * 0.2;

    // Stop any ongoing animations
    if (appState.rings.greyAnimating) animateGreyCallback(true);
    if (appState.rings.whiteAnimating) animateWhiteCallback(true);
    if (appState.rings.chromaticAnimating) animateChromaticSnap(true);

    // Determine which ring and store initial state of ALL rings
    let activeRing = null;
    if (radius < outerRadius && radius > middleRadius) {
        activeRing = 'outer';
    } else if (radius < middleRadius && radius > innerRadius) {
        activeRing = 'middle';
    } else if (radius <= innerRadius && radius > 0) {
        activeRing = 'inner';
    } else {
        return false; // Drag didn't start on a valid ring
    }

    // Store initial state
    appState.drag.activeRing = activeRing;
    appState.drag.startGreyRotation = appState.rings.greyRotation;
    appState.drag.startWhiteRotation = appState.rings.whiteRotation;
    appState.drag.startChromaticRotation = appState.rings.chromaticRotation;

    // Set dragging state and start coordinates relative to canvas center
    const coords = getCanvasCoordinates({ clientX: x, clientY: y });
    appState.drag.isDragging = true;
    appState.drag.startX = coords.x;
    appState.drag.startY = coords.y;

    console.log(`Canvas Drag Start on: ${activeRing}`); // Log start
    return true; // Indicate drag started successfully
}

function moveDrag(x, y) {
    if (!appState.drag.isDragging || !appState.drag.activeRing) return;

    const coords = getCanvasCoordinates({ clientX: x, clientY: y }); // Get coordinates relative to center

    // Calculate angle difference from drag start position
    const startDragAngleRad = Math.atan2(appState.drag.startY, appState.drag.startX);
    const currentDragAngleRad = Math.atan2(coords.y, coords.x); // Use coordinates relative to center
    const deltaAngle = currentDragAngleRad - startDragAngleRad;

    // Apply rotation based on which ring is active
    if (appState.drag.activeRing === 'outer') {
        const newGreyRotation = normalizeAngle(appState.drag.startGreyRotation + deltaAngle);
        appState.rings.greyRotation = newGreyRotation;
        appState.rings.greyTargetRotation = newGreyRotation;
    } else if (appState.drag.activeRing === 'middle') {
        const newWhiteRotation = normalizeAngle(appState.drag.startWhiteRotation + deltaAngle);
        appState.rings.whiteRotation = newWhiteRotation;
        appState.rings.whiteTargetRotation = newWhiteRotation;
        updateSnappedDiatonicIndex(newWhiteRotation);
        updateResultCallback();
    } else if (appState.drag.activeRing === 'inner') {
        const newChromaticRotation = normalizeAngle(appState.drag.startChromaticRotation + deltaAngle);
        const newGreyRotation = normalizeAngle(appState.drag.startGreyRotation + deltaAngle);
        const newWhiteRotation = normalizeAngle(appState.drag.startWhiteRotation + deltaAngle);
        appState.rings.chromaticRotation = newChromaticRotation;
        appState.rings.chromaticTargetRotation = newChromaticRotation;
        appState.rings.greyRotation = newGreyRotation;
        appState.rings.greyTargetRotation = newGreyRotation;
        appState.rings.whiteRotation = newWhiteRotation;
        appState.rings.whiteTargetRotation = newWhiteRotation;
        updateSnappedDiatonicIndex(newWhiteRotation); // Also update index based on moved white ring
        updateResultCallback();
    }

    redrawCallback(); // Redraw after any update
}

function endDrag() {
    if (!appState.drag.isDragging) return;

    const draggedRing = appState.drag.activeRing; // Store before resetting

    // Reset dragging state
    appState.drag.isDragging = false;
    appState.drag.activeRing = null;
    if (canvasElement) canvasElement.style.cursor = 'grab'; // Reset cursor

    // Trigger the appropriate snap function
    if (draggedRing === 'outer') {
        snapGreyRing();
    } else if (draggedRing === 'middle') {
        snapWhiteRing();
    } else if (draggedRing === 'inner') {
        snapInnerRing();
    }
    console.log(`Canvas Drag End on: ${draggedRing}`); // Log end
}

// --- Event Handlers ---

// MOUSE
function handleMouseDown(e) {
    e.preventDefault(); // Prevent default browser drag/selection
    const dragStarted = startDrag(e.clientX, e.clientY);
    if (dragStarted && canvasElement) {
        canvasElement.style.cursor = 'grabbing';
    }
}

function handleMouseMove(e) {
    // Only move if dragging started on the canvas
    if (appState.drag.isDragging && appState.drag.activeRing) {
        moveDrag(e.clientX, e.clientY);
    }
}

function handleMouseUp(e) {
    endDrag();
}

// TOUCH
function handleTouchStart(e) {
    // Only respond to single touch
    if (e.touches.length === 1) {
        // Allow default behavior unless drag actually starts on a ring
        // Check if startDrag succeeds before potentially changing cursor (though not visible)
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
        // We don't preventDefault here to allow for potential scroll start if off-target
    }
}

function handleTouchMove(e) {
    // Only process if dragging started on canvas and it's a single touch
    if (appState.drag.isDragging && appState.drag.activeRing && e.touches.length === 1) {
        e.preventDefault(); // *** Prevent scrolling/zooming ONLY when dragging actively ***
        const touch = e.touches[0];
        moveDrag(touch.clientX, touch.clientY);
    }
}

function handleTouchEndCancel(e) {
    // End drag regardless of number of touches lifting/cancelling
    endDrag();
}

// COMMON (Mouse & Touch)
function handleDragEndCommon() { // Used for blur event
    endDrag();
}

function updateCursor(e) {
    if (appState.drag.isDragging) return; // Keep grabbing cursor during drag
    const { x, y, radius } = getCanvasCoordinates(e);
    const outerRadius = appState.dimensions.canvasSize * 0.5;
    const middleRadius = appState.dimensions.canvasSize * 0.35;
    const innerRadius = appState.dimensions.canvasSize * 0.2;

    if ((radius < outerRadius && radius > middleRadius) ||
        (radius < middleRadius && radius > innerRadius) ||
        (radius <= innerRadius && radius > 0)) {
        canvasElement.style.cursor = 'grab';
    } else {
        canvasElement.style.cursor = 'default';
    }
}


// --- Snapping Logic Helpers ---

function updateSnappedDiatonicIndex(currentWhiteRotation) {
    const currentChromaticRotation = appState.rings.chromaticRotation;
    const relativeWhiteAngle = normalizeAngle(currentWhiteRotation - currentChromaticRotation);
    let closestArrayIndex = 0;
    let minDiff = Infinity;
    diatonicDegreeIndices.forEach((diatonicIndexValue, arrayIndex) => {
        const targetAngle = normalizeAngle(-diatonicIndexValue * ANGLE_STEP);
        const diff = Math.abs(minimalAngleDifference(relativeWhiteAngle, targetAngle));
        if (diff < minDiff) { minDiff = diff; closestArrayIndex = arrayIndex; }
    });
    if (appState.rings.whiteDiatonicIndex !== closestArrayIndex) {
        appState.rings.whiteDiatonicIndex = closestArrayIndex;
    }
}

function snapGreyRing() {
    const nearestIndex = getIndexAtTop(appState.rings.greyRotation);
    appState.rings.greyTargetRotation = normalizeAngle(-nearestIndex * ANGLE_STEP);
    if (Math.abs(minimalAngleDifference(appState.rings.greyRotation, appState.rings.greyTargetRotation)) > 1e-5) {
        animateGreyCallback();
    } else {
        appState.rings.greyRotation = appState.rings.greyTargetRotation;
        redrawCallback(); updateResultCallback();
    }
}

function snapWhiteRing() {
    updateSnappedDiatonicIndex(appState.rings.whiteRotation);
    const targetDiatonicPositionValue = diatonicDegreeIndices[appState.rings.whiteDiatonicIndex];
    const targetRelativeAngle = normalizeAngle(-targetDiatonicPositionValue * ANGLE_STEP);
    appState.rings.whiteTargetRotation = normalizeAngle(targetRelativeAngle + appState.rings.chromaticTargetRotation);
    if (Math.abs(minimalAngleDifference(appState.rings.whiteRotation, appState.rings.whiteTargetRotation)) > 1e-5) {
        animateWhiteCallback();
    } else {
        appState.rings.whiteRotation = appState.rings.whiteTargetRotation;
        redrawCallback(); updateResultCallback();
    }
}

function snapInnerRing() {
    const nearestIndex = getIndexAtTop(appState.rings.chromaticRotation);
    appState.rings.chromaticTargetRotation = normalizeAngle(-nearestIndex * ANGLE_STEP);
    const deltaSnap = minimalAngleDifference(appState.rings.chromaticRotation, appState.rings.chromaticTargetRotation);
    appState.rings.greyTargetRotation = normalizeAngle(appState.rings.greyRotation + deltaSnap);
    appState.rings.whiteTargetRotation = normalizeAngle(appState.rings.whiteRotation + deltaSnap);
    if (Math.abs(deltaSnap) > 1e-5) {
        animateChromaticSnap();
    } else {
        appState.rings.chromaticRotation = appState.rings.chromaticTargetRotation;
        appState.rings.greyRotation = appState.rings.greyTargetRotation;
        appState.rings.whiteRotation = appState.rings.whiteTargetRotation;
        redrawCallback(); updateResultCallback();
    }
}
