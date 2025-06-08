// (file path: js/canvas/interaction.js)
import { appState } from '../state/appState.js';
import { normAngle } from '../core/math.js';
import { snapRing, settleMode } from '../core/animation.js';

export function initCanvasInteraction(canvas){
  // Helper to find the ring and coordinates from a pointer event
  const getPointerInfo = e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - appState.dimensions.cx;
    const y = e.clientY - rect.top  - appState.dimensions.cy;
    const r = Math.hypot(x, y);

    const size = appState.dimensions.size;
    const outer = size * 0.5, middle = size * 0.35, inner = size * 0.2;
    
    let ring = null;
    if (r > inner && r < middle) ring = 'white';
    else if (r > middle && r < outer) ring = 'grey';
    else if (r <= inner) ring = 'chromatic';
    
    return { x, y, ring };
  };

  canvas.addEventListener('pointerdown', e => {
    const { x, y, ring } = getPointerInfo(e);
    if (!ring) return;

    appState.drag.active = ring;
    appState.drag.startX = x; 
    appState.drag.startY = y;
    appState.drag.startGrey = appState.rings.grey;
    appState.drag.startWhite = appState.rings.white;
    appState.drag.startChrom = appState.rings.chromatic;
    
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });

  // A single, robust listener for all pointer movement over the canvas
  canvas.addEventListener('pointermove', e => {
    if (appState.drag.active) {
      // --- Dragging logic ---
      const { x, y } = getPointerInfo(e);
      const s = appState.drag;
      const startAngle = Math.atan2(s.startY, s.startX);
      const curAngle   = Math.atan2(y, x);
      const d = curAngle - startAngle;

      if (s.active === 'grey')   appState.rings.grey = normAngle(s.startGrey + d);
      if (s.active === 'white')  appState.rings.white = normAngle(s.startWhite + d);
      if (s.active === 'chromatic'){
        appState.rings.chromatic = normAngle(s.startChrom + d);
        appState.rings.grey      = normAngle(s.startGrey  + d);
        appState.rings.white     = normAngle(s.startWhite + d);
      }
    } else {
      // --- Hovering logic ---
      const { ring } = getPointerInfo(e);
      canvas.style.cursor = ring ? 'grab' : 'default';
    }
  });

  const endDrag = () => {
    if (!appState.drag.active) return;
    
    const ring = appState.drag.active;
    appState.drag.active = null;
    canvas.style.cursor = 'grab'; // Revert to grab, move listener will fix if needed

    if (ring === 'chromatic') { snapRing('chromatic'); }
    else if (ring === 'grey') { snapRing('grey'); }
    else if (ring === 'white'){ snapRing('white'); settleMode(); }
  };

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // Set cursor to default when the pointer leaves the canvas area
  canvas.addEventListener('pointerleave', () => {
    if (!appState.drag.active) {
      canvas.style.cursor = 'default';
    }
  });
}
