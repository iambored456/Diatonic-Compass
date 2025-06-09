// (file path: js/belts/interaction.js)

import { appState } from '../state/appState.js';
import { ANGLE_STEP } from '../core/constants.js';
import { snapRing, snapChromaticAndSettleMode, snapDegreeToDiatonic } from '../core/animation.js';
import { setRingAngle, coRotateRings } from '../core/actions.js';

function addGenericDragHandler(element, onMove, onFinish) {
  element.style.cursor = 'grab';
  let activePointer = null;
  let startX = 0;
  let startAngles = {};

  const startDrag = (e) => {
    activePointer = e.pointerId;
    element.setPointerCapture(activePointer);
    startX = e.clientX;
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
    const dx = e.clientX - startX;
    const container = element.closest('.belt, .interval-brackets-container');
    const cellW = appState.belts.itemW[container.id] || container.offsetWidth / 12;
    const deltaAngle = (dx / cellW) * ANGLE_STEP;
    onMove(deltaAngle, startAngles);
  });
  element.addEventListener('pointerup', finishDrag);
  element.addEventListener('pointercancel', finishDrag);
}

export function initBeltInteraction(onInteractionEnd) {
  const pitchBelt = document.getElementById('pitchBelt');
  if (pitchBelt) {
    addGenericDragHandler(pitchBelt, 
      (delta, starts) => setRingAngle('pitchClass', starts.pitchClass + delta),
      () => snapRing('pitchClass', onInteractionEnd)
    );
  }

  const degreeOnMove = (delta, starts) => {
    setRingAngle('degree', starts.degree + delta);
    setRingAngle('highlightPosition', starts.highlight + delta);
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
  
  const chromaticBelt = document.getElementById('chromatic-numbers-track');
  if (chromaticBelt) {
    addGenericDragHandler(chromaticBelt,
      (delta, starts) => {
        coRotateRings({
            startPitchClass: starts.pitchClass,
            startDegree: starts.degree,
            startChrom: starts.chromatic,
            startHighlight: starts.highlight
        }, delta)
      },
      () => snapChromaticAndSettleMode(onInteractionEnd)
    );
  }
}
