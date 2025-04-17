// js/canvas/drawing.js
// Contains all functions related to drawing elements on the HTML canvas.

import {
    chromaticNotes, diatonicIntervals, semitoneSteps,
    whiteRingColors, // Still needed to *define* the fixed colors below
    pianoKeyColors, diatonicDegreeIndices, FIXED_INTERVAL_INDEX_COLORS, // Ensure FIXED map is imported
    ANGLE_STEP, FONT_SIZE_FACTOR
} from '../config/constants.js';

import { getIndexAtTop, normalizeAngle } from '../utils/helpers.js';

// ===== DRAW THE ENTIRE WHEEL =====
// **** Signature needs chromaticRotation ****
export function drawWheel(ctx, canvas, centerX, centerY, canvasSize, whiteRingRotation, greyRingRotation, chromaticRotation) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw layers in order
    drawOuterRing(ctx, centerX, centerY, canvasSize, greyRingRotation); // Uses greyRotation
    drawMiddleRingBackground(ctx, centerX, centerY, canvasSize);
    drawColoredWhiteRingSegments_FixedByIndex(ctx, centerX, centerY, canvasSize, whiteRingRotation); // Uses whiteRotation
    drawInnerCircle(ctx, centerX, centerY, canvasSize);
    // **** Pass chromaticRotation to drawLabels ****
    drawLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation, greyRingRotation, chromaticRotation);
    // **** Pass chromaticRotation to drawRedMarker ****
    drawRedMarker(ctx, centerX, centerY, canvasSize, chromaticRotation);
}

// ===== DRAWING HELPER FUNCTIONS =====

function drawOuterRing(ctx, centerX, centerY, canvasSize, greyRingRotation) {
    // ... (no changes) ...
    const outerRadius = canvasSize * 0.5;
    const middleRadius = canvasSize * 0.35;
    for (let i = 0; i < chromaticNotes.length; i++) {
        const centerAngle = i * ANGLE_STEP + greyRingRotation - Math.PI / 2;
        const startAngle = centerAngle - ANGLE_STEP / 2;
        const endAngle = centerAngle + ANGLE_STEP / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, middleRadius, endAngle, startAngle, true);
        ctx.closePath();
        const note = chromaticNotes[i];
        ctx.fillStyle = pianoKeyColors[note] ? '#ffffff' : '#000000';
        ctx.fill();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = canvasSize * 0.001;
        ctx.stroke();
    }
}

function drawMiddleRingBackground(ctx, centerX, centerY, canvasSize) {
    // ... (no changes) ...
    const middleRadius = canvasSize * 0.35;
    const innerRadius = canvasSize * 0.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, middleRadius, 0, Math.PI * 2, false);
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();
}


function drawColoredWhiteRingSegments_FixedByIndex(ctx, centerX, centerY, canvasSize, whiteRingRotation) {
    // ... (no changes - uses whiteRotation) ...
    const middleRadius = canvasSize * 0.35;
    const innerRadius = canvasSize * 0.2;
    const middleRingBackgroundColor = '#e0e0e0';
    const segmentBorderColor = '#cccccc';
    const segmentBorderWidth = canvasSize * 0.001;

    for (let intervalIndex = 0; intervalIndex < 12; intervalIndex++) {
        const fillColor = FIXED_INTERVAL_INDEX_COLORS[intervalIndex] || middleRingBackgroundColor;
        const centerAngle = intervalIndex * ANGLE_STEP - Math.PI / 2 + whiteRingRotation;
        const startAngle = centerAngle - ANGLE_STEP / 2;
        const endAngle = centerAngle + ANGLE_STEP / 2;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(startAngle) * innerRadius, centerY + Math.sin(startAngle) * innerRadius);
        ctx.arc(centerX, centerY, middleRadius, startAngle, endAngle);
        ctx.lineTo(centerX + Math.cos(endAngle) * innerRadius, centerY + Math.sin(endAngle) * innerRadius);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.strokeStyle = segmentBorderColor;
    ctx.lineWidth = segmentBorderWidth;
    for (let i = 0; i < 12; i++) {
        const borderAngle = i * ANGLE_STEP - Math.PI / 2 + whiteRingRotation + (ANGLE_STEP / 2);
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(borderAngle) * innerRadius, centerY + Math.sin(borderAngle) * innerRadius);
        ctx.lineTo(centerX + Math.cos(borderAngle) * middleRadius, centerY + Math.sin(borderAngle) * middleRadius);
        ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(centerX, centerY, middleRadius, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); ctx.stroke();
}


