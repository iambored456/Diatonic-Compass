// (file path: js/belts/interaction.js)

import { appState } from '../state/appState.js';
import { ANGLE_STEP } from '../core/constants.js';
import { snapRing, snapChromaticAndSettleMode, snapDegreeToDiatonic } from '../core/animation.js';
import { setRingAngle, coRotateRings } from '../core/actions.js';

function addDragHandler(elementId, ringKey, onFinish) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.cursor = 'grab';
  let activePointer = null;
  let startX = 0;
  let startAngle = 0;

  el.addEventListener('pointerdown', e => {
    activePointer = e.pointerId;
    el.setPointerCapture(activePointer);
    startX = e.clientX;
    startAngle = appState.rings[ringKey];
    el.style.cursor = 'grabbing';
  });

  el.addEventListener('pointermove', e => {
    if (activePointer !== e.pointerId) return;
    const dx = e.clientX - startX;
    
    const container = el.closest('.belt, .interval-brackets-container');
    const cellW = appState.belts.itemW[container.id] || container.offsetWidth / 12;

    const deltaAngle = (dx / cellW) * ANGLE_STEP;
    setRingAngle(ringKey, startAngle + deltaAngle);
  });

  const finish = () => {
    if (activePointer === null) return;
    el.releasePointerCapture(activePointer);
    activePointer = null;
    el.style.cursor = 'grab';
    if (onFinish) onFinish();
  };

  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', finish);
}

export function initBeltInteraction(onInteractionEnd) {
  addDragHandler('pitchBelt', 'pitchClass', () => snapRing('pitchClass', onInteractionEnd));

  // MODIFICATION: Call the new function for the degree belt and brackets.
  addDragHandler('degreeBelt', 'degree', () => snapDegreeToDiatonic(onInteractionEnd));
  addDragHandler('intervalBracketsContainer', 'degree', () => snapDegreeToDiatonic(onInteractionEnd));
  
  const chromaticNumbersTrack = document.getElementById('chromatic-numbers-track');
  if (chromaticNumbersTrack) {
      const el = chromaticNumbersTrack;
      let activePointer = null;
      let startX = 0;
      let startAngles = {};

      el.addEventListener('pointerdown', e => {
          activePointer = e.pointerId;
          el.setPointerCapture(activePointer);
          startX = e.clientX;
          startAngles = {
            startPitchClass: appState.rings.pitchClass,
            startDegree:     appState.rings.degree,
            startChrom:      appState.rings.chromatic
          };
          el.style.cursor = 'grabbing';
      });

      el.addEventListener('pointermove', e => {
          if (activePointer !== e.pointerId) return;
          const dx = e.clientX - startX;
          const cellW = appState.belts.itemW['chromaticBelt'];
          const deltaAngle = (dx / cellW) * ANGLE_STEP;

          coRotateRings(startAngles, deltaAngle);
      });

      const finish = () => {
          if (activePointer === null) return;
          el.releasePointerCapture(activePointer);
          activePointer = null;
          el.style.cursor = 'grab';
          snapChromaticAndSettleMode(onInteractionEnd);
      };

      el.addEventListener('pointerup', finish);
      el.addEventListener('pointercancel', finish);
  }
}
