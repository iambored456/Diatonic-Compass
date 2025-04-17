// js/belts/logic.js

import {
    diatonicDegreeIndices, ANGLE_STEP,
    FIXED_INTERVAL_INDEX_COLORS, chromaticNotes, pianoKeyColors, diatonicIntervals,
    MAJOR_SCALE_INTERVAL_STEPS
} from '../config/constants.js';
import { normalizeAngle } from '../utils/helpers.js';
import { appState } from '../state/appState.js';

console.log("[belts/logic.js] Script loaded.");

// ===== Styling and Positioning Functions =====

// Applies BOTH base styles AND mode highlighting
function applyBeltCellStyles(beltId, highlightIndicesForMode = []) {
    const track = appState.belts.tracks[beltId];
    if (!track) return;

    const cells = track.querySelectorAll('.belt-cell');
    const defaultBackgroundColor = '#f0f0f0'; // Fallback grey

    cells.forEach(cell => {
        // Clear previous styles/classes
        cell.style.backgroundColor = '';
        cell.style.color = '';
        cell.classList.remove('white-key', 'black-key', 'scale-degree-red');

        const originalIndex = parseInt(cell.dataset.originalIndex, 10);
        if (isNaN(originalIndex)) return;

        // 1. Apply BASE background and text color
        if (beltId === 'pitchBelt') {
            const noteName = chromaticNotes[originalIndex];
            const isWhiteKey = pianoKeyColors[noteName];
            cell.style.backgroundColor = isWhiteKey ? '#ffffff' : '#000000';
            cell.style.color = isWhiteKey ? '#000000' : '#ffffff';
            cell.classList.add(isWhiteKey ? 'white-key' : 'black-key');
        } else if (beltId === 'degreeBelt') {
            const color = FIXED_INTERVAL_INDEX_COLORS[originalIndex];
            cell.style.backgroundColor = color || defaultBackgroundColor;
            cell.style.color = '#000000';
            cell.classList.add('white-key');
        } else if (beltId === 'chromaticBelt') {
             cell.style.backgroundColor = '#fff0f0'; // Default light red
             cell.style.color = '#000000';
             cell.classList.add('white-key');
        }

        // 2. Apply MODE highlighting class (only for chromatic belt)
        if (beltId === 'chromaticBelt' && highlightIndicesForMode.includes(originalIndex)) {
            cell.classList.add('scale-degree-red');
        }
    });
}

// Updates the visual translateX position of a specific belt track
function updateBeltPosition(beltId, rotation) {
    const track = appState.belts.tracks[beltId];
    const cellWidth = appState.belts.itemWidths[beltId];
    if (!track || !cellWidth || cellWidth <= 0 || isNaN(cellWidth)) return; // Added check
    const offsetInSteps = normalizeAngle(-rotation) / ANGLE_STEP;
    const totalTranslateX = offsetInSteps * cellWidth;
    const oneSequenceWidth = cellWidth * 12;
    const offsetWithinSequence = ((totalTranslateX % oneSequenceWidth) + oneSequenceWidth) % oneSequenceWidth;
    const finalTranslateX = -offsetWithinSequence;
    track.style.transform = `translateX(${finalTranslateX}px)`;
}

// **** CORRECTED: Updates the visual position of the belt cursor ****
function updateBeltCursorPosition(chromaticRotation) {
    const cursorElement = document.getElementById('belt-cursor');
    if (!cursorElement) return;

    const cellWidth = appState.belts.itemWidths.chromaticBelt;

    // Return if width is invalid
    if (!cellWidth || cellWidth <= 0 || isNaN(cellWidth)) {
        // console.warn("[updateBeltCursorPosition] Invalid cellWidth, skipping update."); // Optional
        return; // Prevent setting invalid transform
    }

    const offsetInSteps = normalizeAngle(chromaticRotation) / ANGLE_STEP;
    const totalTranslateX = offsetInSteps * cellWidth;
    const oneSequenceWidth = cellWidth * 12;
    const offsetWithinSequence = ((totalTranslateX % oneSequenceWidth) + oneSequenceWidth) % oneSequenceWidth;

    // **** FIX: Cursor translates RIGHT by the offset amount ****
    const cursorTranslateX = offsetWithinSequence;

    cursorElement.style.transform = `translateX(${cursorTranslateX}px)`;
    // console.log(`Cursor Tx: ${cursorTranslateX}`); // Optional log
}