function drawInnerCircle(ctx, centerX, centerY, canvasSize) {
    // ... (no changes) ...
    const innerRadius = canvasSize * 0.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
}

// **** Signature needs chromaticRotation ****
function drawLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation, greyRingRotation, chromaticRotation) {
    drawOuterLabels(ctx, centerX, centerY, canvasSize, greyRingRotation); // Uses grey
    drawMiddleLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation); // Uses white
    // **** Pass chromaticRotation ****
    drawInnerLabels(ctx, centerX, centerY, canvasSize, chromaticRotation); // Uses chromatic
}

function drawOuterLabels(ctx, centerX, centerY, canvasSize, greyRingRotation) {
    // ... (no changes - uses greyRotation) ...
    const outerRadius = canvasSize * 0.5;
    const textRadius = outerRadius * 0.85;
    const fontSize = canvasSize * FONT_SIZE_FACTOR;
    for (let i = 0; i < chromaticNotes.length; i++) {
        const angle = i * ANGLE_STEP - Math.PI / 2 + greyRingRotation;
        const note = chromaticNotes[i];
        const x = centerX + Math.cos(angle) * textRadius;
        const y = centerY + Math.sin(angle) * textRadius;
        ctx.fillStyle = pianoKeyColors[note] ? '#000000' : '#ffffff';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(note, x, y);
    }
}

function drawMiddleLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation) {
    // ... (no changes - uses whiteRotation) ...
    const middleRadius = canvasSize * 0.35;
    const textRadius = middleRadius * 0.80;
    const fontSize = canvasSize * FONT_SIZE_FACTOR;
    for (let i = 0; i < diatonicIntervals.length; i++) {
        const angle = i * ANGLE_STEP - Math.PI / 2 + whiteRingRotation;
        const interval = diatonicIntervals[i];
        const x = centerX + Math.cos(angle) * textRadius;
        const y = centerY + Math.sin(angle) * textRadius;
        ctx.fillStyle = 'black';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(interval, x, y);
    }
}

// **** Signature needs chromaticRotation ****
function drawInnerLabels(ctx, centerX, centerY, canvasSize, chromaticRotation) {
    const innerRadius = canvasSize * 0.2;
    const textRadius = innerRadius * 0.8;
    const fontSize = canvasSize * 0.028;

    for (let i = 0; i < semitoneSteps.length; i++) {
        // **** Apply chromaticRotation to label angle ****
        const angle = i * ANGLE_STEP - Math.PI / 2 + chromaticRotation; // Rotate with chromatic ring
        const semitone = semitoneSteps[i];
        const x = centerX + Math.cos(angle) * textRadius;
        const y = centerY + Math.sin(angle) * textRadius;

        ctx.fillStyle = 'white';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(semitone, x, y);
    }
}

// **** Signature needs chromaticRotation ****
function drawRedMarker(ctx, centerX, centerY, canvasSize, chromaticRotation) {
    const outerRadius = canvasSize * 0.5;
    const markerInnerRadius = canvasSize * 0.125; // Keep extended value
    const halfAngleStep = ANGLE_STEP / 2;

    // **** Apply chromaticRotation to marker angles ****
    const baseAngle = -Math.PI / 2 + chromaticRotation; // Center marker based on chromatic rotation
    const startAngle = baseAngle - halfAngleStep;
    const endAngle = baseAngle + halfAngleStep;

    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(startAngle) * markerInnerRadius, centerY + Math.sin(startAngle) * markerInnerRadius);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
    ctx.lineTo(centerX + Math.cos(endAngle) * markerInnerRadius, centerY + Math.sin(endAngle) * markerInnerRadius);
    ctx.arc(centerX, centerY, markerInnerRadius, endAngle, startAngle, true);
    ctx.closePath();

    ctx.strokeStyle = 'red';
    ctx.lineWidth = canvasSize * 0.006;
    ctx.stroke();
}
