// (file path: js/components/Belts.js)

import { ANGLE_STEP, TAU, DIATONIC_DEGREE_INDICES, MAJOR_SCALE_INTERVAL_STEPS, CHROMATIC_NOTES, PIANO_KEY_COLOUR, FIXED_INTERVAL_COLOUR, CHROMATIC_DIVISIONS } from '../core/constants.js';
import { snapRing, snapChromaticAndSettleMode, snapDegreeToDiatonic } from '../core/animation.js';
import { setRingAngle, rotateCoupledRings } from '../core/actions.js';
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

  // --- Ring-to-Belt Conversion Helper ---
  
  /**
   * Calculate the conversion factor from ring angle (radians) to belt distance (pixels)
   * This is the core relationship between circular rings and linear belts
   */
  _calculateRingAngleToBeltPixelsRatio(beltCellWidth) {
    if (!beltCellWidth || beltCellWidth <= 0) {
      console.warn('Invalid beltCellWidth for ring-to-belt conversion:', beltCellWidth);
      return 0;
    }
    return (CHROMATIC_DIVISIONS * beltCellWidth) / TAU;
  }

  // --- Public API ---

  update(labels, highlightPattern) {
    const { orientation } = this.state.belts;
    const { diatonicLabels, chromaticLabels } = labels;

    if (!this.state.belts.init) {
      this._setupAllBelts(diatonicLabels, chromaticLabels);
      
      requestAnimationFrame(() => {
        const sizesCalculated = this._calculateAllBeltCellWidths(orientation);
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

    this._positionBeltFromRingAngle(tracks.pitchBelt, visualPitchClass, itemSize.pitchBelt, orientation);
    this._positionBeltFromRingAngle(tracks.degreeBelt, visualDegree, itemSize.degreeBelt, orientation);
    this._positionBeltFromRingAngle(tracks.chromaticColors, visualHighlight, itemSize.chromaticBelt, orientation);
    this._positionBeltFromRingAngle(tracks.chromaticNumbers, visualChromatic, itemSize.chromaticBelt, orientation);
    
    this._positionIntervalBeltFromDegreeRing(visualDegree, itemSize.degreeBelt, orientation);
    this._positionBeltCursorFromRingAngle(visualChromatic, itemSize.chromaticBelt, orientation);
    this._updatePlaybackFlashOnBelt();
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
          rotateCoupledRings(startAngles, moveDelta);
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
      const beltDragDistance = orientation === 'vertical' ? e.clientY - startY : e.clientX - startX;
      
      let beltSizeKey;
      if (element.id.includes('pitch')) beltSizeKey = 'pitchBelt';
      else if (element.id.includes('degree') || element.id.includes('interval')) beltSizeKey = 'degreeBelt';
      else if (element.id.includes('chromatic')) beltSizeKey = 'chromaticBelt';
      
      const beltCellWidth = itemSize[beltSizeKey];
      if (!beltCellWidth || beltCellWidth === 0) return;
      
      const beltDistanceToRingAngle = (beltDragDistance / beltCellWidth) * ANGLE_STEP;
      onMove(beltDistanceToRingAngle);
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

    const RING_TO_BELT_UNWRAP_CYCLES = 3;
    this.state.belts.tracks.pitchBelt = this._createBeltTrack(this.elements.pitchBelt, chromaticLabels, RING_TO_BELT_UNWRAP_CYCLES);
    this.state.belts.tracks.degreeBelt = this._createBeltTrack(this.elements.degreeBelt, diatonicLabels, RING_TO_BELT_UNWRAP_CYCLES);
    this._populateBeltTrack(this.elements.chromaticColorsTrack, Array(12).fill(''), RING_TO_BELT_UNWRAP_CYCLES);
    this._populateBeltTrack(this.elements.chromaticNumbersTrack, [...Array(12).keys()], RING_TO_BELT_UNWRAP_CYCLES);
    this.state.belts.tracks.chromaticColors = this.elements.chromaticColorsTrack;
    this.state.belts.tracks.chromaticNumbers = this.elements.chromaticNumbersTrack;

    this._createIntervalBeltTrack(RING_TO_BELT_UNWRAP_CYCLES);
  }
  
  _createBeltTrack(container, items, ringUnwrapCycles) {
    const track = document.createElement('div');
    track.className = 'belt-track';
    this._populateBeltTrack(track, items, ringUnwrapCycles);
    container.appendChild(track);
    return track;
  }
  
  _populateBeltTrack(track, items, ringUnwrapCycles) {
    track.innerHTML = '';
    const BELT_SMOOTH_SCROLL_BUFFER = 3;
    const numItems = items.length;
    for (let i = 0; i < (ringUnwrapCycles * CHROMATIC_DIVISIONS) + BELT_SMOOTH_SCROLL_BUFFER; i++) {
      const itemIndex = i % numItems;
      const item = items[itemIndex];
      const cell = document.createElement('div');
      cell.className = 'belt-cell';
      cell.innerHTML = String(item);
      cell.dataset.originalIndex = String(itemIndex);
      track.appendChild(cell);
    }
  }

  _createIntervalBeltTrack(ringUnwrapCycles) {
    const track = document.createElement('div');
    track.className = 'interval-brackets-track';
    const BELT_SMOOTH_SCROLL_BUFFER = 3;
    for (let i = 0; i < CHROMATIC_DIVISIONS * ringUnwrapCycles + BELT_SMOOTH_SCROLL_BUFFER; i++) {
        const originalIndex = i % CHROMATIC_DIVISIONS;
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

  _calculateAllBeltCellWidths(orientation) {
    return this._calculateBeltCellWidth('pitchBelt', this.elements.pitchBelt, orientation) &&
           this._calculateBeltCellWidth('degreeBelt', this.elements.degreeBelt, orientation) &&
           this._calculateBeltCellWidth('chromaticBelt', this.elements.chromaticBelt, orientation) &&
           this._calculateBeltCellWidth('intervalBracketsContainer', this.elements.intervalBracketsWrapper, orientation);
  }

  _calculateBeltCellWidth(beltId, container, orientation) {
    const beltContainerSize = orientation === 'vertical' ? container.offsetHeight : container.offsetWidth;
    if (beltContainerSize > 0) {
      this.state.belts.itemSize[beltId] = beltContainerSize / CHROMATIC_DIVISIONS;
      return true;
    }
    return false;
  }
  
  _applyBeltStyles(highlightPattern, diatonicLabels, chromaticLabels) {
    this.state.belts.tracks.pitchBelt?.querySelectorAll('.belt-cell').forEach(cell => {
        const idx = +cell.dataset.originalIndex;
        const note = CHROMATIC_NOTES[idx];
        const isWhiteKey = PIANO_KEY_COLOUR[note];
        // --- REVERTED to original static colors ---
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
  
  _convertRingAngleToBeltDistance(ringAngle, beltCellWidth, orientation) {
    const ringAngleToBeltPixels = this._calculateRingAngleToBeltPixelsRatio(beltCellWidth);
    if (ringAngleToBeltPixels === 0) return 0; // Early exit for invalid calculations
    
    const ringAngleAsBeltPixels = ringAngle * ringAngleToBeltPixels;
    let baseBeltOffset, verticalBeltAdjustment = 0;

    if (orientation === 'vertical') {
        baseBeltOffset = -(beltCellWidth * CHROMATIC_DIVISIONS);
        verticalBeltAdjustment = 3 * beltCellWidth;
        return baseBeltOffset - verticalBeltAdjustment + ringAngleAsBeltPixels;
    } else {
        baseBeltOffset = -(beltCellWidth * CHROMATIC_DIVISIONS);
        return baseBeltOffset + ringAngleAsBeltPixels;
    }
  }

  _positionBeltFromRingAngle(beltTrack, ringAngle, beltCellWidth, orientation) {
    if (!beltTrack || !beltCellWidth) return;
    const beltScrollDistance = this._convertRingAngleToBeltDistance(ringAngle, beltCellWidth, orientation);
    const transform = orientation === 'vertical' ? `translateY(${beltScrollDistance}px)` : `translateX(${beltScrollDistance}px)`;
    beltTrack.style.transform = transform;
  }
  
  _positionIntervalBeltFromDegreeRing(degreeRingAngle, beltCellWidth, orientation) {
    const intervalBeltTrack = this.elements.intervalBracketsTrackContainer.querySelector('.interval-brackets-track');
    if (!intervalBeltTrack || !beltCellWidth) return;
    let beltScrollDistance = this._convertRingAngleToBeltDistance(degreeRingAngle, beltCellWidth, orientation);
    if (orientation === 'horizontal') {
        beltScrollDistance += 0.5 * beltCellWidth;
    }
    const transform = orientation === 'vertical' ? `translateY(${beltScrollDistance}px)` : `translateX(${beltScrollDistance}px)`;
    intervalBeltTrack.style.transform = transform;
  }
  
  _positionBeltCursorFromRingAngle(chromaticRingAngle, beltCellWidth, orientation) {
    const beltCursor = this.elements.cursor;
    if (!beltCursor || !beltCellWidth) return;

    const ringAngleToBeltPixels = this._calculateRingAngleToBeltPixelsRatio(beltCellWidth);
    if (ringAngleToBeltPixels === 0) return; // Early exit for invalid calculations
    
    const ringAngleAsBeltPixels = chromaticRingAngle * ringAngleToBeltPixels;
    let cursorBeltPosition;

    if (orientation === 'vertical') {
        const beltWindowHeight = -CHROMATIC_DIVISIONS * beltCellWidth;
        cursorBeltPosition = ((ringAngleAsBeltPixels % beltWindowHeight) + beltWindowHeight) % beltWindowHeight;
    } else {
        cursorBeltPosition = ringAngleAsBeltPixels;
    }
    
    const transform = orientation === 'vertical' ? `translateY(${cursorBeltPosition}px)` : `translateX(${cursorBeltPosition}px)`;
    beltCursor.style.transform = transform;
  }
  
  _updatePlaybackFlashOnBelt() {
      const { rings, playback, belts } = this.state;
      const beltFlashOverlay = this.elements.flashOverlay;
      const beltCellWidth = belts.itemSize.chromaticBelt;
      const orientation = belts.orientation;

      if (!beltFlashOverlay || !beltCellWidth || !playback.isPlaying || playback.currentNoteIndex === null) {
          beltFlashOverlay.style.display = 'none';
          return;
      }
      
      const ringAngleToBeltPixels = this._calculateRingAngleToBeltPixelsRatio(beltCellWidth);
      if (ringAngleToBeltPixels === 0) {
          beltFlashOverlay.style.display = 'none';
          return; // Early exit for invalid calculations
      }
      
      let flashBeltPosition;

      if (orientation === 'vertical') {
          const visualChromaticRingAngle = -rings.chromatic;
          const noteOffsetRingAngle = (playback.currentNoteIndex - playback.rootNoteIndexForPlayback) * ANGLE_STEP;
          const totalVisualRingAngle = visualChromaticRingAngle - noteOffsetRingAngle;
          const ringAngleAsBeltPixels = totalVisualRingAngle * ringAngleToBeltPixels;
          const beltWindowHeight = -CHROMATIC_DIVISIONS * beltCellWidth;
          flashBeltPosition = ((ringAngleAsBeltPixels % beltWindowHeight) + beltWindowHeight) % beltWindowHeight;
      } else {
          const totalRingAngle = rings.chromatic + (playback.currentNoteIndex - playback.rootNoteIndexForPlayback) * ANGLE_STEP;
          flashBeltPosition = totalRingAngle * ringAngleToBeltPixels;
      }
      
      const transform = orientation === 'vertical' ? `translateY(${flashBeltPosition}px)` : `translateX(${flashBeltPosition}px)`;
      beltFlashOverlay.style.transform = transform;
      beltFlashOverlay.style.display = 'block';
  }
}