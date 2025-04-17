// js/core/animation.js
// Handles the animation logic for snapping the rings.

import { appState } from '../state/appState.js';
import { normalizeAngle, minimalAngleDifference, easeInOutQuad } from '../utils/helpers.js';
// **** ADD diatonicDegreeIndices and ANGLE_STEP import ****
import { ANIMATION_DURATION, diatonicDegreeIndices, ANGLE_STEP } from '../config/constants.js';


let redrawCallback = null;
let updateResultCallback = null;
let animationFrameIdGrey = null;
let animationFrameIdWhite = null;
let animationFrameIdChromatic = null; // For the grouped chromatic snap animation

export function initializeAnimation(redrawFn, updateResultFn) {
    redrawCallback = redrawFn;
    updateResultCallback = updateResultFn;
    console.log("Animation system initialized.");
}

// Animate Grey Ring (Pitch Name) - Snaps ONLY the grey ring
export function animateGreyRing(stop = false) {
    if (animationFrameIdGrey) {
        cancelAnimationFrame(animationFrameIdGrey);
        animationFrameIdGrey = null;
        appState.rings.greyAnimating = false;
    }
    if (stop) {
        appState.rings.greyTargetRotation = appState.rings.greyRotation;
        return;
    }
    // Prevent starting if already animating OR if a chromatic snap is in progress
    if (appState.rings.greyAnimating || appState.rings.chromaticAnimating) return;

    appState.rings.greyAnimating = true;
    const startRotation = appState.rings.greyRotation;
    const endRotation = appState.rings.greyTargetRotation;
    const startTime = performance.now();
    const deltaRotation = minimalAngleDifference(startRotation, endRotation);

    if (Math.abs(deltaRotation) < 1e-5) {
         appState.rings.greyRotation = normalizeAngle(endRotation);
         appState.rings.greyTargetRotation = appState.rings.greyRotation;
         appState.rings.greyAnimating = false;
         redrawCallback();
         updateResultCallback();
         return;
    }

    function frame(time) {
        if (!appState.rings.greyAnimating) {
             animationFrameIdGrey = null; return;
        }
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        appState.rings.greyRotation = normalizeAngle(startRotation + deltaRotation * easeInOutQuad(progress));
        redrawCallback();
        if (progress < 1) {
            animationFrameIdGrey = requestAnimationFrame(frame);
        } else {
            appState.rings.greyRotation = normalizeAngle(endRotation);
            appState.rings.greyTargetRotation = appState.rings.greyRotation;
            appState.rings.greyAnimating = false;
            animationFrameIdGrey = null;
            redrawCallback();
            updateResultCallback();
        }
    }
    animationFrameIdGrey = requestAnimationFrame(frame);
}

// Animate White Ring (Scale Degree) - Snaps ONLY the white ring
export function animateWhiteRing(stop = false) {
    if (animationFrameIdWhite) {
        cancelAnimationFrame(animationFrameIdWhite);
        animationFrameIdWhite = null;
        appState.rings.whiteAnimating = false;
    }
    if (stop) {
        appState.rings.whiteTargetRotation = appState.rings.whiteRotation;
        return;
    }
     // Prevent starting if already animating OR if a chromatic snap is in progress
    if (appState.rings.whiteAnimating || appState.rings.chromaticAnimating) return;

    appState.rings.whiteAnimating = true;
    const startRotation = appState.rings.whiteRotation;
    const endRotation = appState.rings.whiteTargetRotation;
    const startTime = performance.now();
    const deltaRotation = minimalAngleDifference(startRotation, endRotation);

    if (Math.abs(deltaRotation) < 1e-5) {
         appState.rings.whiteRotation = normalizeAngle(endRotation);
         appState.rings.whiteTargetRotation = appState.rings.whiteRotation;
         appState.rings.whiteAnimating = false;
         redrawCallback();
         updateResultCallback();
         return;
    }

    function frame(time) {
         if (!appState.rings.whiteAnimating) {
             animationFrameIdWhite = null; return;
         }
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        appState.rings.whiteRotation = normalizeAngle(startRotation + deltaRotation * easeInOutQuad(progress));
        redrawCallback();
        if (progress < 1) {
            animationFrameIdWhite = requestAnimationFrame(frame);
        } else {
            appState.rings.whiteRotation = normalizeAngle(endRotation);
            appState.rings.whiteTargetRotation = appState.rings.whiteRotation;
            appState.rings.whiteAnimating = false;
            animationFrameIdWhite = null;
            redrawCallback();
            updateResultCallback();
        }
    }
    animationFrameIdWhite = requestAnimationFrame(frame);
}


