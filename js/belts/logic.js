// (file path: js/belts/logic.js)

import {
  ANGLE_STEP, FIXED_INTERVAL_COLOUR, CHROMATIC_NOTES, PIANO_KEY_COLOUR,
  MAJOR_SCALE_INTERVAL_STEPS, MODE_SCALE_DEGREES, DIATONIC_DEGREE_INDICES
} from '../core/constants.js';
import { normAngle } from '../core/math.js';
import { appState } from '../state/appState.js';
import { getContrastColor } from '../core/color.js';

function populateTrack(track, items, reps) {
  track.innerHTML = '';
  const numItems = items.length;
  for (let i = 0; i < (reps * 12) + 3; i++) {
    const itemIndex = i % numItems;
    const item = items[itemIndex];
    const cell = document.createElement('div');
    cell.className = 'belt-cell';
    cell.innerHTML = String(item); // Use innerHTML to handle potential <br> tags
    cell.dataset.originalIndex = String(itemIndex);
    track.appendChild(cell);
  }
}

function createTrack(container, items, reps) {
  const track = document.createElement('div');
  track.className = 'belt-track';
  populateTrack(track, items, reps);
  container.appendChild(track);
  return track;
}

function setupBeltContent(diatonicLabels, chromaticLabels, reps = 3) {
  const pitchContainer = document.getElementById('pitchBelt');
  if (pitchContainer) {
    pitchContainer.innerHTML = '';
    appState.belts.tracks.pitchBelt = createTrack(pitchContainer, chromaticLabels, reps);
  }
  const degreeContainer = document.getElementById('degreeBelt');
  if (degreeContainer) {
    degreeContainer.innerHTML = '';
    appState.belts.tracks.degreeBelt = createTrack(degreeContainer, diatonicLabels, reps);
  }
  const colorsTrack = document.getElementById('chromatic-colors-track');
  if (colorsTrack) {
    populateTrack(colorsTrack, Array(12).fill(''), reps);
    appState.belts.tracks.chromaticColors = colorsTrack;
  }
  const numbersTrack = document.getElementById('chromatic-numbers-track');
  if (numbersTrack) {
    populateTrack(numbersTrack, [...Array(12).keys()], reps);
    appState.belts.tracks.chromaticNumbers = numbersTrack;
  }
}

function applyBeltStyles(highlightPattern, diatonicLabels, chromaticLabels) {
  const pitchCells = appState.belts.tracks.pitchBelt?.querySelectorAll('.belt-cell');
  pitchCells?.forEach(cell => {
    const idx = +cell.dataset.originalIndex;
    const note = CHROMATIC_NOTES[idx];
    const isWhiteKey = PIANO_KEY_COLOUR[note];
    cell.style.background = isWhiteKey ? '#fff' : '#000';
    cell.style.color = isWhiteKey ? '#000' : '#fff';
    // MODIFICATION: Use innerHTML to render stacked text.
    cell.innerHTML = chromaticLabels[idx];
  });
  const degreeCells = appState.belts.tracks.degreeBelt?.querySelectorAll('.belt-cell');
  degreeCells?.forEach(cell => {
    const idx = +cell.dataset.originalIndex;
    const bgColor = FIXED_INTERVAL_COLOUR[idx] || '#f0f0f0';
    cell.style.background = bgColor;
    cell.style.color = getContrastColor(bgColor);
    // MODIFICATION: Use innerHTML to render stacked text.
    cell.innerHTML = diatonicLabels[idx];
  });

  const colorCells = appState.belts.tracks.chromaticColors?.querySelectorAll('.belt-cell');
  if (colorCells) {
    colorCells.forEach(cell => {
      const idx = +cell.dataset.originalIndex;
      const isActive = highlightPattern.includes(idx);
      cell.style.background = isActive ? '#e0e0e0' : '#4a4a4a';
    });
  }

  const numberCells = appState.belts.tracks.chromaticNumbers?.querySelectorAll('.belt-cell');
  if (numberCells) {
    const { chromatic, highlightPosition } = appState.rings;
    const angle_diff = normAngle(highlightPosition - chromatic);
    const index_shift = angle_diff / ANGLE_STEP;

    numberCells.forEach(cell => {
        const numIndex = +cell.dataset.originalIndex;
        const effectiveColorIndex = (numIndex - index_shift + 12 * 100) % 12;
        const colorIndex = Math.round(effectiveColorIndex) % 12; 

        const isOverActiveBg = highlightPattern.includes(colorIndex);
        cell.style.color = isOverActiveBg ? 'black' : 'lightgray';
    });
  }
}

