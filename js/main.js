import { appState } from './state/appState.js';
import { CHROMATIC_NOTES, DIATONIC_INTERVALS, DIATONIC_DEGREE_INDICES, DEGREE_MAP, MODE_NAME } from './core/constants.js';
import { drawWheel } from './canvas/drawing.js';
import { initCanvasInteraction } from './canvas/interaction.js';
import { initBeltInteraction } from './belts/interaction.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { settleMode } from './core/animation.js';
import { indexAtTop } from './core/math.js';
import { updateBelts } from './belts/logic.js';

// Get references to all relevant elements
const canvas = document.getElementById('chromaWheel');
const resultText = document.getElementById('result-text');
const flatBtn = document.getElementById('flat-btn');
const sharpBtn = document.getElementById('sharp-btn');

// ----- Sizing -----
const ro = new ResizeObserver(entries=>{
  for(const entry of entries){
    const {width,height} = entry.contentRect;
    const size = Math.min(width,height);
    canvas.width=size; canvas.height=size;
    appState.dimensions = { size, cx:size/2, cy:size/2 };
  }
});
ro.observe(canvas.parentElement);

// ----- Label Generation Logic -----
function generateDisplayLabels() {
  const { sharp, flat } = appState.display;

  const processLabel = (label) => {
    if (!label.includes('/')) return label;
    const [sharpName, flatName] = label.split('/');
    if (sharp && flat) return label;
    if (sharp) return sharpName;
    if (flat) return flatName;
    return sharpName; // Fallback (should not be reached)
  };

  const chromaticLabels = CHROMATIC_NOTES.map(processLabel);
  const diatonicLabels = DIATONIC_INTERVALS.map(processLabel);
  
  return { chromaticLabels, diatonicLabels };
}

// ----- Accidental Button Interaction -----
function handleAccidentalToggle(type) {
  appState.display[type] = !appState.display[type];

  if (!appState.display.sharp && !appState.display.flat) {
    const otherType = type === 'sharp' ? 'flat' : 'sharp';
    appState.display[otherType] = true;
  }
}

flatBtn.addEventListener('click', () => handleAccidentalToggle('flat'));
sharpBtn.addEventListener('click', () => handleAccidentalToggle('sharp'));

// ----- Interactions -----
initCanvasInteraction(canvas);
initBeltInteraction();

// ----- Render + Belts Update -----
function redraw(){
  const { size } = appState.dimensions;
  if(!size) return;

  const { chromaticLabels, diatonicLabels } = generateDisplayLabels();

  flatBtn.classList.toggle('active', appState.display.flat);
  sharpBtn.classList.toggle('active', appState.display.sharp);
  flatBtn.setAttribute('aria-pressed', String(appState.display.flat));
  sharpBtn.setAttribute('aria-pressed', String(appState.display.sharp));

  const ctx = canvas.getContext('2d');
  drawWheel(ctx, size, appState.rings, { chromaticLabels, diatonicLabels });

  updateBelts(
    diatonicLabels,
    chromaticLabels,
    [...Array(12).keys()],
    null,
    DEGREE_MAP
  );

  const pitch = chromaticLabels[indexAtTop(appState.rings.grey)];
  const degreeIdx = DIATONIC_DEGREE_INDICES[appState.rings.whiteDiatonic];
  const originalDegree = DIATONIC_INTERVALS[degreeIdx]; 
  const mode = MODE_NAME[DEGREE_MAP[originalDegree]];
  resultText.textContent = pitch + (mode ? ` ${mode}` : '');
}

makeRenderLoop(redraw);

// ----- Initialise -----
settleMode();
