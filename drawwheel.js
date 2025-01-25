// drawwheel.js

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

const pianoKeyColors = {
    'C': true,    // white
    'C♯/D♭': false, // black
    'D': true,    // white
    'D♯/E♭': false, // black
    'E': true,    // white
    'F': true,    // white
    'F♯/G♭': false, // black
    'G': true,    // white
    'G♯/A♭': false, // black
    'A': true,    // white
    'A♯/B♭': false, // black
    'B': true     // white
  };

// ===== MODE SCALE DEGREES =====
const modeScaleDegrees = {
  '1': [0, 2, 4, 5, 7, 9, 11],    // Ionian (Major)
  '2': [0, 2, 3, 5, 7, 9, 10],    // Dorian
  '3': [0, 1, 3, 5, 7, 8, 10],    // Phrygian
  '4': [0, 2, 4, 6, 7, 9, 11],    // Lydian
  '5': [0, 2, 4, 5, 7, 9, 10],    // Mixolydian
  '6': [0, 2, 3, 5, 7, 8, 10],    // Aeolian (Minor)
  '7': [0, 1, 3, 5, 6, 8, 10]     // Locrian
};

const diatonicDegreeIndices = [0, 2, 4, 5, 7, 9, 11]; // Corresponding to modes 1 through 7

// ===== DEGREE MAP =====
// Maps each diatonic interval (including accidentals) to a diatonic number (1 through 7)
const degreeMap = {
  '1': '1',
  '♯1/♭2': '2',
  '2': '2',
  '♯2/♭3': '3',
  '3': '3',
  '4': '4',
  '♯4/♭5': '5',
  '5': '5',
  '♯5/♭6': '6',
  '6': '6',
  '♯6/♭7': '7',
  '7': '7'
};


const angleStep = (2 * Math.PI) / 12;
const fontSizeFactor = 0.042; // Add this line to define fontSizeFactor


// ===== MODE MAPPING =====
// Associates each diatonic number with its corresponding mode name
const modeMapping = {
  '1': 'Major',
  '2': 'Dorian',
  '3': 'Phrygian',
  '4': 'Lydian',
  '5': 'Mixolydian',
  '6': 'Minor',
  '7': 'Locrian'
};

// ===== DRAW THE ENTIRE WHEEL =====
// Add new function
function drawMiddleRingBackground(ctx, centerX, centerY, canvasSize) {
  const middleRadius = canvasSize * 0.35;
  ctx.beginPath();
  ctx.arc(centerX, centerY, middleRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#e0e0e0'; // Changed from 'white' to light gray
  ctx.fill();
}
  
  // Update drawWheel function to include new layer
  function drawWheel(ctx, canvas, centerX, centerY, canvasSize, whiteRingRotation, scaleDegreeIndices, greyRingRotation) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Layer 1: Outer ring with black/white wedges
    drawOuterRing(ctx, centerX, centerY, canvasSize, greyRingRotation);
    // Layer 2: Middle ring background (white)
    drawMiddleRingBackground(ctx, centerX, centerY, canvasSize);
    // Layer 3: Colored segments for diatonic positions
    drawColoredWhiteRingSegments(ctx, centerX, centerY, canvasSize, whiteRingRotation);
    // Layer 4: Inner black circle
    drawInnerCircle(ctx, centerX, centerY, canvasSize);
    // Layer 5: All text labels
    drawLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation, greyRingRotation);
    // Layer 6: Dashed lines (moved to appear on top)
    drawDashedLines(ctx, centerX, centerY, canvasSize, whiteRingRotation);
    // Layer 7: Red marker
    drawRedMarker(ctx, centerX, centerY, canvasSize);
}

// ===== DRAW OUTER RING =====
function drawOuterRing(ctx, centerX, centerY, canvasSize, greyRingRotation) {
  const outerRadius = canvasSize * 0.5;
  const middleRadius = canvasSize * 0.35;
  
  // Draw each wedge
  for (let i = 0; i < chromaticNotes.length; i++) {
      const centerAngle = i * angleStep + greyRingRotation - Math.PI / 2;
      const startAngle = centerAngle - angleStep / 2;
      const endAngle = centerAngle + angleStep / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.closePath();
      
      const note = chromaticNotes[i];
      // Fill wedge
      ctx.fillStyle = pianoKeyColors[note] ? '#ffffff' : '#000000';
      ctx.fill();
      
      // Add grey border
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = canvasSize * 0.001;
      ctx.stroke();
  }
}