// Animate Chromatic Snap (Moves All Rings by the same delta)
export function animateChromaticSnap(stop = false) {
    if (animationFrameIdChromatic) {
        cancelAnimationFrame(animationFrameIdChromatic);
        animationFrameIdChromatic = null;
        appState.rings.chromaticAnimating = false;
    }
    // Also stop individual animations if a master snap starts
    if (animationFrameIdGrey) cancelAnimationFrame(animationFrameIdGrey);
    if (animationFrameIdWhite) cancelAnimationFrame(animationFrameIdWhite);
    appState.rings.greyAnimating = false;
    appState.rings.whiteAnimating = false;

    if (stop) {
        // Align all targets with current state if stopping
        appState.rings.chromaticTargetRotation = appState.rings.chromaticRotation;
        appState.rings.greyTargetRotation = appState.rings.greyRotation;
        appState.rings.whiteTargetRotation = appState.rings.whiteRotation;
        // console.log("Stopping Chromatic Snap animation."); // Optional log
        return;
    }
    // Avoid starting if already animating this group
    if (appState.rings.chromaticAnimating) return;

    // Start Animation
    appState.rings.chromaticAnimating = true;
    const startChromatic = appState.rings.chromaticRotation;
    const endChromatic = appState.rings.chromaticTargetRotation; // Target should be set before calling
    const startGrey = appState.rings.greyRotation;
    const startWhite = appState.rings.whiteRotation;
    const startTime = performance.now();
    // Calculate the delta needed ONLY for the chromatic ring snap
    const deltaChromatic = minimalAngleDifference(startChromatic, endChromatic);

    // If already at the target, snap all immediately
    if (Math.abs(deltaChromatic) < 1e-5) {
         const finalRotation = normalizeAngle(endChromatic);
         appState.rings.chromaticRotation = finalRotation;
         appState.rings.chromaticTargetRotation = finalRotation;
         appState.rings.greyRotation = normalizeAngle(startGrey); // No delta applied
         appState.rings.greyTargetRotation = appState.rings.greyRotation;
         appState.rings.whiteRotation = normalizeAngle(startWhite); // No delta applied
         appState.rings.whiteTargetRotation = appState.rings.whiteRotation;
         appState.rings.chromaticAnimating = false;
         redrawCallback();
         updateResultCallback();
         return;
    }

    // Animation frame function
    function frame(time) {
         if (!appState.rings.chromaticAnimating) {
             animationFrameIdChromatic = null; return;
         }

        const elapsed = time - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const easedProgress = easeInOutQuad(progress);
        // Calculate the angular change TO APPLY TO ALL for this frame
        const currentDelta = deltaChromatic * easedProgress;

        // Apply the SAME delta to ALL rings relative to their START positions at the beginning of this snap
        appState.rings.chromaticRotation = normalizeAngle(startChromatic + currentDelta);
        appState.rings.greyRotation = normalizeAngle(startGrey + currentDelta);
        appState.rings.whiteRotation = normalizeAngle(startWhite + currentDelta);

        redrawCallback(); // Redraw with updated positions

        if (progress < 1) {
            animationFrameIdChromatic = requestAnimationFrame(frame);
        } else {
            // **** REVISED LOGIC FOR FINAL STATE ****
            // Animation finished: Snap all rings precisely to their final derived positions

            // 1. Final Chromatic position is the target
            const finalChromatic = normalizeAngle(endChromatic);

            // 2. Determine the correct final diatonic index based on the STARTING relative position
            //    (This ensures the mode doesn't change unexpectedly during the snap)
            const startRelativeWhite = normalizeAngle(startWhite - startChromatic);
            let finalDiatonicIndex = 0;
            let minDiff = Infinity;
            diatonicDegreeIndices.forEach((val, idx) => {
                const target = normalizeAngle(-val * ANGLE_STEP);
                const diff = Math.abs(minimalAngleDifference(startRelativeWhite, target));
                if (diff < minDiff) { minDiff = diff; finalDiatonicIndex = idx; }
            });
            // Update the diatonic index state directly
            appState.rings.whiteDiatonicIndex = finalDiatonicIndex;

            // 3. Calculate the final white rotation based on the final chromatic position
            //    and the determined final diatonic index.
            const finalRelativeWhite = normalizeAngle(-diatonicDegreeIndices[finalDiatonicIndex] * ANGLE_STEP);
            const finalWhite = normalizeAngle(finalRelativeWhite + finalChromatic);

            // 4. Calculate final grey by applying the actual delta achieved by chromatic snap
            const actualDelta = minimalAngleDifference(startChromatic, finalChromatic);
            const finalGrey = normalizeAngle(startGrey + actualDelta);

            // 5. Set final state for all rings
            appState.rings.chromaticRotation = finalChromatic;
            appState.rings.chromaticTargetRotation = finalChromatic;
            appState.rings.greyRotation = finalGrey;
            appState.rings.greyTargetRotation = finalGrey;
            appState.rings.whiteRotation = finalWhite; // Use recalculated final white
            appState.rings.whiteTargetRotation = finalWhite;

            // 6. Reset animation flag
            appState.rings.chromaticAnimating = false;
            animationFrameIdChromatic = null;

            redrawCallback(); // Final redraw
            updateResultCallback(); // Update result text
            // *************************************
        }
    }
    // Start the animation loop
    animationFrameIdChromatic = requestAnimationFrame(frame);
}
