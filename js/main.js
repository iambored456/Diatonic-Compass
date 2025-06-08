// (file path: js/main.js)

import { appState } from './state/appState.js';
import { CHROMATIC_NOTES, DIATONIC_INTERVALS, DEGREE_MAP, MODE_NAME, MODE_SCALE_DEGREES } from './core/constants.js';
import { drawWheel } from './canvas/drawing.js';
import { initCanvasInteraction } from './canvas/interaction.js';
import { initBeltInteraction } from './belts/interaction.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { indexAtTop, normAngle } from './core/math.js';
import { updateBelts } from './belts/logic.js';

const canvas = document.getElementById('chromaWheel');
const resultText = document.getElementById('result-text');
const flatBtn = document.getElementById('flat-btn');
const sharpBtn = document.getElementById('sharp-btn');

const ro = new ResizeObserver(entries=>{
  for(const entry of entries){
    const {width,height} = entry.contentRect;
    const size = Math.min(width,height);
    canvas.width=size; canvas.height=size;
    appState.dimensions = { size, cx:size/2, cy:size/2 };
  }
});
ro.observe(canvas.parentElement);

function generateDisplayLabels() {
  const { sharp, flat } = appState.display;
  const processLabel = (label) => {
    if (!label.includes('/')) return label;
    const [sharpName, flatName] = label.split('/');
    if (sharp && flat) return label;
    if (sharp) return sharpName;
    if (flat) return flatName;
    return sharpName;
  };
  const chromaticLabels = CHROMATIC_NOTES.map(processLabel);
  const diatonicLabels = DIATONIC_INTERVALS.map(processLabel);
  return { chromaticLabels, diatonicLabels };
}

function updateResultText() {
  const { chromaticLabels } = generateDisplayLabels();
  const { pitchClass, degree, chromatic } = appState.rings;

  const effectivePitchRotation = normAngle(pitchClass - chromatic);
  const effectiveDegreeRotation = normAngle(degree - chromatic);

  const rootNoteIndex = indexAtTop(effectivePitchRotation);
  const modeDegreeIndex = indexAtTop(effectiveDegreeRotation);
  
  const pitch = chromaticLabels[rootNoteIndex];
  const tonicInterval = DIATONIC_INTERVALS[modeDegreeIndex];
  const modeKey = DEGREE_MAP[tonicInterval] || null;
  const modeName = modeKey ? MODE_NAME[modeKey] : '...';
  
  resultText.textContent = `${pitch} ${modeName}`;
}


function handleAccidentalToggle(type) {
  appState.display[type] = !appState.display[type];
  if (!appState.display.sharp && !appState.display.flat) {
    const otherType = type === 'sharp' ? 'flat' : 'sharp';
    appState.display[otherType] = true;
  }
  updateResultText();
}

flatBtn.addEventListener('click', () => handleAccidentalToggle('flat'));
sharpBtn.addEventListener('click', () => handleAccidentalToggle('sharp'));

function onInteractionEnd() {
  updateResultText();
}

initCanvasInteraction(canvas, onInteractionEnd);
initBeltInteraction(onInteractionEnd);

function redraw(){
  const { size } = appState.dimensions;
  if(!size) return;
  
  const { rings } = appState;
  const { chromaticLabels, diatonicLabels } = generateDisplayLabels();
  
  // --- DYNAMIC HIGHLIGHT CALCULATION ---
  // The highlight pattern is now calculated on every frame for immediate responsiveness.
  const effectiveDegreeRotation = normAngle(rings.degree - rings.chromatic);
  const modeIndex = indexAtTop(effectiveDegreeRotation);
  const tonicInterval = DIATONIC_INTERVALS[modeIndex];
  const modeKey = DEGREE_MAP[tonicInterval] || null;
  const highlightPattern = modeKey ? MODE_SCALE_DEGREES[modeKey] : [];
  // --- END DYNAMIC CALCULATION ---

  flatBtn.classList.toggle('active', appState.display.flat);
  sharpBtn.classList.toggle('active', appState.display.sharp);
  flatBtn.setAttribute('aria-pressed', String(appState.display.flat));
  sharpBtn.setAttribute('aria-pressed', String(appState.display.sharp));

  const ctx = canvas.getContext('2d');
  drawWheel(ctx, size, rings, { chromaticLabels, diatonicLabels });

  updateBelts(
    diatonicLabels,
    chromaticLabels,
    highlightPattern // Pass the dynamically calculated pattern
  );
  
  // Update the result text on every frame as well.
  updateResultText();
}

makeRenderLoop(redraw);
