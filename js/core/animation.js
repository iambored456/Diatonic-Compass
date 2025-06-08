// (file path: js/core/animation.js)

import { ANIM_MS, ANGLE_STEP, DIATONIC_DEGREE_INDICES } from './constants.js';
import { normAngle, angleDiff, easeInOutQuad, indexAtTop } from './math.js';
import { appState } from '../state/appState.js';

export function startSnap(targets, onComplete = null){
  const t0 = performance.now();
  const fromPitchClass = appState.rings.pitchClass;
  const fromDegree     = appState.rings.degree;
  const fromChrom      = appState.rings.chromatic;

  const toPitchClass = targets.pitchClass ?? fromPitchClass;
  const toDegree     = targets.degree     ?? fromDegree;
  const toChrom      = targets.chromatic  ?? fromChrom;

  appState.animation = { t0, from:{fromPitchClass, fromDegree, fromChrom}, to:{toPitchClass, toDegree, toChrom}, onComplete };
}

export function stepAnim(time){
  const anim = appState.animation;
  if(!anim){ return false; }
  const dt = (time - anim.t0) / ANIM_MS;
  const p = dt >= 1 ? 1 : easeInOutQuad(dt);

  const apply = (from, to) => normAngle(from + angleDiff(from, to) * p);
  appState.rings.pitchClass = apply(anim.from.fromPitchClass, anim.to.toPitchClass);
  appState.rings.degree     = apply(anim.from.fromDegree,     anim.to.toDegree);
  appState.rings.chromatic  = apply(anim.from.fromChrom,      anim.to.toChrom);

  if (p === 1) { 
    if (anim.onComplete) {
      anim.onComplete();
    }
    appState.animation = null; 
  }
  return true;
}

export function snapRing(ringKey, onComplete){
  const start = appState.rings[ringKey];
  const idx   = Math.round(-start/ANGLE_STEP);
  const target = normAngle(-idx*ANGLE_STEP);
  startSnap({ [ringKey]: target }, onComplete);
}

/**
 * Snaps the degree ring to the nearest valid diatonic position, relative to the current tonic.
 * This prevents the ring from landing on accidental intervals and respects the current key.
 */
export function snapDegreeToDiatonic(onComplete) {
  // --- MODIFICATION START ---
  // The logic is now relative to the chromatic ring (the tonic).
  const { degree, chromatic } = appState.rings;

  // 1. Calculate the degree ring's current position RELATIVE to the tonic.
  const effectiveDegreeRotation = normAngle(degree - chromatic);
  const currentRelativeIndex = indexAtTop(effectiveDegreeRotation);

  // 2. Find the closest valid diatonic index (0, 2, 4, etc.) to this relative position.
  let closestDiatonicIndex = DIATONIC_DEGREE_INDICES[0];
  let minDiff = 12;
  DIATONIC_DEGREE_INDICES.forEach(validIndex => {
    const diff = Math.min(
      Math.abs(currentRelativeIndex - validIndex),
      12 - Math.abs(currentRelativeIndex - validIndex)
    );
    if (diff < minDiff) {
      minDiff = diff;
      closestDiatonicIndex = validIndex;
    }
  });

  // 3. Calculate the TARGET relative rotation.
  const targetEffectiveRotation = normAngle(-closestDiatonicIndex * ANGLE_STEP);

  // 4. Calculate the final ABSOLUTE target rotation by adding the relative target back to the tonic's position.
  const targetDegree = normAngle(targetEffectiveRotation + chromatic);
  
  startSnap({ degree: targetDegree }, onComplete);
  // --- MODIFICATION END ---
}


export function snapChromaticAndSettleMode(onComplete) {
  // 1. Determine the final snapped position of the chromatic ring.
  const chromIdx = Math.round(-appState.rings.chromatic / ANGLE_STEP);
  const targetChrom = normAngle(-chromIdx * ANGLE_STEP);

  // 2. The pitchClass ring must snap by the same amount to preserve the key.
  const chromDelta = angleDiff(appState.rings.chromatic, targetChrom);
  const targetPitchClass = normAngle(appState.rings.pitchClass + chromDelta);

  // 3. Preserve the mode by maintaining the RELATIVE angle of the degree ring.
  const effectiveDegreeRotation = normAngle(appState.rings.degree - appState.rings.chromatic);
  const targetDegree = normAngle(effectiveDegreeRotation + targetChrom);

  // 4. Animate all three rings to their final, correct positions.
  startSnap({
    pitchClass: targetPitchClass,
    degree: targetDegree,
    chromatic: targetChrom,
  }, onComplete);
}
