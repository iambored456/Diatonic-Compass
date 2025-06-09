// (file path: js/main.js)

import { appState } from './state/appState.js';
import { CHROMATIC_NOTES, DIATONIC_INTERVALS, DEGREE_MAP, MODE_NAME, DIATONIC_DEGREE_INDICES } from './core/constants.js';
import { drawWheel } from './canvas/drawing.js';
import { initCanvasInteraction } from './canvas/interaction.js';
import { initBeltInteraction } from './belts/interaction.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { indexAtTop, normAngle } from './core/math.js';
import { updateBelts, updatePlaybackFlash } from './belts/logic.js';
import { startPlayback, stopPlayback } from './playback.js';

const canvas = document.getElementById('chromaWheel');
const resultContainer = document.getElementById('result-container');
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

resultContainer.addEventListener('click', (e) => {
  // Ignore clicks on buttons inside the container
  if (e.target.closest('button')) return;

  if (appState.playback.isPlaying) {
    stopPlayback();
  } else if (!appState.drag.active && !appState.animation) { // Prevent playback during other animations
    startPlayback();
  }
});

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
  
  const { rings, playback, belts } = appState;
  const { chromaticLabels, diatonicLabels } = generateDisplayLabels();
  
  const highlightPattern = DIATONIC_DEGREE_INDICES;

  flatBtn.classList.toggle('active', appState.display.flat);
  sharpBtn.classList.toggle('active', appState.display.sharp);
  flatBtn.setAttribute('aria-pressed', String(appState.display.flat));
  sharpBtn.setAttribute('aria-pressed', String(appState.display.sharp));

  const ctx = canvas.getContext('2d');
  drawWheel(ctx, size, rings, { chromaticLabels, diatonicLabels }, playback);

  updateBelts(
    diatonicLabels,
    chromaticLabels,
    highlightPattern
  );
  
  updatePlaybackFlash(rings, playback, belts.itemW.chromaticBelt);
  
  updateResultText();
}

makeRenderLoop(redraw);
