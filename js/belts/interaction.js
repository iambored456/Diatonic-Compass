// js/belts/interaction.js
// Handles drag interactions for the HTML scrolling belt elements.

import { appState } from '../state/appState.js';
import { normalizeAngle, minimalAngleDifference, getIndexAtTop } from '../utils/helpers.js';
import { ANGLE_STEP, diatonicDegreeIndices } from '../config/constants.js';
import { animateChromaticSnap } from '../core/animation.js'; // Import grouped animation

let redrawCallback = null;
let animateGreyCallback = null;
let animateWhiteCallback = null;
let updateResultCallback = null;

export function initializeBeltInteraction(redrawFn, animateGreyFn, animateWhiteFn, updateResultFn) {
    redrawCallback = redrawFn;
    animateGreyCallback = animateGreyFn;
    animateWhiteCallback = animateWhiteFn;
    updateResultCallback = updateResultFn;

    const pitchBelt = document.getElementById('pitchBelt');
    const degreeBelt = document.getElementById('degreeBelt');
    const chromaticBelt = document.getElementById('chromaticBelt');

    if (pitchBelt) makeDraggable(pitchBelt, onPitchDragEnd);
    if (degreeBelt) makeDraggable(degreeBelt, onDegreeDragEnd);
    if (chromaticBelt) {
        // console.log("Initializing drag for chromaticBelt"); // Optional log
        makeDraggable(chromaticBelt, onChromaticDragEnd);
    } else {
        console.error("Chromatic Belt element not found!");
    }
}

