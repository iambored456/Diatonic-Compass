// (file path: js/core/animation.js)

import { ANIM_MS, ANGLE_STEP, DIATONIC_DEGREE_INDICES } from './constants.js';
import { normAngle, angleDiff, easeInOutQuad, indexAtTop } from './math.js';
import { appState } from '../state/appState.js';

export function startSnap(targets, onComplete = null){
  const t0 = performance.now();
  const from = {
    fromPitchClass: appState.rings.pitchClass,
    fromDegree:     appState.rings.degree,
    fromChrom:      appState.rings.chromatic,
    fromHighlight:  appState.rings.highlightPosition
  };
  const to = {
    toPitchClass: targets.pitchClass ?? from.fromPitchClass,
    toDegree:     targets.degree     ?? from.fromDegree,
    toChrom:      targets.chromatic  ?? from.fromChrom,
    toHighlight:  targets.highlightPosition ?? from.fromHighlight
  };
  appState.animation = { t0, from, to, onComplete };
}

export function stepAnim(time){
  const anim = appState.animation;
  if(!anim){ return false; }
  const dt = (time - anim.t0) / ANIM_MS;
  const p = dt >= 1 ? 1 : easeInOutQuad(dt);

  const apply = (from, to) => normAngle(from + angleDiff(from, to) * p);
  appState.rings.pitchClass       = apply(anim.from.fromPitchClass, anim.to.toPitchClass);
  appState.rings.degree           = apply(anim.from.fromDegree,     anim.to.toDegree);
  appState.rings.chromatic        = apply(anim.from.fromChrom,      anim.to.toChrom);
  appState.rings.highlightPosition = apply(anim.from.fromHighlight,  anim.to.toHighlight);

  if (p === 1) { 
    if (anim.onComplete) anim.onComplete();
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

export function snapDegreeToDiatonic(onComplete) {
  const { degree, chromatic } = appState.rings;
  const effectiveDegreeRotation = normAngle(degree - chromatic);

  // Use a floating-point index for a more accurate distance calculation,
  // rather than rounding to an integer upfront.
  const currentRelativeIndexFloat = normAngle(-effectiveDegreeRotation) / ANGLE_STEP;

  // Find the closest diatonic index to the current float position.
  let closestDiatonicIndex = DIATONIC_DEGREE_INDICES[0];
  let minDiff = Infinity;

  DIATONIC_DEGREE_INDICES.forEach(validIndex => {
    // Calculate the shortest distance on a circular 12-unit number line.
    const diff = Math.abs(currentRelativeIndexFloat - validIndex);
    const circularDiff = Math.min(diff, 12 - diff);

    if (circularDiff < minDiff) {
      minDiff = circularDiff;
      closestDiatonicIndex = validIndex;
    }
  });

  // Calculate the final target angle based on the truly closest diatonic index.
  const targetEffectiveRotation = normAngle(-closestDiatonicIndex * ANGLE_STEP);
  const targetDegree = normAngle(targetEffectiveRotation + chromatic);
  
  // Both the degree ring and its highlight MUST snap to the same final diatonic
  // position to maintain a consistent and logical state. The animation will
  // proceed smoothly from the dropped position to this target.
  startSnap({ 
    degree: targetDegree, 
    highlightPosition: targetDegree 
  }, onComplete);
}


export function snapChromaticAndSettleMode(onComplete) {
  const chromIdx = Math.round(-appState.rings.chromatic / ANGLE_STEP);
  const targetChrom = normAngle(-chromIdx * ANGLE_STEP);

  const chromDelta = angleDiff(appState.rings.chromatic, targetChrom);
  const targetPitchClass = normAngle(appState.rings.pitchClass + chromDelta);

  const effectiveDegreeRotation = normAngle(appState.rings.degree - appState.rings.chromatic);
  const targetDegree = normAngle(effectiveDegreeRotation + targetChrom);

  // --- FIX ---
  // For consistency, the highlight layer should ALWAYS snap to the final
  // position of the degree ring.
  startSnap({
    pitchClass: targetPitchClass,
    degree: targetDegree,
    chromatic: targetChrom,
    highlightPosition: targetDegree,
  }, onComplete);
}
