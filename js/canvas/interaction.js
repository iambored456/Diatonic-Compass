// (file path: js/canvas/interaction.js)

import { appState } from '../state/appState.js';
import { snapRing, snapChromaticAndSettleMode, snapDegreeToDiatonic } from '../core/animation.js';
import { setRingAngle, coRotateRings } from '../core/actions.js';

export function initCanvasInteraction(canvas, onInteractionEnd){
  const getPointerInfo = e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - appState.dimensions.cx;
    const y = e.clientY - rect.top  - appState.dimensions.cy;
    const r = Math.hypot(x, y);

    const size = appState.dimensions.size;
    const outer = size * 0.5, middle = size * 0.35, inner = size * 0.2;
    
    let ring = null;
    if (r > inner && r < middle) ring = 'degree';
    else if (r > middle && r < outer) ring = 'pitchClass';
    else if (r <= inner) ring = 'chromatic';
    
    return { x, y, ring };
  };

  canvas.addEventListener('pointerdown', e => {
    const { x, y, ring } = getPointerInfo(e);
    if (!ring) return;

    appState.drag.active = ring;
    appState.drag.startX = x; 
    appState.drag.startY = y;
    appState.drag.startPitchClass = appState.rings.pitchClass;
    appState.drag.startDegree     = appState.rings.degree;
    appState.drag.startChrom      = appState.rings.chromatic;
    
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', e => {
    if (appState.drag.active) {
      const { x, y } = getPointerInfo(e);
      const s = appState.drag;
      const startAngle = Math.atan2(s.startY, s.startX);
      const curAngle   = Math.atan2(y, x);
      const deltaAngle = curAngle - startAngle;

      if (s.active === 'pitchClass') {
        setRingAngle('pitchClass', s.startPitchClass + deltaAngle);
      } 
      else if (s.active === 'degree') {
        setRingAngle('degree', s.startDegree + deltaAngle);
      } 
      else if (s.active === 'chromatic') {
        coRotateRings(s, deltaAngle);
      }
    } else {
      const { ring } = getPointerInfo(e);
      canvas.style.cursor = ring ? 'grab' : 'default';
    }
  });

  const endDrag = () => {
    if (!appState.drag.active) return;
    
    const ring = appState.drag.active;
    appState.drag.active = null;
    canvas.style.cursor = 'grab';

    if (ring === 'chromatic') { 
      snapChromaticAndSettleMode(onInteractionEnd);
    }
    else if (ring === 'pitchClass') { 
      snapRing('pitchClass', onInteractionEnd);
    }
    // MODIFICATION: Call the new function to snap the degree ring to valid positions.
    else if (ring === 'degree'){ 
      snapDegreeToDiatonic(onInteractionEnd);
    }
  };

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => {
    if (!appState.drag.active) {
      canvas.style.cursor = 'default';
    }
  });
}
