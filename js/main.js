// (file path: js/main.js)

import { appState } from './state/appState.js';
import { CHROMATIC_NOTES, DIATONIC_INTERVALS, DEGREE_MAP, MODE_NAME, DIATONIC_DEGREE_INDICES, BELT_TEXT_STACK_THRESHOLD } from './core/constants.js';
import { drawWheel } from './canvas/drawing.js';
import { initCanvasInteraction } from './canvas/interaction.js';
import { initBeltInteraction } from './components/belts/interaction.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { indexAtTop, normAngle } from './core/math.js';
import { updateBelts, updatePlaybackFlash } from './components/belts/logic.js';
import { startPlayback, stopPlayback } from './playback.js';

console.log("Diatonic Compass Initializing...");

const mainContainer = document.querySelector('.main-container');
const canvas = document.getElementById('chromaWheel');
const resultContainer = document.getElementById('result-container');
const resultText = document.getElementById('result-text');
const flatBtn = document.getElementById('flat-btn');
const sharpBtn = document.getElementById('sharp-btn');
const settingsBtn = document.getElementById('settings-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const toggleOrientationBtn = document.getElementById('toggle-orientation-btn');

appState.dimensions = {
  size: 0,
  cx: 0,
  cy: 0,
  dpr: window.devicePixelRatio || 1,
};

function generateDisplayLabels() {
  const { sharp, flat } = appState.display;
  const { orientation, itemSize } = appState.belts;
  const cellW = itemSize.pitchBelt || 0;
  const useStacked = (orientation === 'vertical') || (cellW > 0 && cellW < BELT_TEXT_STACK_THRESHOLD);

  const processLabel = (label) => {
    if (!label.includes('/')) return label;
    const [sharpName, flatName] = label.split('/');
    if (useStacked) {
        if (sharp && flat) return `${sharpName}<br>${flatName}`;
        if (sharp) return sharpName;
        if (flat) return flatName;
        return `${sharpName}<br>${flatName}`;
    }
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

  const { pitchClass, degree, chromatic } = appState.rings;
  const effectivePitchRotation = normAngle(pitchClass - chromatic);
  const effectiveDegreeRotation = normAngle(degree - chromatic);

  const rootNoteIndex = indexAtTop(effectivePitchRotation);
  const modeDegreeIndex = indexAtTop(effectiveDegreeRotation);
  
  const pitch = chromaticLabels[rootNoteIndex];
  const tonicInterval = DIATONIC_INTERVALS[modeDegreeIndex];
  const modeKey = DEGREE_MAP[tonicInterval] || null;
  const modeName = modeKey ? MODE_NAME[modeKey] : '...';
  
  const newResult = `${pitch} ${modeName}`;
  if (resultText.textContent !== newResult) {
      resultText.textContent = newResult;
  }
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
  if (e.target.closest('button')) return;
  if (appState.playback.isPlaying) {
    stopPlayback();
  } else if (!appState.drag.active && !appState.animation) {
    startPlayback();
  }
});

flatBtn.addEventListener('click', () => handleAccidentalToggle('flat'));
sharpBtn.addEventListener('click', () => handleAccidentalToggle('sharp'));

function onInteractionEnd() {
  updateResultText();
}

function openSidebar() {
  sidebar.classList.add('open');
  sidebar.setAttribute('aria-hidden', 'false');
  sidebarOverlay.classList.add('visible');
  settingsBtn.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  settingsBtn.focus(); 
  sidebar.classList.remove('open');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebarOverlay.classList.remove('visible');
  settingsBtn.setAttribute('aria-expanded', 'false');
}

function toggleOrientation() {
    console.log('[Main] Toggling belt orientation.');
    const newOrientation = appState.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    appState.belts.orientation = newOrientation;
    console.log(`[State] Belt orientation set to: ${newOrientation}`);
  
    // FIX: Reset ring positions to 0 for a clean state on toggle.
    appState.rings.pitchClass = 0;
    appState.rings.degree = 0;
    appState.rings.chromatic = 0;
    appState.rings.highlightPosition = 0;
    console.log('[State] Resetting ring positions to 0 for orientation change.');

    mainContainer.classList.toggle('vertical-layout', newOrientation === 'vertical');
  
    appState.belts.init = false;
    console.log('[Belts] Belt initialization reset for recalculation.');
  
    closeSidebar();
}

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

sidebarOverlay.addEventListener('click', closeSidebar);
toggleOrientationBtn.addEventListener('click', toggleOrientation);

initCanvasInteraction(canvas, onInteractionEnd);
initBeltInteraction(onInteractionEnd);

function checkCanvasSize() {
    const { dpr } = appState.dimensions;
    const newSize = canvas.offsetWidth;

    if (newSize === appState.dimensions.size) {
        return;
    }

    console.log(`[Canvas] Resizing from ${appState.dimensions.size}px to ${newSize}px`);
    appState.dimensions.size = newSize;
    appState.dimensions.cx = newSize / 2;
    appState.dimensions.cy = newSize / 2;
    
    canvas.width = newSize * dpr;
    canvas.height = newSize * dpr;

    appState.belts.init = false; 
}

function redraw(){
  checkCanvasSize();

  const { size, dpr } = appState.dimensions;
  if(!size) return;
  
  const { rings, playback, belts } = appState;
  const { chromaticLabels, diatonicLabels } = generateDisplayLabels();
  
  const highlightPattern = DIATONIC_DEGREE_INDICES;

  flatBtn.classList.toggle('active', appState.display.flat);
  sharpBtn.classList.toggle('active', appState.display.sharp);
  flatBtn.setAttribute('aria-pressed', String(appState.display.flat));
  sharpBtn.setAttribute('aria-pressed', String(appState.display.sharp));

  const ctx = canvas.getContext('2d');
  drawWheel(ctx, size, dpr, rings, { chromaticLabels, diatonicLabels }, playback);

  updateBelts(
    diatonicLabels,
    chromaticLabels,
    highlightPattern
  );
  
  const chromaticItemSize = belts.itemSize.chromaticBelt;
  const beltOrientation = belts.orientation;
  updatePlaybackFlash(rings, playback, chromaticItemSize, beltOrientation);
  
  updateResultText();
}

console.log('[Main] Starting render loop.');
makeRenderLoop(redraw);