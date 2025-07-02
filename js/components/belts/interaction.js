// (file path: js/components/belts/interaction.js)

import { appState } from '../../state/appState.js';
import { ANGLE_STEP } from '../../core/constants.js';
import { snapRing, snapChromaticAndSettleMode, snapDegreeToDiatonic } from '../../core/animation.js';
import { setRingAngle, coRotateRings } from '../../core/actions.js';

// (file path: js/components/belts/interaction.js)

function addGenericDragHandler(element, onMove, onFinish) {
  element.style.cursor = 'grab';
  let activePointer = null;
  let startX = 0;
  let startY = 0;
  let startAngles = {};

  const startDrag = (e) => {
    activePointer = e.pointerId;
    element.setPointerCapture(activePointer);
    startX = e.clientX;
    startY = e.clientY;
    startAngles = {
      pitchClass: appState.rings.pitchClass,
      degree:     appState.rings.degree,
      chromatic:  appState.rings.chromatic,
      highlight:  appState.rings.highlightPosition,
    };
    element.style.cursor = 'grabbing';
    appState.drag.active = element.id || 'unknown';
  };

  const finishDrag = () => {
    if (activePointer === null) return;
    element.releasePointerCapture(activePointer);
    activePointer = null;
    element.style.cursor = 'grab';
    appState.drag.active = null; 
    onFinish();
  };

  element.addEventListener('pointerdown', startDrag);
  element.addEventListener('pointermove', e => {
    if (activePointer !== e.pointerId) return;
    
    const { orientation } = appState.belts;
    const deltaPos = orientation === 'vertical' ? e.clientY - startY : e.clientX - startX;
    
    // ADDED: User Gesture Log
    console.log(`[Gesture] Orientation: ${orientation}, deltaPos: ${deltaPos.toFixed(2)}`);

    const container = element.closest('.belt, .interval-brackets-container');
    const itemSize = appState.belts.itemSize[container.id];
    
    if (!itemSize || itemSize === 0) {
      return;
    }

    const deltaAngle = (deltaPos / itemSize) * ANGLE_STEP;

    onMove(deltaAngle, startAngles);
  });
  element.addEventListener('pointerup', finishDrag);
  element.addEventListener('pointercancel', finishDrag);
}

export function initBeltInteraction(onInteractionEnd) {
    console.log('[Interaction] Initializing belt handlers.');

  // --- Pitch Belt Interaction ---
  const pitchBelt = document.getElementById('pitchBelt');
  if (pitchBelt) {
    addGenericDragHandler(pitchBelt, 
      (delta, starts) => {
        if (appState.belts.orientation === 'vertical') {
          console.log('[Data Flow] Vertical Pitch Belt: Inverting delta for wheel rotation.');
          setRingAngle('pitchClass', starts.pitchClass - delta);
        } else {
          console.log('[Data Flow] Horizontal Pitch Belt: Directly updating wheel rotation.');
          setRingAngle('pitchClass', starts.pitchClass + delta);
        }
      },
      () => snapRing('pitchClass', onInteractionEnd)
    );
  }

  // --- Degree Belt Interaction (shared callback) ---
  const degreeOnMove = (delta, starts) => {
    if (appState.belts.orientation === 'vertical') {
      console.log('[Data Flow] Vertical Degree Belt: Inverting delta for wheel rotation.');
      setRingAngle('degree', starts.degree - delta);
      setRingAngle('highlightPosition', starts.highlight - delta);
    } else {
      console.log('[Data Flow] Horizontal Degree Belt: Directly updating wheel rotation.');
      setRingAngle('degree', starts.degree + delta);
      setRingAngle('highlightPosition', starts.highlight + delta);
    }
  };
  const degreeOnFinish = () => snapDegreeToDiatonic(onInteractionEnd);

  const degreeBelt = document.getElementById('degreeBelt');
  if (degreeBelt) {
    addGenericDragHandler(degreeBelt, degreeOnMove, degreeOnFinish);
  }
  const intervalBrackets = document.getElementById('intervalBracketsContainer');
  if (intervalBrackets) {
    addGenericDragHandler(intervalBrackets, degreeOnMove, degreeOnFinish);
  }
  
  // --- Chromatic Belt Interaction (with new conditional logic) ---
  const chromaticBelt = document.getElementById('chromatic-numbers-track');
  if (chromaticBelt) {
    addGenericDragHandler(chromaticBelt,
      (delta, starts) => {
        const startAngles = {
            startPitchClass: starts.pitchClass,
            startDegree: starts.degree,
            startChrom: starts.chromatic,
            startHighlight: starts.highlight
        };

        if (appState.belts.orientation === 'vertical') {
          console.log('[Data Flow] Vertical Chromatic Belt: Inverting co-rotation delta.');
          coRotateRings(startAngles, -delta);
        } else {
          console.log('[Data Flow] Horizontal Chromatic Belt: Directly co-rotating.');
          coRotateRings(startAngles, delta);
        }
      },
      () => snapChromaticAndSettleMode(onInteractionEnd)
    );
  }
}