// Function to make a belt element draggable
function makeDraggable(belt, onDragEndCallback) {
    belt.style.cursor = "grab";

    const calculateItemWidth = () => {
        const containerWidth = belt.offsetWidth;
        if (containerWidth > 0) return containerWidth / 12;
        return 0;
    };

    // --- Drag Start Handler ---
    const handleDragStart = (pageX) => {
        let itemWidth = appState.belts.itemWidths[belt.id];
        if (!itemWidth || itemWidth <= 0) {
            itemWidth = calculateItemWidth();
            if (itemWidth <= 0) return;
            appState.belts.itemWidths[belt.id] = itemWidth;
        }

        // Stop animations
        if (appState.rings.greyAnimating) animateGreyCallback(true);
        if (appState.rings.whiteAnimating) animateWhiteCallback(true);
        if (appState.rings.chromaticAnimating) animateChromaticSnap(true);

        // Store initial positions of all rings
        appState.drag.beltStartGreyRotation = appState.rings.greyRotation;
        appState.drag.beltStartWhiteRotation = appState.rings.whiteRotation;
        appState.drag.beltStartChromaticRotation = appState.rings.chromaticRotation;

        // Set dragging state
        appState.drag.isDraggingBelt = true;
        appState.drag.beltStartX = pageX;
        appState.drag.activeBeltElement = belt;
        belt.style.cursor = "grabbing";
    };

    // --- Drag Move Handler ---
    const handleDragMove = (pageX) => {
         if (!appState.drag.isDraggingBelt || appState.drag.activeBeltElement !== belt) {
             return;
         }
         let itemWidth = appState.belts.itemWidths[belt.id];
         if (!itemWidth || itemWidth <= 0) itemWidth = calculateItemWidth();
         if (itemWidth <= 0) return;

         const currentX = pageX;
         const deltaX = currentX - appState.drag.beltStartX;
         const deltaAngle = (deltaX / itemWidth) * ANGLE_STEP;

        // Apply rotation based on which belt is active
        if (belt.id === 'pitchBelt') {
            const newGreyRotation = normalizeAngle(appState.drag.beltStartGreyRotation + deltaAngle);
            appState.rings.greyRotation = newGreyRotation;
            appState.rings.greyTargetRotation = newGreyRotation;
            redrawCallback();
        } else if (belt.id === 'degreeBelt') {
            const newWhiteRotation = normalizeAngle(appState.drag.beltStartWhiteRotation + deltaAngle);
            appState.rings.whiteRotation = newWhiteRotation;
            appState.rings.whiteTargetRotation = newWhiteRotation;
            updateSnappedDiatonicIndexBeltDrag(newWhiteRotation);
            updateResultCallback();
            redrawCallback();
        } else if (belt.id === 'chromaticBelt') {
            const newChromaticRotation = normalizeAngle(appState.drag.beltStartChromaticRotation + deltaAngle);
            const newGreyRotation = normalizeAngle(appState.drag.beltStartGreyRotation + deltaAngle);
            const newWhiteRotation = normalizeAngle(appState.drag.beltStartWhiteRotation + deltaAngle);
            appState.rings.chromaticRotation = newChromaticRotation;
            appState.rings.chromaticTargetRotation = newChromaticRotation;
            appState.rings.greyRotation = newGreyRotation;
            appState.rings.greyTargetRotation = newGreyRotation;
            appState.rings.whiteRotation = newWhiteRotation;
            appState.rings.whiteTargetRotation = newWhiteRotation;
            // Re-calculate snapped index based on the new white rotation AFTER chromatic drag moves it
            updateSnappedDiatonicIndexBeltDrag(newWhiteRotation);
            updateResultCallback();
            redrawCallback();
        }
    }; // End handleDragMove

    // --- Drag End Handler ---
    const handleDragEnd = () => {
        if (!appState.drag.isDraggingBelt || appState.drag.activeBeltElement !== belt) {
            return;
        }
        const draggedBeltId = belt.id;
        appState.drag.isDraggingBelt = false;
        appState.drag.activeBeltElement = null;
        belt.style.cursor = "grab";

        // Call the appropriate snap function based on ID
        if (draggedBeltId === 'pitchBelt') {
            snapGreyRingBelt();
        } else if (draggedBeltId === 'degreeBelt') {
            snapWhiteRingBelt();
        } else if (draggedBeltId === 'chromaticBelt') {
            snapChromaticBelt();
        }
    };

    // --- Event Listeners --- (Mouse and Touch)
    belt.addEventListener("mousedown", (e) => { handleDragStart(e.pageX); e.preventDefault(); });
    window.addEventListener("mousemove", (e) => handleDragMove(e.pageX));
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("blur", handleDragEnd);
    belt.addEventListener("touchstart", (e) => { if (e.touches.length === 1) handleDragStart(e.touches[0].pageX); }, { passive: true });
    window.addEventListener("touchmove", (e) => {
        if (appState.drag.isDraggingBelt && appState.drag.activeBeltElement === belt && e.touches.length === 1) {
            e.preventDefault();
            handleDragMove(e.touches[0].pageX);
        }
    }, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
    window.addEventListener("touchcancel", handleDragEnd);
}


// --- Drag End Callbacks ---
function onPitchDragEnd(belt) { snapGreyRingBelt(); }
function onDegreeDragEnd(belt) { snapWhiteRingBelt(); }
function onChromaticDragEnd(belt) { snapChromaticBelt(); }


// --- Helper Function ---
// **** MODIFIED: Calculates snapped index based on relative angle ****
function updateSnappedDiatonicIndexBeltDrag(currentWhiteRotation) {
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
        // console.log(`WhiteDiatonicIndex updated (Belt): ${appState.rings.whiteDiatonicIndex} -> ${closestArrayIndex}`);
        appState.rings.whiteDiatonicIndex = closestArrayIndex;
    }
}

// --- Snap Functions ---
function snapGreyRingBelt() {
    // Snaps only grey ring
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
function snapWhiteRingBelt() {
    // 1. Update snapped index based on the final relative position
    updateSnappedDiatonicIndexBeltDrag(appState.rings.whiteRotation);

    // 2. Calculate the target angle for that diatonic step relative to 0
    const targetDiatonicPositionValue = diatonicDegreeIndices[appState.rings.whiteDiatonicIndex];
    const targetRelativeAngle = normalizeAngle(-targetDiatonicPositionValue * ANGLE_STEP);

    // 3. Add the current chromatic rotation's TARGET to find the absolute target angle
    appState.rings.whiteTargetRotation = normalizeAngle(targetRelativeAngle + appState.rings.chromaticTargetRotation);

    // 4. Animate or snap directly
    if (Math.abs(minimalAngleDifference(appState.rings.whiteRotation, appState.rings.whiteTargetRotation)) > 1e-5) {
        animateWhiteCallback();
    } else {
        appState.rings.whiteRotation = appState.rings.whiteTargetRotation;
        redrawCallback(); updateResultCallback();
    }
}

// Snaps All Rings after Chromatic Belt Drag (Triggers Grouped Snap)
function snapChromaticBelt() {
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
