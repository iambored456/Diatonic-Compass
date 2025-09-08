// (file path: js/core/actions.js)

import { appState } from '../state/appState.js';
import { normAngle } from './math.js';

/**
 * @param {('pitchClass'|'degree'|'chromatic'|'highlightPosition')} ringKey
 * @param {number} angle
 */
export function setRingAngle(ringKey, angle) {
  // ... (this function is unchanged)
  if (appState.rings.hasOwnProperty(ringKey)) {
    const normalizedAngle = normAngle(angle);
    appState.rings[ringKey] = normalizedAngle;
  }
}

/**
 * Co-rotates all rings. In vertical mode, the visual movement of the chromatic
 * ring is separated from the functional movement of the other rings.
 * @param {object} startAngles - An object with the starting angles of all rings.
 * @param {number} functionalDelta - The delta for the wheel and other belts (can be inverted).
 * @param {number} visualDelta - The delta for the chromatic belt's visual movement (always direct).
 */
export function rotateCoupledRings(startAngles, functionalDelta, visualDelta) {
  // Use the visualDelta for the chromatic ring to match the user's gesture.
  // If visualDelta is not provided, default to functionalDelta for horizontal mode.
  const chromDelta = visualDelta ?? functionalDelta;
  appState.rings.chromatic = normAngle(startAngles.startChrom + chromDelta);

  // Use the functionalDelta for all other rings to get the correct wheel rotation.
  appState.rings.pitchClass = normAngle(startAngles.startPitchClass + functionalDelta);
  appState.rings.degree = normAngle(startAngles.startDegree + functionalDelta);
  appState.rings.highlightPosition = normAngle(startAngles.startHighlight + functionalDelta);
}