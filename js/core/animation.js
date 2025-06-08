// Single‑timeline finite‑state animation driver
import { ANIM_MS, ANGLE_STEP, DIATONIC_DEGREE_INDICES } from './constants.js';
import { normAngle, angleDiff, easeInOutQuad } from './math.js';
import { appState } from '../state/appState.js';

export function startSnap(targets){
  // targets = { grey:, white:, chromatic: } in radians – any subset may be supplied
  const t0 = performance.now();
  const fromGrey  = appState.rings.grey;
  const fromWhite = appState.rings.white;
  const fromChrom = appState.rings.chromatic;

  const toGrey  = targets.grey  ?? fromGrey;
  const toWhite = targets.white ?? fromWhite;
  const toChrom = targets.chromatic ?? fromChrom;

  appState.animation = { t0, from:{fromGrey,fromWhite,fromChrom}, to:{toGrey,toWhite,toChrom} };
}

export function stepAnim(time){
  const anim = appState.animation;
  if(!anim){ return false; }
  const dt = (time - anim.t0) / ANIM_MS;
  const p = dt >= 1 ? 1 : easeInOutQuad(dt);

  const apply = (from,to)=> normAngle(from + angleDiff(from,to)*p);
  appState.rings.grey      = apply(anim.from.fromGrey,  anim.to.toGrey);
  appState.rings.white     = apply(anim.from.fromWhite, anim.to.toWhite);
  appState.rings.chromatic = apply(anim.from.fromChrom, anim.to.toChrom);

  if (p === 1) { appState.animation = null; }
  return true;
}

// helper: snap ring to nearest 30° step
export function snapRing(ringKey){
  if(ringKey==='chromatic'){
    // compute chromatic target
    const startChrom = appState.rings.chromatic;
    const idx = Math.round(-startChrom/ANGLE_STEP);
    const targetChrom = normAngle(-idx*ANGLE_STEP);
    const delta = angleDiff(startChrom, targetChrom);

    const targetGrey  = normAngle(appState.rings.grey  + delta);
    const targetWhite = normAngle(appState.rings.white + delta);

    startSnap({ chromatic: targetChrom, grey: targetGrey, white: targetWhite });
    // no additional settleMode; relative positions preserved
    return;
  }
  // default single‑ring snap
  const start = appState.rings[ringKey];
  const idx   = Math.round(-start/ANGLE_STEP);
  const target = normAngle(-idx*ANGLE_STEP);
  startSnap({ [ringKey]: target });
}

// helper: after chromatic snap finish, realign white to nearest diatonic interval
export function settleMode(){
  const rel = normAngle(appState.rings.white - appState.rings.chromatic);
  let closest = 0, min = Infinity;
  DIATONIC_DEGREE_INDICES.forEach((val,i)=>{
    const diff = Math.abs(angleDiff(rel, -val*ANGLE_STEP));
    if(diff<min){ min=diff; closest=i; }
  });
  appState.rings.whiteDiatonic = closest;
  const targetRel = normAngle(-DIATONIC_DEGREE_INDICES[closest]*ANGLE_STEP);
  const targetWhite = normAngle(targetRel + appState.rings.chromatic);
  startSnap({ white: targetWhite });
}
