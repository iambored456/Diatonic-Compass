// (file path: js/components/Belts.js)

import { ANGLE_STEP, TAU, DIATONIC_DEGREE_INDICES, MAJOR_SCALE_INTERVAL_STEPS, CHROMATIC_NOTES, PIANO_KEY_COLOUR, FIXED_INTERVAL_COLOUR } from '../core/constants.js';
import { snapRing, snapChromaticAndSettleMode, snapDegreeToDiatonic } from '../core/animation.js';
import { setRingAngle, coRotateRings } from '../core/actions.js';
import { normAngle } from '../core/math.js';
import { getContrastColor } from '../core/color.js';

export default class Belts {
  constructor(container, state, onInteractionEnd) {
    this.container = container;
    this.state = state;
    this.onInteractionEnd = onInteractionEnd;

    this.elements = {
      pitchBelt: container.querySelector('#pitchBelt'),
      degreeBelt: container.querySelector('#degreeBelt'),
      chromaticBelt: container.querySelector('#chromaticBelt'),
      chromaticColorsTrack: container.querySelector('#chromatic-colors-track'),
      chromaticNumbersTrack: container.querySelector('#chromatic-numbers-track'),
      intervalBracketsTrackContainer: container.querySelector('#intervalBracketsContainer'),
      intervalBracketsWrapper: container.querySelector('.interval-brackets-wrapper'),
      cursor: container.querySelector('#belt-cursor'),
      flashOverlay: container.querySelector('#belt-flash-overlay'),
    };

    this.state.belts.tracks = {};

    this._initInteraction();
  }

  // --- Public API ---

  update(labels, highlightPattern) {
    const { orientation } = this.state.belts;
    const { diatonicLabels, chromaticLabels } = labels;

    if (!this.state.belts.init) {
      this._setupAllBelts(diatonicLabels, chromaticLabels);
      
      requestAnimationFrame(() => {
        const sizesCalculated = this._calculateAllItemSizes(orientation);
        if (sizesCalculated) {
          this.state.belts.init = true;
        }
      });
      return;
    }

    const { pitchClass, degree, chromatic, highlightPosition } = this.state.rings;
    const { tracks, itemSize } = this.state.belts;
    
    this._applyBeltStyles(highlightPattern, diatonicLabels, chromaticLabels);

    let visualPitchClass = orientation === 'vertical' ? -pitchClass : pitchClass;
    let visualDegree = orientation === 'vertical' ? -degree : degree;
    let visualChromatic = orientation === 'vertical' ? -chromatic : chromatic;
    let visualHighlight = orientation === 'vertical' ? -highlightPosition : highlightPosition;

    this._updateTrackPosition(tracks.pitchBelt, visualPitchClass, itemSize.pitchBelt, orientation);
    this._updateTrackPosition(tracks.degreeBelt, visualDegree, itemSize.degreeBelt, orientation);
    this._updateTrackPosition(tracks.chromaticColors, visualHighlight, itemSize.chromaticBelt, orientation);
    this._updateTrackPosition(tracks.chromaticNumbers, visualChromatic, itemSize.chromaticBelt, orientation);
    
    this._updateIntervalBracketsPosition(visualDegree, itemSize.degreeBelt, orientation);
    this._updateCursorPosition(visualChromatic, itemSize.chromaticBelt, orientation);
    this._updatePlaybackFlash();
  }

  _initInteraction() {
    const { pitchBelt, degreeBelt, intervalBrackets, chromaticNumbersTrack } = this.elements;

    if (pitchBelt) {
      this._addDragHandler(pitchBelt,
        (delta) => {
          const newAngle = this.state.drag.startPitchClass + (this.state.belts.orientation === 'vertical' ? -delta : delta);
          setRingAngle('pitchClass', newAngle);
        },
        () => snapRing('pitchClass', this.onInteractionEnd)
      );
    }
    
    const degreeOnMove = (delta) => {
        const moveDelta = this.state.belts.orientation === 'vertical' ? -delta : delta;
        setRingAngle('degree', this.state.drag.startDegree + moveDelta);
        setRingAngle('highlightPosition', this.state.drag.startHighlight + moveDelta);
    };
    const degreeOnFinish = () => snapDegreeToDiatonic(this.onInteractionEnd);
    if (degreeBelt) this._addDragHandler(degreeBelt, degreeOnMove, degreeOnFinish);
    if (intervalBrackets) this._addDragHandler(intervalBrackets, degreeOnMove, degreeOnFinish);

    if (chromaticNumbersTrack) {
      this._addDragHandler(chromaticNumbersTrack,
        (delta) => {
          const moveDelta = this.state.belts.orientation === 'vertical' ? -delta : delta;
          const startAngles = {
            startPitchClass: this.state.drag.startPitchClass,
            startDegree: this.state.drag.startDegree,
            startChrom: this.state.drag.startChrom,
            startHighlight: this.state.drag.startHighlight
          };
          coRotateRings(startAngles, moveDelta);
        },
        () => snapChromaticAndSettleMode(this.onInteractionEnd)
      );
    }
  }

