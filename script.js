// ===== GET CANVAS AND CONTEXT =====
const canvas = document.getElementById('chromaWheel');
const ctx = canvas.getContext('2d');

// ===== HANDLE CANVAS RESIZING =====
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  drawWheel();
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

const fontSizeFactor = 0.038;
const angleStep = (2 * Math.PI) / 12;

// ===== DATA ARRAYS =====
const chromaticNotes = [
  'C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F',
  'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'
];

const diatonicIntervals = [
  '1', '♯1/♭2', '2', '♯2/♭3', '3', '4',
  '♯4/♭5', '5', '♯5/♭6', '6', '♯6/♭7', '7'
];

const semitoneSteps = [
  '0', '1', '2', '3', '4', '5',
  '6', '7', '8', '9', '10', '11'
];

// ===== COLOR MAP FOR THE MIDDLE RING (INDEX 0..11) =====
const whiteRingColors = {
  0:  "#f090ae",
  1:  "#f59383",
  2:  "#ea9e5e",
  3:  "#d0ae4e",
  4:  "#a8bd61",
  5:  "#76c788",
  6:  "#41cbb5",
  7:  "#33c6dc",
  8:  "#62bbf7",
  9:  "#94adff",
  10: "#bea0f3",
  11: "#dd95d6"
};

const modeScaleDegrees = {
  '1': [0, 2, 4, 5, 7, 9, 11], 
  '2': [0, 2, 3, 5, 7, 9, 10],
  '3': [0, 1, 3, 5, 7, 8, 10], 
  '4': [0, 2, 4, 6, 7, 9, 11], 
  '5': [0, 2, 4, 5, 7, 9, 10],
  '6': [0, 2, 3, 5, 7, 8, 10], 
  '7': [0, 1, 3, 5, 6, 8, 10]
};

const diatonicDegreeIndices = [0, 2, 4, 5, 7, 9, 11];

// ===== INITIALIZATION ON WINDOW LOAD =====
window.onload = function() {
  greyRingRotation = 0;
  whiteRingRotation = -diatonicDegreeIndices[whiteRingDiatonicIndex] * angleStep;
  greyRingTargetRotation = greyRingRotation;
  whiteRingTargetRotation = whiteRingRotation;
  initializeWhiteRingDiatonicIndex();

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

  drawWheel();
};

function initializeWhiteRingDiatonicIndex() {
  whiteRingDiatonicIndex = diatonicDegreeIndices.indexOf(getIndexAtTop(whiteRingRotation));
  if (whiteRingDiatonicIndex === -1) {
    whiteRingDiatonicIndex = 0;
    whiteRingRotation = -diatonicDegreeIndices[whiteRingDiatonicIndex] * angleStep;
    whiteRingTargetRotation = whiteRingRotation;
  }
}

// ===== DRAW THE ENTIRE WHEEL =====
function drawWheel() {
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
  canvasSize = Math.min(canvas.width, canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawOuterRing();
  drawColoredWhiteRingSegments();
  drawInnerCircle();

  const degreeAtTop = diatonicIntervals[diatonicDegreeIndices[whiteRingDiatonicIndex]];
  const modeKey = degreeAtTop.replace('#', '').replace('b', '');
  const scaleDegreeIndices = modeScaleDegrees[modeKey] || [];

  drawDashedLines(scaleDegreeIndices);
  drawLabels();
  drawRedMarker();
  updateResult();
  updateBelts();
}

function drawOuterRing() {
  const outerRadius = canvasSize * 0.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#cccccc';
  ctx.fill();
}

// ===== DRAW MIDDLE RING IN WEDGES, CENTERED ON LABEL =====
function drawColoredWhiteRingSegments() {
  const middleRadius = canvasSize * 0.35;
  
  for (let i = 0; i < 12; i++) {
    const centerAngle = i * angleStep + whiteRingRotation - Math.PI / 2;
    const startAngle = centerAngle - angleStep / 2;
    const endAngle   = centerAngle + angleStep / 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, middleRadius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = whiteRingColors[i];
    ctx.fill();
  }
}

function drawInnerCircle() {
  const innerRadius = canvasSize * 0.2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = 'black';
  ctx.fill();
}

function drawDashedLines(scaleDegreeIndices) {
  const outerRadius = canvasSize * 0.5;
  const innerRadius = canvasSize * 0.2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = canvasSize * 0.002;
  ctx.setLineDash([10, 5]);

  scaleDegreeIndices.forEach(index => {
    const angle = index * angleStep - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
    ctx.stroke();
  });

  ctx.setLineDash([]);
  ctx.restore();
}

// ===== DRAW TEXT LABELS =====
function drawLabels() {
  drawOuterLabels();
  drawMiddleLabels();
  drawInnerLabels();
}

function drawOuterLabels() {
  const outerRadius = canvasSize * 0.5;
  const textRadius = outerRadius * 0.85;
  const fontSize = canvasSize * fontSizeFactor;

  for (let i = 0; i < chromaticNotes.length; i++) {
    const angle = i * angleStep - Math.PI / 2 + greyRingRotation;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.rotate(-angle);

    const x = Math.cos(angle) * textRadius;
    const y = Math.sin(angle) * textRadius;

    ctx.fillStyle = 'black';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(chromaticNotes[i], x, y);
    ctx.restore();
  }
}

function drawMiddleLabels() {
  const middleRadius = canvasSize * 0.35;
  const textRadius = middleRadius * 0.80;
  const fontSize = canvasSize * fontSizeFactor;

  for (let i = 0; i < diatonicIntervals.length; i++) {
    const angle = i * angleStep - Math.PI / 2 + whiteRingRotation;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.rotate(-angle);

    const x = Math.cos(angle) * textRadius;
    const y = Math.sin(angle) * textRadius;

    ctx.fillStyle = 'black';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(diatonicIntervals[i], x, y);
    ctx.restore();
  }
}

function drawInnerLabels() {
  const innerRadius = canvasSize * 0.2;
  const textRadius = innerRadius * 0.8;
  const fontSize = canvasSize * 0.025;

  for (let i = 0; i < semitoneSteps.length; i++) {
    const angle = i * angleStep - Math.PI / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.rotate(-angle);

    const x = Math.cos(angle) * textRadius;
    const y = Math.sin(angle) * textRadius;

    ctx.fillStyle = 'white';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(semitoneSteps[i], x, y);
    ctx.restore();
  }
}

// ===== DRAW RED MARKER =====
function drawRedMarker() {
  const markerWidth = canvasSize * 0.070;
  const markerStartY = -canvasSize * 0.5;
  const markerHeight = canvasSize * 0.38;

  ctx.strokeStyle = 'red';
  ctx.lineWidth = canvasSize * 0.005;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  ctx.rect(-markerWidth / 2, markerStartY, markerWidth, markerHeight);
  ctx.stroke();
  ctx.restore();
}

// ===== UPDATED RESULT LOGIC =====
function updateResult() {
  const pitchIndexAtTop = getIndexAtTop(greyRingRotation);
  const pitchAtTop = chromaticNotes[pitchIndexAtTop];

  const degreeAtTop = diatonicIntervals[diatonicDegreeIndices[whiteRingDiatonicIndex]];
  const modeMapping = {
    '1': 'Major',
    '#1/b2': '',
    '2': 'Dorian',
    '#2/b3': '',
    '3': 'Phrygian',
    '4': 'Lydian',
    '#4/b5': '',
    '5': 'Mixolydian',
    '#5/b6': '',
    '6': 'Minor',
    '#6/b7': '',
    '7': 'Locrian'
  };
  const modeName = modeMapping[degreeAtTop];

  // ============= KEY CHANGE HERE =============
  // Instead of splitting enharmonic pitch names into separate results
  // (like "A♯ Major, B♭ Major"),
  // we now simply show them as "A♯/B♭ Major"
  let combinedResult = pitchAtTop; // e.g. "A♯/B♭"
  if (modeName) {
    combinedResult += ' ' + modeName; // e.g. "A♯/B♭ Major"
  }

  document.getElementById('result').textContent = combinedResult;
}

// ===== ANIMATION FUNCTIONS =====
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function normalizeAngle(angle) {
  return (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
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
  const duration = 300;
  const startTime = performance.now();
  let deltaRotation = minimalAngleDifference(startRotation, endRotation);

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    greyRingRotation = startRotation + deltaRotation * easeInOutQuad(progress);
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      greyRingRotation = endRotation;
      greyRingAnimating = false;
      drawWheel();
    }
  }
  requestAnimationFrame(animate);
}

