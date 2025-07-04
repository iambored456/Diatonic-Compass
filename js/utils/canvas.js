// (file path: js/utils/canvas.js)
/**
 * Checks if the canvas element has resized and updates the state.
 * This version is more robust, using the SMALLER of the width or height
 * to ensure the canvas drawing buffer is always a perfect square.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {object} dimensions - The dimensions object from the app state.
 * @returns {boolean} - True if the canvas was resized.
 */
export function checkCanvasSize(canvas, dimensions) {
    const containerWidth = canvas.parentElement.offsetWidth;
    const containerHeight = canvas.parentElement.offsetHeight;
    
    const newSize = Math.min(containerWidth, containerHeight);

    // and is greater than 0 (to avoid errors on initialization).
    if (newSize === dimensions.size || newSize === 0) {
        return false;
    }

    dimensions.size = newSize;
    dimensions.cx = newSize / 2;
    dimensions.cy = newSize / 2;
    
    // Adjust canvas buffer size for device pixel ratio, ensuring it's a square.
    canvas.width = newSize * dimensions.dpr;
    canvas.height = newSize * dimensions.dpr;

    return true;
}