// **** CORRECTED: Updates Interval Brackets Position with Offset ****
function updateIntervalBracketsPosition(whiteRingRotation) {
    const track = document.querySelector('#intervalBracketsContainer .interval-brackets-track');
    if (!track) return;

    // Use the degree belt cell width for alignment
    const cellWidth = appState.belts.itemWidths.degreeBelt;

    // Return if width is invalid
    if (!cellWidth || cellWidth <= 0 || isNaN(cellWidth)) {
         // console.warn("[updateIntervalBracketsPosition] Invalid cellWidth, skipping update."); // Optional
        return;
    }

    // Calculate base translation mirroring degree belt
    const offsetInSteps = normalizeAngle(-whiteRingRotation) / ANGLE_STEP;
    const totalTranslateX = offsetInSteps * cellWidth;
    const oneSequenceWidth = cellWidth * 12; // Use 12 steps for full sequence width
    const offsetWithinSequence = ((totalTranslateX % oneSequenceWidth) + oneSequenceWidth) % oneSequenceWidth;
    const baseTranslateX = -offsetWithinSequence;

    // **** FIX: Add half cell width offset ****
    const finalTranslateX = baseTranslateX + (0.5 * cellWidth);

    track.style.transform = `translateX(${finalTranslateX}px)`;
    // console.log(`Bracket Tx: ${finalTranslateX}`); // Optional log
}


// **** NEW: Setup Interval Brackets **** (No functional change needed)
function setupIntervalBrackets(repetitions = 3) {
    const container = document.getElementById('intervalBracketsContainer');
    if (!container) { console.error("[setupIntervalBrackets] Container not found."); return false; }
    const existingTrack = container.querySelector('.interval-brackets-track');
    if (existingTrack) container.removeChild(existingTrack);
    const track = document.createElement('div');
    track.classList.add('interval-brackets-track');
    const fragment = document.createDocumentFragment();
    const intervalPattern = MAJOR_SCALE_INTERVAL_STEPS;
    for (let rep = 0; rep < repetitions; rep++) {
        intervalPattern.forEach((steps, index) => {
            const cell = document.createElement('div');
            cell.classList.add('interval-bracket-cell');
            cell.dataset.steps = steps;
            cell.textContent = `+${steps}`;
            cell.dataset.originalIndex = index;
            cell.dataset.repetition = rep;
            fragment.appendChild(cell);
        });
    }
    track.appendChild(fragment);
    container.appendChild(track);
    // console.log("[setupIntervalBrackets] Brackets DOM created.");
    return true;
}

// Creates the HTML structure for a regular belt
function setupBeltContent(beltId, items, repetitions = 3) {
    const container = document.getElementById(beltId);
    if (!container) { console.error(`[setupBeltContent] FAILED: Container #${beltId}`); return false; }
    const existingTrack = appState.belts.tracks[beltId];
    if (existingTrack && existingTrack.parentNode === container) {
        container.removeChild(existingTrack);
    }
    appState.belts.tracks[beltId] = null;
    const track = document.createElement('div');
    track.classList.add('belt-track');
    appState.belts.tracks[beltId] = track;
    const fragment = document.createDocumentFragment();
    const numItemsPerRepetition = items.length;
    if (numItemsPerRepetition > 0) {
        for (let rep = 0; rep < repetitions; rep++) {
            items.forEach((item, index) => {
                const cell = document.createElement('div');
                cell.classList.add('belt-cell');
                cell.textContent = item !== undefined && item !== null ? String(item) : '';
                cell.dataset.originalIndex = index;
                cell.dataset.repetition = rep;
                fragment.appendChild(cell);
            });
        }
        track.appendChild(fragment);
    } else { console.warn(`[setupBeltContent] No items provided for ${beltId}.`); }
    container.appendChild(track);
    // console.log(`[setupBeltContent] DOM created for ${beltId}`);
    return true;
}

// Calculates and stores item width. Returns true on success.
function calculateAndStoreWidth(beltId, container, numItemsPerRepetition) {
    const containerWidth = container.offsetWidth;
    // console.log(`[calculateAndStoreWidth] Attempting for ${beltId}. Container width: ${containerWidth}`); // Optional log
    if (containerWidth > 0 && numItemsPerRepetition > 0) {
        appState.belts.itemWidths[beltId] = containerWidth / 12;
        // console.log(`[calculateAndStoreWidth] SUCCESS for ${beltId}. Width: ${appState.belts.itemWidths[beltId].toFixed(2)}`); // Optional log
        return true;
    } else {
        if (containerWidth <= 0) console.warn(`[calculateAndStoreWidth] FAILED for ${beltId}. Container width is zero.`);
        if (numItemsPerRepetition <= 0) console.warn(`[calculateAndStoreWidth] FAILED for ${beltId}. Zero items.`);
        appState.belts.itemWidths[beltId] = 0;
        return false;
    }
}