function animateWhiteRing() {
  if (whiteRingAnimating) return;
  whiteRingAnimating = true;

  const startRotation = whiteRingRotation;
  const endRotation = whiteRingTargetRotation;
  const duration = 300;
  const startTime = performance.now();
  let deltaRotation = minimalAngleDifference(startRotation, endRotation);

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    whiteRingRotation = startRotation + deltaRotation * easeInOutQuad(progress);
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      whiteRingRotation = endRotation;
      whiteRingAnimating = false;
      drawWheel();
    }
  }
  requestAnimationFrame(animate);
}

// ===== SCROLLING BELTS =====
function createBelt(containerId, items, centerIndex, scaleDegreeIndices = [], highlightClass = 'scale-degree') {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach((item, index) => {
    const cell = document.createElement('div');
    cell.classList.add('belt-cell');
    cell.textContent = item;

    if (index === centerIndex) {
      cell.classList.add('center');
    }

    if (scaleDegreeIndices.includes(index)) {
      cell.classList.add(highlightClass);
    }

    container.appendChild(cell);
  });
}

function updateBelts() {
  const degreeCenterIndex = 0;
  const degreeRotationIndex = diatonicDegreeIndices[whiteRingDiatonicIndex];
  const rotatedDegree = rotateArray(diatonicIntervals, degreeRotationIndex);

  const degreeAtTop = diatonicIntervals[diatonicDegreeIndices[whiteRingDiatonicIndex]];
  const modeKey = degreeAtTop.replace('#', '').replace('b', '');
  const scaleDegreeIndices = modeScaleDegrees[modeKey] || [];

  const adjustedScaleDegreeIndices = scaleDegreeIndices.map(
    index => (index - degreeRotationIndex + 12) % 12
  );

  createBelt('degreeBelt', rotatedDegree, degreeCenterIndex, adjustedScaleDegreeIndices, 'scale-degree-yellow');

  const pitchCenterIndex = 0;
  const pitchRotationIndex = getIndexAtTop(greyRingRotation);
  const rotatedPitch = rotateArray(chromaticNotes, pitchRotationIndex);

  createBelt('pitchBelt', rotatedPitch, pitchCenterIndex, scaleDegreeIndices);

  const chromaticCenterIndex = 0;
  createBelt('chromaticBelt', semitoneSteps, chromaticCenterIndex, scaleDegreeIndices, 'scale-degree-red');
}

function rotateArray(array, rotationIndex) {
  return array.slice(rotationIndex).concat(array.slice(0, rotationIndex));
}

function getIndexAtTop(rotation) {
  let index = Math.round(-normalizeAngle(rotation) / angleStep) % 12;
  if (index < 0) {
    index += 12;
  }
  return index;
}

// ===== EXTRA LISTENERS FOR REDRAW =====
window.addEventListener('load', () => {
  drawWheel();
});
window.addEventListener('resize', () => {
  drawWheel();
});
