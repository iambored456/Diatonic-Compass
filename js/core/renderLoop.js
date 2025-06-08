import { stepAnim } from './animation.js';

export function makeRenderLoop(redraw){
  function frame(time){
    const wasAnimating = stepAnim(time); // advances appState if active
    redraw();                            // always draw – cheap when no changes
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
