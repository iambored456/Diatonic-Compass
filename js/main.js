// js/main.js
// Main application entry point and orchestrator.

import { appState, initializeState } from './state/appState.js';
import * as constants from './config/constants.js';
import { getIndexAtTop } from './utils/helpers.js';
import { drawWheel } from './canvas/drawing.js';
import { initializeCanvasInteraction } from './canvas/interaction.js';
import { updateBelts } from './belts/logic.js';
import { initializeBeltInteraction } from './belts/interaction.js';
// **** Import animateChromaticSnap ****
import { initializeAnimation, animateGreyRing, animateWhiteRing, animateChromaticSnap } from './core/animation.js';

// ===== DOM Elements =====
let canvas = null;
let ctx = null;
let resultDisplay = null;

// ===== CORE DRAWING AND UPDATE =====
function drawCurrentWheel(forceBeltContentUpdate = false) {
    if (!ctx || !canvas) {
        console.warn("[drawCurrentWheel] Context or Canvas not available.");
        return;
    }
    const centerX = appState.dimensions.canvasCenterX;
    const centerY = appState.dimensions.canvasCenterY;
    const canvasSize = appState.dimensions.canvasSize;

    // Draw the canvas wheel, passing all necessary rotations
    drawWheel(
        ctx, canvas, centerX, centerY, canvasSize,
        appState.rings.whiteRotation,
        appState.rings.greyRotation,
        appState.rings.chromaticRotation // Pass chromatic rotation
    );

    // Update HTML belts
    // console.log("[drawCurrentWheel] Calling updateBelts..."); // Optional detailed log
    updateBelts(
        constants.diatonicIntervals,
        constants.chromaticNotes,
        constants.chromaticPitchClasses,
        constants.modeScaleDegrees,
        constants.degreeMap,
        forceBeltContentUpdate
    );
    // console.log("[drawCurrentWheel] updateBelts call complete."); // Optional detailed log

    updateResult(); // Update the text display
}

// ===== UPDATE RESULT DISPLAY =====
function updateResult() {
    if (!resultDisplay) return;

    // Result depends on the FINAL TARGET positions after snapping
    const pitchIndexAtTop = getIndexAtTop(appState.rings.greyTargetRotation); // Use grey ring target
    const pitchAtTop = constants.chromaticNotes[pitchIndexAtTop];

    // Mode index is based on the white ring's state
    const safeDiatonicIndex = Math.max(0, Math.min(appState.rings.whiteDiatonicIndex, constants.diatonicDegreeIndices.length - 1));
    const degreeIndexValue = constants.diatonicDegreeIndices[safeDiatonicIndex];
    const degreeAtTop = constants.diatonicIntervals[degreeIndexValue];

    const mappedDegree = constants.degreeMap[degreeAtTop] || '1';
    const modeName = constants.modeMapping[mappedDegree];

    let combinedResult = pitchAtTop;
    if (modeName) {
        combinedResult += ' ' + modeName;
    }
    resultDisplay.textContent = combinedResult;
}


// ===== EVENT HANDLERS =====
function handleResize() {
    // **** ADD LOG ****
    console.log("[handleResize] Function called.");
    if (!canvas) {
        console.log("[handleResize] Canvas not found, exiting.");
        return;
    }
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // **** ADD LOG ****
    console.log(`[handleResize] Canvas dimensions: ${canvas.width}x${canvas.height}`);

    // Update dimensions in state
    appState.dimensions.canvasSize = Math.min(canvas.width, canvas.height);
    appState.dimensions.canvasCenterX = canvas.width / 2;
    appState.dimensions.canvasCenterY = canvas.height / 2;

    // console.log(`Resized: New canvas size ${appState.dimensions.canvasSize}x${appState.dimensions.canvasSize}`);
    // Force content update on resize to recalculate belt widths etc.
    // **** ADD LOG ****
    console.log("[handleResize] Calling drawCurrentWheel(true)...");
    drawCurrentWheel(true);
    console.log("[handleResize] drawCurrentWheel call complete.");
}

// ===== INITIALIZATION =====
function initializeApp() {
    console.log("Initializing Diatonic Compass...");

    canvas = document.getElementById('chromaWheel');
    resultDisplay = document.getElementById('result');
    if (!canvas || !resultDisplay) {
        console.error("Initialization failed: Canvas or Result element not found.");
        return;
     }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Initialization failed: Could not get 2D context.");
        return;
     }

    initializeState();

    // Setup systems, passing callbacks
    initializeAnimation(drawCurrentWheel, updateResult); // Animation needs no extra args
    initializeCanvasInteraction(canvas, drawCurrentWheel, animateGreyRing, animateWhiteRing, updateResult); // Pass individual anim functions
    initializeBeltInteraction(drawCurrentWheel, animateGreyRing, animateWhiteRing, updateResult); // Pass individual anim functions

    // Use setTimeout to ensure the initial layout is calculated
    setTimeout(() => {
        // **** ADD LOG ****
        console.log("[initializeApp setTimeout] Running initial handleResize...");
        handleResize(); // This calls drawCurrentWheel(true)
        console.log("[initializeApp setTimeout] Initial handleResize complete.");
    }, 100); // Increased delay slightly

    window.addEventListener('resize', handleResize);
    console.log("Diatonic Compass Initialized (End of initializeApp).");
}

// ===== START APPLICATION =====
window.onload = initializeApp;
