// main.js

import { 
    chromaticNotes, 
    diatonicIntervals, 
    semitoneSteps, 
    whiteRingColors, 
    modeScaleDegrees, 
    degreeMap, 
    modeMapping, 
    diatonicDegreeIndices, 
    drawWheel 
  } from './drawwheel.js';
  
  import { 
    rotateArray, 
    getIndexAtTop, 
    createBelt, 
    updateBelts, 
    normalizeAngle 
  } from './scrollingbelts.js';
  
  // ===== GET CANVAS AND CONTEXT =====
  const canvas = document.getElementById('chromaWheel');
  const ctx = canvas.getContext('2d');
  
  // ===== HANDLE CANVAS RESIZING =====
  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawCurrentWheel();
  }
  
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('load', resizeCanvas);
  
  // ===== RING ROTATION VARIABLES =====
  let greyRingRotation = 0;
  let greyRingTargetRotation = 0;
  let greyRingAnimating = false;
  
  let whiteRingRotation = 0;
  let whiteRingTargetRotation = 0;
  let whiteRingAnimating = false;
  let whiteRingDiatonicIndex = 0;
  
  // ===== DIMENSIONS AND CONSTANTS =====
  let centerX = canvas.width / 2;
  let centerY = canvas.height / 2;
  let canvasSize = Math.min(canvas.width, canvas.height);
  
  const angleStep = (2 * Math.PI) / 12;
  
  // ===== INITIALIZATION ON WINDOW LOAD =====
  window.onload = function() {
    greyRingRotation = 0;
    whiteRingRotation = -diatonicDegreeIndices[whiteRingDiatonicIndex] * angleStep;
    greyRingTargetRotation = greyRingRotation;
    whiteRingTargetRotation = whiteRingRotation;
  
    // Attach event listeners
    document.getElementById('rotateGreyLeft').addEventListener('click', () => {
      greyRingTargetRotation += angleStep;
      animateGreyRing();
    });
    
    document.getElementById('rotateGreyRight').addEventListener('click', () => {
      greyRingTargetRotation -= angleStep;
      animateGreyRing();
    });
    
    document.getElementById('rotateWhiteLeft').addEventListener('click', () => {
      whiteRingDiatonicIndex = 
        (whiteRingDiatonicIndex - 1 + diatonicDegreeIndices.length) % diatonicDegreeIndices.length;
      whiteRingTargetRotation = 
        -diatonicDegreeIndices[whiteRingDiatonicIndex] * angleStep;
      animateWhiteRing();
    });
    
    document.getElementById('rotateWhiteRight').addEventListener('click', () => {
      whiteRingDiatonicIndex = 
        (whiteRingDiatonicIndex + 1) % diatonicDegreeIndices.length;
      whiteRingTargetRotation = 
        -diatonicDegreeIndices[whiteRingDiatonicIndex] * angleStep;
      animateWhiteRing();
    });
  
    // Initialize belts
    updateBelts(
      whiteRingDiatonicIndex, 
      whiteRingRotation, 
      greyRingRotation, 
      diatonicDegreeIndices, 
      chromaticNotes, 
      diatonicIntervals, 
      semitoneSteps, 
      modeScaleDegrees, 
      degreeMap
    );
  
    drawCurrentWheel();
  };
  
  // ===== DRAW CURRENT WHEEL =====
  function drawCurrentWheel() {
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    canvasSize = Math.min(canvas.width, canvas.height);

    // Determine current mode's scale degrees
    const degreeAtTop = diatonicIntervals[diatonicDegreeIndices[whiteRingDiatonicIndex]];
    const mappedDegree = degreeMap[degreeAtTop];
    const scaleDegreeIndices = modeScaleDegrees[mappedDegree] || [];

    // Draw the wheel - add greyRingRotation parameter
    drawWheel(ctx, canvas, centerX, centerY, canvasSize, whiteRingRotation, scaleDegreeIndices, greyRingRotation);
  
    // Update belts
    updateBelts(
        whiteRingDiatonicIndex,
        whiteRingRotation,
        greyRingRotation,
        diatonicDegreeIndices,
        chromaticNotes,
        diatonicIntervals,
        semitoneSteps,
        modeScaleDegrees,
        degreeMap
    );

    updateResult();
}
  
  // ===== UPDATED RESULT LOGIC =====
  function updateResult() {
    const pitchIndexAtTop = getIndexAtTop(greyRingRotation, angleStep);
    const pitchAtTop = chromaticNotes[pitchIndexAtTop];
  
    const degreeAtTop = diatonicIntervals[diatonicDegreeIndices[whiteRingDiatonicIndex]];
    const mappedDegree = degreeMap[degreeAtTop];
    const modeName = modeMapping[mappedDegree];
  
    // Combine pitch and mode
    let combinedResult = pitchAtTop; // e.g., "A♯/B♭"
    if (modeName) {
      combinedResult += ' ' + modeName; // e.g., "A♯/B♭ Major"
    }
  
    document.getElementById('result').textContent = combinedResult;
  }
  
  // ===== ANIMATION FUNCTIONS =====
  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  function minimalAngleDifference(fromAngle, toAngle) {
    let difference = normalizeAngle(toAngle) - normalizeAngle(fromAngle);
  
    if (difference > Math.PI) {
      difference -= 2 * Math.PI;
    } else if (difference < -Math.PI) {
      difference += 2 * Math.PI;
    }
    return difference;
  }
  
  function animateGreyRing() {
    if (greyRingAnimating) return;
    greyRingAnimating = true;
  
    const startRotation = greyRingRotation;
    const endRotation = greyRingTargetRotation;
    const duration = 300; // milliseconds
    const startTime = performance.now();
    let deltaRotation = minimalAngleDifference(startRotation, endRotation);
  
    function animateFrame(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
  
      greyRingRotation = startRotation + deltaRotation * easeInOutQuad(progress);
      drawCurrentWheel();
  
      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        greyRingRotation = endRotation;
        greyRingAnimating = false;
        drawCurrentWheel();
      }
    }
    requestAnimationFrame(animateFrame);
  }
  
  function animateWhiteRing() {
    if (whiteRingAnimating) return;
    whiteRingAnimating = true;
  
    const startRotation = whiteRingRotation;
    const endRotation = whiteRingTargetRotation;
    const duration = 300; // milliseconds
    const startTime = performance.now();
    let deltaRotation = minimalAngleDifference(startRotation, endRotation);
  
    function animateFrame(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
  
      whiteRingRotation = startRotation + deltaRotation * easeInOutQuad(progress);
      drawCurrentWheel();
  
      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        whiteRingRotation = endRotation;
        whiteRingAnimating = false;
        drawCurrentWheel();
      }
    }
    requestAnimationFrame(animateFrame);
  }
  