// ... (rest of the file is unchanged) ...
export function updateBeltPosition(track, rotation, cellW) {
  if (!track || !cellW) return;
  const offsetSteps = normAngle(-rotation) / ANGLE_STEP;
  const tx = -((offsetSteps * cellW) % (cellW * 12));
  track.style.transform = `translateX(${tx}px)`;
}

export function updateIntervalBracketsPosition(degreeRot) {
  const track = document.querySelector('#intervalBracketsContainer .interval-brackets-track');
  const cellW = appState.belts.itemW.degreeBelt;
  if (!track || !cellW) return;
  
  const baseOffset = -(cellW * 12); 
  const offSteps = normAngle(-degreeRot) / ANGLE_STEP;
  const dynamicOffset = -((offSteps * cellW) % (cellW * 12)) + 0.5 * cellW;
  const tx = baseOffset + dynamicOffset;
  track.style.transform = `translateX(${tx}px)`;
}

export function calcWidth(beltId, container) {
  const w = container.offsetWidth;
  if (w > 0) {
    appState.belts.itemW[beltId] = w / 12;
    return true;
  }
  return false;
}

export function updateBeltCursorPosition(chromaticRotation) {
  const cursor = document.getElementById('belt-cursor');
  const cellW = appState.belts.itemW.chromaticBelt;
  if (!cursor || !cellW) return;
  const offsetSteps = normAngle(chromaticRotation) / ANGLE_STEP;
  const tx = ((offsetSteps * cellW) % (cellW * 12));
  cursor.style.transform = `translateX(${tx}px)`;
}

export function updatePlaybackFlash(rings, playbackState, cellW) {
  const flash = document.getElementById('belt-flash-overlay');
  if (!flash || !cellW) return;

  if (playbackState.isPlaying && playbackState.currentNoteIndex !== null && playbackState.rootNoteIndexForPlayback !== null) {
      const cursorSteps = normAngle(rings.chromatic) / ANGLE_STEP;
      const interval = playbackState.currentNoteIndex - playbackState.rootNoteIndexForPlayback;
      const totalSteps = cursorSteps + interval;
      
      const oneCycleWidth = cellW * 12;
      const tx = (totalSteps * cellW) % oneCycleWidth;

      flash.style.transform = `translateX(${tx}px)`;
      flash.style.display = 'block';
  } else {
      flash.style.display = 'none';
  }
}

export function updateBelts(
  diatonicLabels,
  chromaticLabels,
  highlightPattern
) {
  if (!appState.belts.init) {
    setupBeltContent(diatonicLabels, chromaticLabels, 3);
    
    const intervalContainer = document.getElementById('intervalBracketsContainer');
    if (intervalContainer) {
      intervalContainer.innerHTML = ''; 
      const track = document.createElement('div');
      track.className = 'interval-brackets-track';
      
      for (let i = 0; i < 12 * 3 + 3; i++) {
        const originalIndex = i % 12;
        const majorScaleIndex = DIATONIC_DEGREE_INDICES.indexOf(originalIndex);
        const cell = document.createElement('div');
        cell.className = 'interval-bracket-cell';
        
        if (majorScaleIndex !== -1) {
          const steps = MAJOR_SCALE_INTERVAL_STEPS[majorScaleIndex];
          cell.dataset.steps = steps;
          cell.innerHTML = `+${steps}`;
        }
        track.appendChild(cell);
      }
      intervalContainer.appendChild(track);
    }

    requestAnimationFrame(() => {
      const goodWidths =
        calcWidth('pitchBelt', document.getElementById('pitchBelt')) &&
        calcWidth('degreeBelt', document.getElementById('degreeBelt')) &&
        calcWidth('chromaticBelt', document.getElementById('chromaticBelt')) &&
        calcWidth('intervalBracketsContainer', document.getElementById('intervalBracketsContainer'));
      if (goodWidths) {
        appState.belts.init = true;
      }
    });
    return;
  }

  const { pitchClass, degree, chromatic, highlightPosition } = appState.rings;
  const { tracks, itemW } = appState.belts;
  
  applyBeltStyles(highlightPattern, diatonicLabels, chromaticLabels);

  updateBeltPosition(tracks.pitchBelt, pitchClass, itemW.pitchBelt);
  updateBeltPosition(tracks.degreeBelt, degree, itemW.degreeBelt);
  updateIntervalBracketsPosition(degree);

  updateBeltPosition(tracks.chromaticColors, highlightPosition, itemW.chromaticBelt);
  updateBeltPosition(tracks.chromaticNumbers, chromatic, itemW.chromaticBelt);
  
  updateBeltCursorPosition(chromatic);
}