// ===== MAIN BELT UPDATE FUNCTION =====
export function updateBelts(
    diatonicIntervalsArray,
    chromaticNotesArray,
    chromaticPitchClassArray,
    modeScaleDegreesMap,
    degreeMapObject,
    forceContentUpdate = false
) {
    // Get current rotation state
    const whiteRingDiatonicIndex = appState.rings.whiteDiatonicIndex;
    const whiteRingRotation = appState.rings.whiteRotation;
    const greyRingRotation = appState.rings.greyRotation;
    const chromaticRingRotation = appState.rings.chromaticRotation;

    // Determine current mode indices
    const degreeRepresentedBySnappedIndex = diatonicIntervalsArray[diatonicDegreeIndices[whiteRingDiatonicIndex]];
    const mappedModeDegree = degreeMapObject[degreeRepresentedBySnappedIndex] || '1';
    const currentModeScaleIndices = modeScaleDegreesMap[mappedModeDegree] || [];

    const modeChanged = JSON.stringify(currentModeScaleIndices) !== JSON.stringify(appState.belts.lastKnownModeIndices);
    const needsContentUpdate = forceContentUpdate || modeChanged;

    // Function to apply styles and positions after width is known
    const applyStylesAndPositions = () => {
        // Apply styles first, passing the mode indices
        applyBeltCellStyles('pitchBelt', currentModeScaleIndices);
        applyBeltCellStyles('degreeBelt', currentModeScaleIndices);
        applyBeltCellStyles('chromaticBelt', currentModeScaleIndices);

        // Update positions only if width is valid
        if (appState.belts.itemWidths.pitchBelt > 0) updateBeltPosition('pitchBelt', greyRingRotation);
        if (appState.belts.itemWidths.degreeBelt > 0) {
             updateBeltPosition('degreeBelt', whiteRingRotation);
             updateIntervalBracketsPosition(whiteRingRotation); // Update brackets position
        }
        if (appState.belts.itemWidths.chromaticBelt > 0) {
            updateBeltPosition('chromaticBelt', chromaticRingRotation);
            updateBeltCursorPosition(chromaticRingRotation); // Update cursor position
        }
    };


    if (needsContentUpdate) {
        // console.log(`[updateBelts] Content update needed. Forced: ${forceContentUpdate}, ModeChanged: ${modeChanged}`); // Optional Log
        appState.belts.lastKnownModeIndices = [...currentModeScaleIndices];

        // Reset widths ONLY if forced
        if (forceContentUpdate) {
             // console.log("[updateBelts] Forced update: Resetting belt widths."); // Optional Log
             appState.belts.itemWidths.pitchBelt = 0;
             appState.belts.itemWidths.degreeBelt = 0;
             appState.belts.itemWidths.chromaticBelt = 0;
        }

        // 1. Setup DOM elements
        // console.log("[updateBelts] Setting up DOM content..."); // Optional Log
        const pitchSetupOK = setupBeltContent('pitchBelt', chromaticNotesArray, 3);
        const degreeSetupOK = setupBeltContent('degreeBelt', diatonicIntervalsArray, 3);
        const chromaticSetupOK = setupBeltContent('chromaticBelt', chromaticPitchClassArray, 3);
        const bracketsSetupOK = setupIntervalBrackets(3);

        if (!(pitchSetupOK && degreeSetupOK && chromaticSetupOK && bracketsSetupOK)) {
            console.error("[updateBelts] Failed to setup DOM for one or more elements."); return;
        }
        // console.log("[updateBelts] DOM setup complete."); // Optional Log

        // 2. Calculate Widths and Apply Styles/Positions in next frame
        requestAnimationFrame(() => {
            // console.log("[updateBelts rAF] Calculating widths and applying styles/positions..."); // Optional Log
            const pitchContainer = document.getElementById('pitchBelt');
            const degreeContainer = document.getElementById('degreeBelt');
            const chromaticContainer = document.getElementById('chromaticBelt');
            let widthsOK = true; // Assume success

            // Calculate widths, update flag on failure
            if (pitchContainer) { if (!calculateAndStoreWidth('pitchBelt', pitchContainer, chromaticNotesArray.length)) widthsOK = false; } else widthsOK = false;
            if (degreeContainer) { if (!calculateAndStoreWidth('degreeBelt', degreeContainer, diatonicIntervalsArray.length)) widthsOK = false; } else widthsOK = false;
            if (chromaticContainer) { if (!calculateAndStoreWidth('chromaticBelt', chromaticContainer, chromaticPitchClassArray.length)) widthsOK = false; } else widthsOK = false;

            // Apply styles and positions using the dedicated function
            if (widthsOK) {
                applyStylesAndPositions();
                 // console.log("[updateBelts rAF] All widths valid. Styles/Positions applied."); // Optional Log
            } else {
                 console.warn("[updateBelts rAF] Failed to calculate width for one or more belts. Styles/Positions might be incorrect.");
            }

            if (!appState.belts.isInitialSetupDone) {
                 appState.belts.isInitialSetupDone = true;
                 // console.log("[updateBelts] Initial belt setup attempt complete."); // Optional Log
            }
        });

    } else {
        // Only rotation potentially changed
        requestAnimationFrame(() => {
            // Apply styles and positions (includes width checks internally)
            applyStylesAndPositions();
        });
    }
}