  _addDragHandler(element, onMove, onFinish) {
    element.style.cursor = 'grab';
    let activePointerId = null;
    let startX = 0, startY = 0;

    const onPointerDown = (e) => {
      activePointerId = e.pointerId;
      element.setPointerCapture(activePointerId);
      startX = e.clientX;
      startY = e.clientY;
      
      const { drag, rings } = this.state;
      drag.active = element.id || 'belt-drag';
      drag.startPitchClass = rings.pitchClass;
      drag.startDegree = rings.degree;
      drag.startChrom = rings.chromatic;
      drag.startHighlight = rings.highlightPosition;
      
      element.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (activePointerId !== e.pointerId) return;
      const { orientation, itemSize } = this.state.belts;
      const deltaPos = orientation === 'vertical' ? e.clientY - startY : e.clientX - startX;
      
      let sizeKey;
      if (element.id.includes('pitch')) sizeKey = 'pitchBelt';
      else if (element.id.includes('degree') || element.id.includes('interval')) sizeKey = 'degreeBelt';
      else if (element.id.includes('chromatic')) sizeKey = 'chromaticBelt';
      
      const beltItemSize = itemSize[sizeKey];
      if (!beltItemSize || beltItemSize === 0) return;
      
      const deltaAngle = (deltaPos / beltItemSize) * ANGLE_STEP;
      onMove(deltaAngle);
    };

    const onPointerUp = () => {
      if (activePointerId === null) return;
      element.releasePointerCapture(activePointerId);
      activePointerId = null;
      this.state.drag.active = null;
      element.style.cursor = 'grab';
      onFinish();
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
  }

  _setupAllBelts(diatonicLabels, chromaticLabels) {
    this.elements.pitchBelt.innerHTML = '';
    this.elements.degreeBelt.innerHTML = '';
    this.elements.intervalBracketsTrackContainer.innerHTML = '';

    const reps = 3;
    this.state.belts.tracks.pitchBelt = this._createTrack(this.elements.pitchBelt, chromaticLabels, reps);
    this.state.belts.tracks.degreeBelt = this._createTrack(this.elements.degreeBelt, diatonicLabels, reps);
    this._populateTrack(this.elements.chromaticColorsTrack, Array(12).fill(''), reps);
    this._populateTrack(this.elements.chromaticNumbersTrack, [...Array(12).keys()], reps);
    this.state.belts.tracks.chromaticColors = this.elements.chromaticColorsTrack;
    this.state.belts.tracks.chromaticNumbers = this.elements.chromaticNumbersTrack;

    this._createIntervalBracketsTrack(reps);
  }
  
  _createTrack(container, items, reps) {
    const track = document.createElement('div');
    track.className = 'belt-track';
    this._populateTrack(track, items, reps);
    container.appendChild(track);
    return track;
  }
  
  _populateTrack(track, items, reps) {
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

  _createIntervalBracketsTrack(reps) {
    const track = document.createElement('div');
    track.className = 'interval-brackets-track';
    for (let i = 0; i < 12 * reps + 3; i++) {
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
    this.elements.intervalBracketsTrackContainer.appendChild(track);
  }

  _calculateAllItemSizes(orientation) {
    return this._calcBeltItemSize('pitchBelt', this.elements.pitchBelt, orientation) &&
           this._calcBeltItemSize('degreeBelt', this.elements.degreeBelt, orientation) &&
           this._calcBeltItemSize('chromaticBelt', this.elements.chromaticBelt, orientation) &&
          this._calcBeltItemSize('intervalBracketsContainer', this.elements.intervalBracketsWrapper, orientation);  }

  _calcBeltItemSize(beltId, container, orientation) {
    const size = orientation === 'vertical' ? container.offsetHeight : container.offsetWidth;
    if (size > 0) {
      this.state.belts.itemSize[beltId] = size / 12;
      return true;
    }
    return false;
  }
  
  _applyBeltStyles(highlightPattern, diatonicLabels, chromaticLabels) {
    this.state.belts.tracks.pitchBelt?.querySelectorAll('.belt-cell').forEach(cell => {
        const idx = +cell.dataset.originalIndex;
        const note = CHROMATIC_NOTES[idx];
        const isWhiteKey = PIANO_KEY_COLOUR[note];
        cell.style.background = isWhiteKey ? '#fff' : '#000';
        cell.style.color = isWhiteKey ? '#000' : '#fff';
        cell.innerHTML = chromaticLabels[idx];
    });

    this.state.belts.tracks.degreeBelt?.querySelectorAll('.belt-cell').forEach(cell => {
        const idx = +cell.dataset.originalIndex;
        const bgColor = FIXED_INTERVAL_COLOUR[idx] || '#f0f0f0';
        cell.style.background = bgColor;
        cell.style.color = getContrastColor(bgColor);
        cell.innerHTML = diatonicLabels[idx];
    });

    this.elements.chromaticColorsTrack?.querySelectorAll('.belt-cell').forEach(cell => {
        const idx = +cell.dataset.originalIndex;
        cell.style.background = highlightPattern.includes(idx) ? '#e0e0e0' : '#4a4a4a';
    });
    
    this.elements.chromaticNumbersTrack?.querySelectorAll('.belt-cell').forEach(cell => {
        const { chromatic, highlightPosition } = this.state.rings;
        const angle_diff = normAngle(highlightPosition - chromatic);
        const index_shift = angle_diff / ANGLE_STEP;
        const numIndex = +cell.dataset.originalIndex;
        const effectiveColorIndex = Math.round((numIndex - index_shift + 12 * 100) % 12) % 12;
        cell.style.color = highlightPattern.includes(effectiveColorIndex) ? 'black' : 'lightgray';
    });
  }
  
  _calculateTranslation(rotation, itemSize, orientation) {
    const pixelsPerRadian = (12 * itemSize) / TAU;
    const dynamicOffset = rotation * pixelsPerRadian;
    let baseOffset, alignmentOffset = 0;

    if (orientation === 'vertical') {
        baseOffset = -(itemSize * 12);
        alignmentOffset = 3 * itemSize;
        return baseOffset - alignmentOffset + dynamicOffset;
    } else {
        baseOffset = -(itemSize * 12);
        return baseOffset + dynamicOffset;
    }
  }

  _updateTrackPosition(track, rotation, itemSize, orientation) {
    if (!track || !itemSize) return;
    const translation = this._calculateTranslation(rotation, itemSize, orientation);
    const transform = orientation === 'vertical' ? `translateY(${translation}px)` : `translateX(${translation}px)`;
    track.style.transform = transform;
  }
  
  _updateIntervalBracketsPosition(degreeRot, itemSize, orientation) {
    const track = this.elements.intervalBracketsTrackContainer.querySelector('.interval-brackets-track');
    if (!track || !itemSize) return;
    let translation = this._calculateTranslation(degreeRot, itemSize, orientation);
    if (orientation === 'horizontal') {
        translation += 0.5 * itemSize;
    }
    const transform = orientation === 'vertical' ? `translateY(${translation}px)` : `translateX(${translation}px)`;
    track.style.transform = transform;
  }
  
  _updateCursorPosition(chromaticRotation, itemSize, orientation) {
    const cursor = this.elements.cursor;
    if (!cursor || !itemSize) return;

    const pixelsPerRadian = (12 * itemSize) / TAU;
    const dynamicOffset = chromaticRotation * pixelsPerRadian;
    let translation;

    if (orientation === 'vertical') {
        const windowHeight = -12 * itemSize;
        translation = ((dynamicOffset % windowHeight) + windowHeight) % windowHeight;
    } else {
        translation = dynamicOffset;
    }
    
    const transform = orientation === 'vertical' ? `translateY(${translation}px)` : `translateX(${translation}px)`;
    cursor.style.transform = transform;
  }
  
  _updatePlaybackFlash() {
      const { rings, playback, belts } = this.state;
      const flash = this.elements.flashOverlay;
      const itemSize = belts.itemSize.chromaticBelt;
      const orientation = belts.orientation;

      if (!flash || !itemSize || !playback.isPlaying || playback.currentNoteIndex === null) {
          flash.style.display = 'none';
          return;
      }
      
      const pixelsPerRadian = (12 * itemSize) / TAU;
      let translation;

      if (orientation === 'vertical') {
          const visualCursorRotation = -rings.chromatic;
          const noteOffsetRotation = (playback.currentNoteIndex - playback.rootNoteIndexForPlayback) * ANGLE_STEP;
          const totalVisualRotation = visualCursorRotation - noteOffsetRotation;
          const dynamicOffset = totalVisualRotation * pixelsPerRadian;
          const windowHeight = -12 * itemSize;
          translation = ((dynamicOffset % windowHeight) + windowHeight) % windowHeight;
      } else {
          const totalRotation = rings.chromatic + (playback.currentNoteIndex - playback.rootNoteIndexForPlayback) * ANGLE_STEP;
          translation = totalRotation * pixelsPerRadian;
      }
      
      const transform = orientation === 'vertical' ? `translateY(${translation}px)` : `translateX(${translation}px)`;
      flash.style.transform = transform;
      flash.style.display = 'block';
  }
}