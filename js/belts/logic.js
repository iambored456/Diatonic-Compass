// (file path: js/belts/logic.js)

import {
  DIATONIC_DEGREE_INDICES, ANGLE_STEP,
  FIXED_INTERVAL_COLOUR, CHROMATIC_NOTES, PIANO_KEY_COLOUR,
  MAJOR_SCALE_INTERVAL_STEPS, MODE_SCALE_DEGREES, DIATONIC_INTERVALS
} from '../core/constants.js';
import { normAngle } from '../core/math.js';
import { appState } from '../state/appState.js';
import { getContrastColor } from '../core/color.js'; // <-- NEW: Import the helper

// ... updateBeltCellText function is unchanged ...
function updateBeltCellText(beltId, dynamicLabels) {
  const track = appState.belts.tracks[beltId];
  if (!track) return;
  const cells = track.querySelectorAll('.belt-cell');
  cells.forEach(cell => {
    const originalIndex = +cell.dataset.originalIndex;
    const newText = dynamicLabels[originalIndex];
    if (cell.textContent !== newText) {
      cell.textContent = newText;
    }
  });
}

// UPDATED: This function is heavily modified for the new styling rules.
function applyBeltCellStyles(beltId, modeScaleDegrees = []) {
  const track = appState.belts.tracks[beltId];
  if (!track) return;
  const cells = track.querySelectorAll('.belt-cell');

  cells.forEach(cell => {
    cell.classList.remove('white-key', 'black-key');
    cell.style.fontWeight = 'normal';

    const idx = +cell.dataset.originalIndex;

    if (beltId === 'pitchBelt') {
      const note = CHROMATIC_NOTES[idx];
      const isWhiteKey = PIANO_KEY_COLOUR[note];
      cell.style.background = isWhiteKey ? '#fff' : '#000';
      cell.style.color = isWhiteKey ? '#000' : '#fff';

    } else if (beltId === 'degreeBelt') {
      const bgColor = FIXED_INTERVAL_COLOUR[idx] || '#f0f0f0';
      cell.style.background = bgColor;
      cell.style.color = getContrastColor(bgColor); // <-- USE HELPER HERE

    } else if (beltId === 'chromaticBelt') {
      const isActive = modeScaleDegrees.includes(idx);
      
      if (isActive) {
        // Active: Dark grey background, bold white text
        cell.style.background = '#4A4A4A';
        cell.style.color = '#FFFFFF';
        cell.style.fontWeight = 'bold';
      } else {
        // Inactive: Light grey background, black text
        cell.style.background = '#E0E0E0';
        cell.style.color = '#000000';
      }
    }
  });
}

