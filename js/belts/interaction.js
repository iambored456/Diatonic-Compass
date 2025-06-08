// js/belts/interaction.js

// Pointer‑drag scrolling for HTML belts (pitch/degree/chromatic)
import { appState } from '../state/appState.js';
import { ANGLE_STEP } from '../core/constants.js';
import { normAngle } from '../core/math.js';
import { snapRing, settleMode } from '../core/animation.js';

export function initBeltInteraction(){
  // MODIFIED: Add 'intervalBracketsContainer' to the list of interactive belts
  ['pitchBelt', 'degreeBelt', 'chromaticBelt', 'intervalBracketsContainer'].forEach(beltId => {
    const el = document.getElementById(beltId);
    if (!el) return;

    el.style.cursor = 'grab';
    let activePointer = null;
    let startX = 0;
    let startGrey = 0, startWhite = 0, startChrom = 0;

    // ---- pointer down ----
    el.addEventListener('pointerdown', e => {
      activePointer = e.pointerId;
      el.setPointerCapture(activePointer);
      startX = e.clientX;
      startGrey  = appState.rings.grey;
      startWhite = appState.rings.white;
      startChrom = appState.rings.chromatic;
      el.style.cursor = 'grabbing';
    });

    // ---- pointer move ----
    el.addEventListener('pointermove', e => {
      if (activePointer !== e.pointerId) return;
      const dx = e.clientX - startX;
      
      // MODIFIED: Ensure interval brackets use the degree belt's width for calculations
      let cellW;
      if (beltId === 'intervalBracketsContainer') {
        cellW = appState.belts.itemW['degreeBelt'] || document.getElementById('degreeBelt').offsetWidth / 12;
      } else {
        cellW = appState.belts.itemW[beltId] || el.offsetWidth / 12;
      }
      
      const dAngle = (dx / cellW) * ANGLE_STEP;

      if (beltId === 'pitchBelt') {
        appState.rings.grey = normAngle(startGrey + dAngle);
      } 
      // MODIFIED: Hitch the interval brackets to the degree belt's state
      else if (beltId === 'degreeBelt' || beltId === 'intervalBracketsContainer') {
        appState.rings.white = normAngle(startWhite + dAngle);
      } 
      else if (beltId === 'chromaticBelt') {
        appState.rings.chromatic = normAngle(startChrom + dAngle);
        appState.rings.grey      = normAngle(startGrey  + dAngle);
        appState.rings.white     = normAngle(startWhite + dAngle);
      }
    });

    // ---- finish helper ----
    const finish = () => {
      if (activePointer === null) return;
      el.releasePointerCapture(activePointer);
      activePointer = null;
      el.style.cursor = 'grab';

      if (beltId === 'chromaticBelt') {
        snapRing('chromatic');
      } else if (beltId === 'pitchBelt') {
        snapRing('grey');
      } 
      // MODIFIED: Ensure snapping/settling also happens when dragging the interval brackets
      else if (beltId === 'degreeBelt' || beltId === 'intervalBracketsContainer') {
        snapRing('white');
        settleMode();
      }
    };

    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
  });
}
