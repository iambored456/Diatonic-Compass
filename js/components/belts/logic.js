// (file path: js/components/belts/logic.js)

import {
  ANGLE_STEP, FIXED_INTERVAL_COLOUR, CHROMATIC_NOTES, PIANO_KEY_COLOUR,
  MAJOR_SCALE_INTERVAL_STEPS, MODE_SCALE_DEGREES, DIATONIC_DEGREE_INDICES, TAU
} from '../../core/constants.js';
import { normAngle } from '../../core/math.js';
import { appState } from '../../state/appState.js';
import { getContrastColor } from '../../core/color.js';

function populateTrack(track, items, reps) {
  track.innerHTML = '';
  const numItems = items.length;
  for (let i = 0; i < (reps * 12) + 3; i++) {
    const itemIndex = i % numItems;
    const item = items[itemIndex];
    const cell = document.createElement('div');
    cell.className = 'belt-cell';
    cell.innerHTML = String(item);
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
  console.log('[Belts] Setting up belt content for the first time.');

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
    cell.innerHTML = chromaticLabels[idx];
  });
  const degreeCells = appState.belts.tracks.degreeBelt?.querySelectorAll('.belt-cell');
  degreeCells?.forEach(cell => {
    const idx = +cell.dataset.originalIndex;
    const bgColor = FIXED_INTERVAL_COLOUR[idx] || '#f0f0f0';
    cell.style.background = bgColor;
    cell.style.color = getContrastColor(bgColor);
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

function updateTrackTransform(track, translation, orientation) {
    if (orientation === 'vertical') {
        track.style.transform = `translateY(${translation}px)`;
    } else {
        track.style.transform = `translateX(${translation}px)`;
    }
}

function calculateTranslation(rotation, itemSize, orientation) {
    const pixelsPerRadian = (12 * itemSize) / TAU;
    const dynamicOffset = rotation * pixelsPerRadian;
    let translation;

    if (orientation === 'vertical') {
        // --- VERTICAL LOGIC ---
        // Aligns the track with the cursor at the BOTTOM of the container.
        
        // 1. Base offset to bring the second "C" (item 12) to a base reference point.
        const baseOffset = -(itemSize * 12);

        // 2. Additional offset to account for the `column-reverse` layout and
        //    align the item with the bottom of the container. We found this
        //    needs to be 3 items.
        const verticalAlignmentOffset = 3 * itemSize;

        // 3. We subtract the alignment offset to move the track further UP,
        //    which brings the correct item to the bottom of the viewport.
        translation = baseOffset - verticalAlignmentOffset + dynamicOffset;

    } else { // 'horizontal'
        // --- HORIZONTAL LOGIC ---
        // Aligns the track with the cursor at the LEFT of the container.

        // In horizontal mode, a simple 12-item offset is all that's needed
        // to align the second "C" with the left edge.
        const baseOffset = -(itemSize * 12);
        translation = baseOffset + dynamicOffset;
    }

    return translation;
}

export function updateBeltTrackPosition(track, rotation, itemSize, orientation) {
  if (!track || !itemSize) return;
  const translation = calculateTranslation(rotation, itemSize, orientation);
  updateTrackTransform(track, translation, orientation);
}

export function updateIntervalBracketsPosition(degreeRot, itemSize, orientation) {
  const track = document.querySelector('#intervalBracketsContainer .interval-brackets-track');
  if (!track || !itemSize) return;
  
  let translation = calculateTranslation(degreeRot, itemSize, orientation);

  if (orientation === 'horizontal') {
    translation += 0.5 * itemSize;
  }
  
  updateTrackTransform(track, translation, orientation);
}

export function calcBeltItemSize(beltId, container, orientation) {
  const size = orientation === 'vertical' ? container.offsetHeight : container.offsetWidth;
  if (size > 0) {
    appState.belts.itemSize[beltId] = size / 12;
    return true;
  }
  return false;
}

export function updateBeltCursorPosition(chromaticRotation, itemSize, orientation) {
  const cursor = document.getElementById('belt-cursor');
  if (!cursor || !itemSize) return;

  const pixelsPerRadian = (12 * itemSize) / TAU;
  const dynamicOffset = chromaticRotation * pixelsPerRadian;
  let translation;

  if (orientation === 'vertical') {
    // --- VERTICAL CURSOR LOGIC with "column-reverse" behavior ---

    // 1. First, define the static offset to place the cursor at the TOP
    //    of the window (position 11). Since the anchor is the bottom,
    //    we must shift it UP by 11 item heights.
    const baseOffset = -(0 * itemSize);

    // 2. ADDED: Create the "column-reverse" window effect using modulo.
    //    The window height is 12 items. We wrap the dynamic offset within this height.
    const windowHeight = -12 * itemSize;
    //    The modulo ensures the offset loops. The `+ windowHeight` handles negative numbers.
    const wrappedOffset = ((dynamicOffset % windowHeight) + windowHeight) % windowHeight;

    // 3. Combine the static top position with the looping "reversed" movement.
    //    As the user drags down, the wrapped offset increases, moving the cursor
    //    down from the top. When it reaches the bottom, it wraps back to the top.
    translation = baseOffset + wrappedOffset;

  } else { // 'horizontal'
    // --- HORIZONTAL CURSOR LOGIC ---
    // Horizontal doesn't need the reverse effect, so we use its original logic.
    const baseOffset = -(itemSize * 0);
    translation = baseOffset + dynamicOffset;
  }

  updateTrackTransform(cursor, translation, orientation);
}

// (file path: js/components/belts/logic.js)

export function updatePlaybackFlash(rings, playbackState, itemSize, orientation) {
  const flash = document.getElementById('belt-flash-overlay');
  if (!flash || !itemSize) return;

  if (playbackState.isPlaying && playbackState.currentNoteIndex !== null && playbackState.rootNoteIndexForPlayback !== null) {
      const pixelsPerRadian = (12 * itemSize) / TAU;
      let translation;

      if (orientation === 'vertical') {
          // --- VERTICAL VISUAL LOGIC ---

          // 1. Invert the base rotation to match the visual space.
          const visualCursorRotation = -rings.chromatic;

          // 2. Calculate the note offset. This remains a positive value.
          const noteOffsetRotation = (playbackState.currentNoteIndex - playbackState.rootNoteIndexForPlayback) * ANGLE_STEP;
          
          // 3. In the inverted visual space, moving UP the scale requires SUBTRACTING the offset.
          const totalVisualRotation = visualCursorRotation - noteOffsetRotation;

          // 4. Calculate the final pixel position using this new visual rotation.
          const dynamicOffset = totalVisualRotation * pixelsPerRadian;
          const windowHeight = -12 * itemSize; // Negative height for inverted looping
          const wrappedOffset = ((dynamicOffset % windowHeight) + windowHeight) % windowHeight;
          
          translation = wrappedOffset;

      } else {
          // --- HORIZONTAL LOGIC (Unchanged) ---
          const totalRotation = rings.chromatic + (playbackState.currentNoteIndex - playbackState.rootNoteIndexForPlayback) * ANGLE_STEP;
          translation = totalRotation * pixelsPerRadian;
      }

      updateTrackTransform(flash, translation, orientation);
      flash.style.display = 'block';
  } else {
      flash.style.display = 'none';
  }
}

// (file path: js/components/belts/logic.js)

export function updateBelts(
  diatonicLabels,
  chromaticLabels,
  highlightPattern
) {
  const { orientation } = appState.belts;

  if (!appState.belts.init) {
    // ... (rest of the setup code is unchanged)
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
          cell.innerHTML = `<span>+${steps}</span>`;
        }
        track.appendChild(cell);
      }
      intervalContainer.appendChild(track);
    }
    requestAnimationFrame(() => {
      const goodSizes =
        calcBeltItemSize('pitchBelt', document.getElementById('pitchBelt'), orientation) &&
        calcBeltItemSize('degreeBelt', document.getElementById('degreeBelt'), orientation) &&
        calcBeltItemSize('chromaticBelt', document.getElementById('chromaticBelt'), orientation) &&
        calcBeltItemSize('intervalBracketsContainer', document.getElementById('intervalBracketsContainer'), orientation);
      if (goodSizes) {
        appState.belts.init = true;
        console.log('[Belts] All belt item sizes calculated and initialized.');
      }
    });
    return;
  }

  const { pitchClass, degree, chromatic, highlightPosition } = appState.rings;
  const { tracks, itemSize } = appState.belts;
  
  applyBeltStyles(highlightPattern, diatonicLabels, chromaticLabels);

  // --- VISUAL TRANSLATION LAYER ---
  let visualPitchClass = pitchClass;
  let visualDegree = degree;
  let visualChromatic = chromatic;
  let visualHighlight = highlightPosition;

  if (orientation === 'vertical') {
    // Invert the rotation value for the visual update ONLY.
    visualPitchClass = -pitchClass;
    visualDegree = -degree;
    // ADDED: The crucial inversion for the chromatic belt and its highlight.
    visualChromatic = -chromatic;
    visualHighlight = -highlightPosition;
  }
  
  // Use the new visual variables to update the belt positions.
  updateBeltTrackPosition(tracks.pitchBelt, visualPitchClass, itemSize.pitchBelt, orientation);
  updateBeltTrackPosition(tracks.degreeBelt, visualDegree, itemSize.degreeBelt, orientation);
  updateIntervalBracketsPosition(visualDegree, itemSize.degreeBelt, orientation);
  
  updateBeltTrackPosition(tracks.chromaticColors, visualHighlight, itemSize.chromaticBelt, orientation);
  updateBeltTrackPosition(tracks.chromaticNumbers, visualChromatic, itemSize.chromaticBelt, orientation);
  
  updateBeltCursorPosition(visualChromatic, itemSize.chromaticBelt, orientation);
}