// (file path: js/core/renderLoop.js)

// This function's only job is to set up a requestAnimationFrame loop
// and pass the timestamp to the callback function (our main redraw).
export function makeRenderLoop(redraw){
  function frame(time){
    redraw(time); // Pass the timestamp to the app's redraw method
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame); // Start the loop
}