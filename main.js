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

// Mapping chromatic indices to diatonic positions
const chromaticToDiatonicMap = {
  1: [0, 2],    // C#/Db splits between C and D
  3: [2, 4],    // D#/Eb splits between D and E
  6: [5, 7],    // F#/Gb splits between F and G
  8: [7, 9],    // G#/Ab splits between G and A
  10: [9, 11]   // A#/Bb splits between A and B
};

// ===== RING ROTATION VARIABLES =====
let greyRingRotation = 0;
let greyRingTargetRotation = 0;
let greyRingAnimating = false;

let whiteRingRotation = 0;
let whiteRingTargetRotation = 0;
let whiteRingAnimating = false;
let whiteRingDiatonicIndex = 0;

// ===== DRAG STATE VARIABLES =====
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartAngle = 0;
let activeRing = null; // 'outer' or 'middle'

// ===== DIMENSIONS AND CONSTANTS =====
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let canvasSize = Math.min(canvas.width, canvas.height);

const angleStep = (2 * Math.PI) / 12;

// ===== DRAW CURRENT WHEEL =====
function drawCurrentWheel() {
  // Update center and size in case of resize
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
  canvasSize = Math.min(canvas.width, canvas.height);

  // Determine current mode's scale degrees
  const degreeAtTop = diatonicIntervals[diatonicDegreeIndices[whiteRingDiatonicIndex]];
  const mappedDegree = degreeMap[degreeAtTop];
  const scaleDegreeIndices = modeScaleDegrees[mappedDegree] || [];

  // Draw the wheel
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

  // Update result display
  updateResult();
}

// ===== HANDLE CANVAS RESIZING =====
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  drawCurrentWheel();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// ===== INITIALIZATION ON WINDOW LOAD =====
window.onload = function() {
  greyRingRotation = 0;
  whiteRingRotation = -diatonicDegreeIndices[whiteRingDiatonicIndex] * angleStep;
  greyRingTargetRotation = greyRingRotation;
  whiteRingTargetRotation = whiteRingRotation;

  // Attach existing button event listeners
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

  // Initialize drag events
  initializeDragEvents();

  // Draw the initial wheel
  drawCurrentWheel();
};

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

// ===== DRAG FUNCTIONS =====

// Initialize Drag Events
function initializeDragEvents() {
  canvas.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);
  canvas.addEventListener('mouseleave', endDrag);
  canvas.addEventListener('mousemove', updateCursor);
}

// Add new function to handle cursor updates
function updateCursor(e) {
  if (isDragging) {
      canvas.style.cursor = 'grabbing';
      return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - centerX;
  const y = e.clientY - rect.top - centerY;
  const radius = Math.sqrt(x * x + y * y);
  
  const outerRadius = canvasSize * 0.5;
  const middleRadius = canvasSize * 0.35;
  const innerRadius = canvasSize * 0.2;
  
  if ((radius < outerRadius && radius > middleRadius) || 
      (radius < middleRadius && radius > innerRadius)) {
      canvas.style.cursor = 'grab';
  } else {
      canvas.style.cursor = 'default';
  }
}

// Start Drag
function startDrag(e) {
  e.preventDefault(); // Prevent default behavior
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - centerX;
  const y = e.clientY - rect.top - centerY;
  const radius = Math.sqrt(x * x + y * y);
  
  // Determine which ring was clicked based on radius
  const outerRadius = canvasSize * 0.5;
  const middleRadius = canvasSize * 0.35;
  
  if (radius < outerRadius && radius > middleRadius) {
      activeRing = 'outer';
      dragStartAngle = greyRingRotation;
  } else if (radius < middleRadius && radius > canvasSize * 0.2) {
      activeRing = 'middle';
      dragStartAngle = whiteRingRotation;
  } else {
      return;
  }
  
  isDragging = true;
  dragStartX = x;
  dragStartY = y;
  if (activeRing) {
    canvas.style.cursor = 'grabbing';
}
}

// Drag
function drag(e) {
  if (!isDragging) return;

  e.preventDefault(); // Prevent default behavior
  canvas.style.cursor = 'grabbing';
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - centerX;
  const y = e.clientY - rect.top - centerY;
  
  const startAngle = Math.atan2(dragStartY, dragStartX);
  const currentAngle = Math.atan2(y, x);
  let deltaAngle = currentAngle - startAngle;
  deltaAngle = normalizeAngle(deltaAngle + Math.PI) - Math.PI;
  
  if (activeRing === 'outer') {
      greyRingRotation = dragStartAngle + deltaAngle;
      greyRingTargetRotation = greyRingRotation;
      drawCurrentWheel();
  } else if (activeRing === 'middle') {
      whiteRingRotation = dragStartAngle + deltaAngle;
      
      // Calculate current position
      const currentIndex = Math.round(-whiteRingRotation / angleStep);
      const normalizedIndex = ((currentIndex % 12) + 12) % 12;
      
      // Check if we're in a chromatic position
      if (chromaticToDiatonicMap[normalizedIndex]) {
          // Get adjacent diatonic positions
          const [prev, next] = chromaticToDiatonicMap[normalizedIndex];
          
          // Calculate which diatonic position is closer
          const prevAngle = -prev * angleStep;
          const nextAngle = -next * angleStep;
          const currentAngleNormalized = whiteRingRotation;
          
          whiteRingDiatonicIndex = Math.abs(currentAngleNormalized - prevAngle) < Math.abs(currentAngleNormalized - nextAngle) 
              ? diatonicDegreeIndices.indexOf(prev)
              : diatonicDegreeIndices.indexOf(next);
      } else {
          // We're on a diatonic position
          whiteRingDiatonicIndex = diatonicDegreeIndices.indexOf(normalizedIndex);
      }
      
      drawCurrentWheel();
      updateResult();
  }
}

// End Drag
function endDrag() {
  if (!isDragging) return;

  if (activeRing === 'outer') {
      // Snap to nearest chromatic position
      const nearestIndex = Math.round(-greyRingRotation / angleStep);
      greyRingTargetRotation = -nearestIndex * angleStep;
      animateGreyRing();
  } else if (activeRing === 'middle') {
      // Use the current whiteRingDiatonicIndex to determine target position
      const targetDiatonicPosition = diatonicDegreeIndices[whiteRingDiatonicIndex];
      whiteRingTargetRotation = -targetDiatonicPosition * angleStep;
      animateWhiteRing();
  }
  
  isDragging = false;
  activeRing = null;
  canvas.style.cursor = 'grab';
}