// ===== DRAW MIDDLE RING IN WEDGES, CENTERED ON LABEL =====
function drawColoredWhiteRingSegments(ctx, centerX, centerY, canvasSize, whiteRingRotation, scaleDegreeIndices) {
    const middleRadius = canvasSize * 0.35;
    
    // Draw only the seven diatonic wedges using diatonicDegreeIndices
    diatonicDegreeIndices.forEach((index, i) => {
      const centerAngle = index * angleStep + whiteRingRotation - Math.PI / 2;
      const startAngle = centerAngle - angleStep / 2;
      const endAngle   = centerAngle + angleStep / 2;
  
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, middleRadius, startAngle, endAngle);
      ctx.closePath();
  
      // Use the original index to maintain color mapping
      ctx.fillStyle = whiteRingColors[index];
      ctx.fill();
    });
  }

// ===== DRAW INNER CIRCLE =====
function drawInnerCircle(ctx, centerX, centerY, canvasSize) {
  const innerRadius = canvasSize * 0.2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = 'black';
  ctx.fill();
}

// ===== DRAW DASHED LINES =====
function drawDashedLines(ctx, centerX, centerY, canvasSize, whiteRingRotation) {
    const outerRadius = canvasSize * 0.5;
    const innerRadius = canvasSize * 0.2;
  
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(whiteRingRotation); // Rotate dashed lines with the white ring
    ctx.strokeStyle = 'hsla(60, 100.00%, 50.00%, 0.00)'; // TRANSPARENCY SET TO ZERO FOR NOW ******
    ctx.lineWidth = canvasSize * 0.003;
    ctx.setLineDash([10, 5]);
  
    diatonicDegreeIndices.forEach(index => {
      const angle = index * angleStep - Math.PI / 2; // Adjusted angle based on rotation
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
      ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      ctx.stroke();
    });
  
    ctx.setLineDash([]);
    ctx.restore();
  }

// ===== DRAW TEXT LABELS =====
function drawLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation, greyRingRotation) {
    drawOuterLabels(ctx, centerX, centerY, canvasSize, greyRingRotation);
    drawMiddleLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation);
    drawInnerLabels(ctx, centerX, centerY, canvasSize);
}

function drawOuterLabels(ctx, centerX, centerY, canvasSize, greyRingRotation) {
    const outerRadius = canvasSize * 0.5;
    const textRadius = outerRadius * 0.85;
    const fontSize = canvasSize * fontSizeFactor;

    for (let i = 0; i < chromaticNotes.length; i++) {
        const angle = i * angleStep - Math.PI / 2 + greyRingRotation;
        const note = chromaticNotes[i];

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.rotate(-angle);

        const x = Math.cos(angle) * textRadius;
        const y = Math.sin(angle) * textRadius;

        // Invert text color based on background
        ctx.fillStyle = pianoKeyColors[note] ? '#000000' : '#ffffff';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note, x, y);
        ctx.restore();
    }
}

function drawMiddleLabels(ctx, centerX, centerY, canvasSize, whiteRingRotation) {
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

function drawInnerLabels(ctx, centerX, centerY, canvasSize) {
  const innerRadius = canvasSize * 0.2;
  const textRadius = innerRadius * 0.8;
  const fontSize = canvasSize * 0.028;

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
function drawRedMarker(ctx, centerX, centerY, canvasSize) {
  const outerRadius = canvasSize * 0.5;
  const innerRadius = canvasSize * 0.1; // Small inner radius for wedge point
  const halfAngleStep = angleStep / 2; // Half width of a regular wedge
  ctx.save();
  ctx.translate(centerX, centerY);

  // Create wedge path
  ctx.beginPath();
  // Start at inner radius
  const startAngle = -Math.PI/2 - halfAngleStep;
  const endAngle = -Math.PI/2 + halfAngleStep;
  // Draw outer arc
  ctx.arc(0, 0, outerRadius, startAngle, endAngle);
  // Draw inner arc (in reverse direction)
  ctx.arc(0, 0, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  
  // Style the wedge
  ctx.strokeStyle = 'red';
  ctx.lineWidth = canvasSize * 0.008;
  ctx.stroke();
  
  ctx.restore();
}

// ===== EXPORTS =====
export {
  chromaticNotes,
  diatonicIntervals,
  semitoneSteps,
  whiteRingColors,
  modeScaleDegrees,
  degreeMap,
  modeMapping,
  diatonicDegreeIndices,
  drawWheel
};
