// (file path: js/utils/canvas.js)

/**
 * Checks if the canvas element has resized and updates the state.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {object} dimensions - The dimensions object from the app state.
 * @returns {boolean} - True if the canvas was resized.
 */
export function checkCanvasSize(canvas, dimensions) {
    const newSize = canvas.offsetWidth;

    if (newSize === dimensions.size) {
        return false;
    }

    console.log(`[Canvas] Resizing from ${dimensions.size}px to ${newSize}px`);
    dimensions.size = newSize;
    dimensions.cx = newSize / 2;
    dimensions.cy = newSize / 2;
    
    // Adjust canvas buffer size for device pixel ratio
    canvas.width = newSize * dimensions.dpr;
    canvas.height = newSize * dimensions.dpr;

    return true;
}