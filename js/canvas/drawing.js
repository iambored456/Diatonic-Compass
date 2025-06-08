// (file path: js/canvas/drawing.js)

import { SEMITONES, ANGLE_STEP, FONT_FACTOR, FIXED_INTERVAL_COLOUR, PIANO_KEY_COLOUR } from '../core/constants.js';
import { normAngle } from '../core/math.js';
import { getContrastColor } from '../core/color.js';

export function drawWheel(ctx, size, { pitchClass, degree, chromatic }, { chromaticLabels, diatonicLabels }){
  ctx.clearRect(0,0,size,size);
  const cx=size/2, cy=size/2;

  drawOuterRing(); drawMiddleRing(); drawInner(); drawLabels(chromaticLabels, diatonicLabels); drawMarker();

  function segPath(r0,r1,angle){
    const a0 = angle-ANGLE_STEP/2, a1 = angle+ANGLE_STEP/2;
    ctx.beginPath();
    ctx.arc(cx,cy,r1,a0,a1);
    ctx.arc(cx,cy,r0,a1,a0,true);
    ctx.closePath();
  }

  function drawOuterRing(){
    const r1=size*0.5, r0=size*0.35;
    const canonicalNotes = Object.keys(PIANO_KEY_COLOUR);
    canonicalNotes.forEach((note,i)=>{
      const ang=i*ANGLE_STEP+pitchClass-Math.PI/2;
      segPath(r0,r1,ang);
      ctx.fillStyle = PIANO_KEY_COLOUR[note] ? '#fff' : '#000';
      ctx.fill();
      ctx.lineWidth = size * 0.002;
      ctx.strokeStyle='#000'; ctx.stroke();
    });
  }

  function drawMiddleRing(){
    const r1=size*0.35, r0=size*0.2;
    for(let i=0;i<12;i++){
      const ang=i*ANGLE_STEP+degree-Math.PI/2;
      segPath(r0,r1,ang);
      ctx.fillStyle = FIXED_INTERVAL_COLOUR[i] || '#e0e0e0';
      ctx.fill();
      ctx.lineWidth = size * 0.002;
      ctx.strokeStyle='#000'; ctx.stroke();
    }
  }

  function drawInner(){ ctx.beginPath(); ctx.arc(cx,cy,size*0.2,0,Math.PI*2); ctx.fillStyle='#000'; ctx.fill(); }
  
  function label(angle,radius,text,fill){
    ctx.fillStyle=fill; ctx.font=`${size*FONT_FACTOR}px 'Atkinson Hyperlegible Next'`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(text, cx+Math.cos(angle)*radius, cy+Math.sin(angle)*radius);
  }
  
  function drawLabels(chromaticNotes, diatonicIntervals){
    const rOuter=size*0.5*0.85, rMid=size*0.35*0.8, rInner=size*0.2*0.8;
    const canonicalNotes = Object.keys(PIANO_KEY_COLOUR);

    chromaticNotes.forEach((n,i)=> {
      const originalNote = canonicalNotes[i];
      label(i*ANGLE_STEP+pitchClass-Math.PI/2, rOuter, n, PIANO_KEY_COLOUR[originalNote]?'#000':'#fff');
    });

    diatonicIntervals.forEach((inv,i)=> {
      const bgColor = FIXED_INTERVAL_COLOUR[i];
      const textColor = getContrastColor(bgColor); 
      label(i*ANGLE_STEP+degree-Math.PI/2, rMid, inv, textColor);
    });

    SEMITONES.forEach(i=> label(i*ANGLE_STEP+chromatic-Math.PI/2,rInner,i.toString(),'#fff'));
  }

  function drawMarker(){
    const rOuter=size*0.5, rInner=size*0.125;
    const base=-Math.PI/2+chromatic, a0=base-ANGLE_STEP/2, a1=base+ANGLE_STEP/2;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a0)*rInner, cy+Math.sin(a0)*rInner);
    ctx.arc(cx,cy,rOuter,a0,a1);
    ctx.lineTo(cx+Math.cos(a1)*rInner, cy+Math.sin(a1)*rInner);
    ctx.arc(cx,cy,rInner,a1,a0,true);
    ctx.closePath();
    ctx.lineWidth=size*0.006; ctx.strokeStyle='red'; ctx.stroke();
  }
}
