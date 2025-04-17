// js/utils/helpers.js
// General utility functions used across modules.

import { PI_2, ANGLE_STEP } from '../config/constants.js';

/**
 * Normalizes an angle to be within the range [0, 2*PI).
 * @param {number} angle - The angle in radians.
 * @returns {number} The normalized angle.
 */
export function normalizeAngle(angle) {
    return ((angle % PI_2) + PI_2) % PI_2;
}

/**
 * Calculates the shortest difference between two angles (radians).
 * Handles wrapping around the circle.
 * @param {number} fromAngle - The starting angle (radians).
 * @param {number} toAngle - The ending angle (radians).
 * @returns {number} The minimal angle difference (can be negative).
 */
export function minimalAngleDifference(fromAngle, toAngle) {
    const normalizedFrom = normalizeAngle(fromAngle);
    const normalizedTo = normalizeAngle(toAngle);
    let difference = normalizedTo - normalizedFrom;
    if (difference > Math.PI) {
        difference -= PI_2;
    } else if (difference < -Math.PI) {
        difference += PI_2;
    }
    return difference;
}

/**
 * Gets the chromatic index (0-11) corresponding to the 12 o'clock position
 * given a specific rotation angle.
 * @param {number} rotation - The rotation angle (radians), where 0 means C is at the top.
 * @returns {number} The index (0-11) at the top.
 */
export function getIndexAtTop(rotation) {
    const normalizedRot = normalizeAngle(rotation);
    const epsilon = 1e-9; // Small value for floating point precision near zero
    // Rotation is clockwise, so we use negative rotation to find the index at the top (-PI/2 offset cancels)
    let index = Math.round((-normalizedRot + epsilon) / ANGLE_STEP);
    return ((index % 12) + 12) % 12; // Ensure positive index 0-11
}

/**
 * Basic quadratic easing function.
 * @param {number} t - Progress ratio (0 to 1).
 * @returns {number} Eased value (0 to 1).
 */
export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
