import { TAU, ANGLE_STEP } from './constants.js';

export const INV_ANGLE_STEP = 1/ANGLE_STEP;

export const normAngle = a => ((a % TAU) + TAU) % TAU;

export function angleDiff(from, to) {
  const d = normAngle(to) - normAngle(from);
  if (d > Math.PI) return d - TAU;
  if (d < -Math.PI) return d + TAU;
  return d;
}

export const easeInOutQuad = t => (t<.5 ? 2*t*t : -1+(4-2*t)*t);

export const indexAtTop = rot => ((Math.round(-normAngle(rot)*INV_ANGLE_STEP)%12)+12)%12;
