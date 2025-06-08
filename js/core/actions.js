// (file path: js/core/actions.js)

import { appState } from '../state/appState.js';
import { normAngle } from './math.js';

/**
 * @param {('pitchClass'|'degree'|'chromatic')} ringKey
 * @param {number} angle
 */
export function setRingAngle(ringKey, angle) {
  if (appState.rings.hasOwnProperty(ringKey)) {
    appState.rings[ringKey] = normAngle(angle);
  }
}

/**
 * Co-rotates all three rings by a given delta. This is used during a drag
 * to provide direct 1:1 visual feedback for all moving parts.
 * @param {object} startAngles - An object like { startPitchClass, startDegree, startChrom }
 * @param {number} deltaAngle - The change in angle in radians.
 */
export function coRotateRings(startAngles, deltaAngle) {
  appState.rings.pitchClass = normAngle(startAngles.startPitchClass + deltaAngle);
  appState.rings.degree     = normAngle(startAngles.startDegree + deltaAngle);
  appState.rings.chromatic  = normAngle(startAngles.startChrom + deltaAngle);
}