// ... All other functions in this file are unchanged ...
function updateBeltPosition(beltId, rotation) {
  const track = appState.belts.tracks[beltId];
  const cellW = appState.belts.itemW[beltId];
  if (!track || !cellW) return;
  const offsetSteps = normAngle(-rotation) / ANGLE_STEP;
  const tx = -((offsetSteps * cellW) % (cellW * 12));
  track.style.transform = `translateX(${tx}px)`;
}
function updateBeltCursorPosition(chromaticRotation) {
  const cursor = document.getElementById('belt-cursor');
  const cellW = appState.belts.itemW.chromaticBelt;
  if (!cursor || !cellW) return;
  const offsetSteps = normAngle(chromaticRotation) / ANGLE_STEP;
  const tx = ((offsetSteps * cellW) % (cellW * 12));
  cursor.style.transform = `translateX(${tx}px)`;
}
function updateIntervalBracketsPosition(whiteRot) {
  const track = document.querySelector('#intervalBracketsContainer .interval-brackets-track');
  const cellW = appState.belts.itemW.degreeBelt;
  if (!track || !cellW) return;
  const baseOffset = -(cellW * 12);
  const offSteps = normAngle(-whiteRot) / ANGLE_STEP;
  const dynamicOffset = -((offSteps * cellW) % (cellW * 12)) + 0.5 * cellW;
  const tx = baseOffset + dynamicOffset;
  track.style.transform = `translateX(${tx}px)`;
}
function setupIntervalBrackets(reps = 3) {
  const container = document.getElementById('intervalBracketsContainer');
  if (!container) return false;
  container.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'interval-brackets-track';
  for (let r = 0; r < reps; r++) { MAJOR_SCALE_INTERVAL_STEPS.forEach((steps, idx) => { const cell = document.createElement('div'); cell.className = 'interval-bracket-cell'; cell.dataset.steps = steps; cell.textContent = `+${steps}`; cell.dataset.originalIndex = idx; cell.dataset.repetition = r; track.appendChild(cell); }); }
  const stepsToAdd = [MAJOR_SCALE_INTERVAL_STEPS[0], MAJOR_SCALE_INTERVAL_STEPS[2]];
  const indicesToAdd = [0, 2];
  stepsToAdd.forEach((steps, i) => { const idx = indicesToAdd[i]; const cell = document.createElement('div'); cell.className = 'interval-bracket-cell'; cell.dataset.steps = steps; cell.textContent = `+${steps}`; cell.dataset.originalIndex = idx; cell.dataset.repetition = reps; track.appendChild(cell); });
  container.appendChild(track);
  return true;
}
function setupBeltContent(beltId, items, reps = 3) {
  const container = document.getElementById(beltId);
  if (!container) return false;
  container.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'belt-track';
  appState.belts.tracks[beltId] = track;
  for (let r = 0; r < reps; r++) { items.forEach((item, idx) => { const cell = document.createElement('div'); cell.className = 'belt-cell'; cell.textContent = item; cell.dataset.originalIndex = idx; cell.dataset.repetition = r; track.appendChild(cell); }); }
  if (items.length === 12) { for (let i = 0; i < 3; i++) { const cell = document.createElement('div'); cell.className = 'belt-cell'; cell.textContent = items[i]; cell.dataset.originalIndex = i; cell.dataset.repetition = reps; track.appendChild(cell); } }
  container.appendChild(track);
  return true;
}
function calcWidth(beltId, container) {
  const w = container.offsetWidth;
  if (w > 0) { appState.belts.itemW[beltId] = w / 12; return true; }
  return false;
}
export function updateBelts(
  diatonicLabels,
  chromaticLabels,
  chromaticPitchClasses,
  _unused,
  degreeMap
) {
  if (!appState.belts.init) {
    const ok = [
      setupBeltContent('pitchBelt', chromaticLabels, 3),
      setupBeltContent('degreeBelt', diatonicLabels, 3),
      setupBeltContent('chromaticBelt', chromaticPitchClasses, 3),
      setupIntervalBrackets(3)
    ].every(Boolean);
    if (!ok) return;
    requestAnimationFrame(() => {
      const goodWidths =
        calcWidth('pitchBelt', document.getElementById('pitchBelt')) &&
        calcWidth('degreeBelt', document.getElementById('degreeBelt')) &&
        calcWidth('chromaticBelt', document.getElementById('chromaticBelt'));
      if (goodWidths) {
        appState.belts.init = true;
        updateBelts(...arguments);
      }
    });
    return;
  }
  updateBeltCellText('pitchBelt', chromaticLabels);
  updateBeltCellText('degreeBelt', diatonicLabels);
  const degreeIdx = appState.rings.whiteDiatonic;
  const intervalName = DIATONIC_INTERVALS[DIATONIC_DEGREE_INDICES[degreeIdx]];
  const modeKey = degreeMap[intervalName] || '1';
  const modeScaleDegrees = MODE_SCALE_DEGREES[modeKey];
  applyBeltCellStyles('pitchBelt', modeScaleDegrees);
  applyBeltCellStyles('degreeBelt');
  applyBeltCellStyles('chromaticBelt', modeScaleDegrees);
  updateBeltPosition('pitchBelt', appState.rings.grey);
  updateBeltPosition('degreeBelt', appState.rings.white);
  updateIntervalBracketsPosition(appState.rings.white);
  updateBeltPosition('chromaticBelt', appState.rings.chromatic);
  updateBeltCursorPosition(appState.rings.chromatic);
}
