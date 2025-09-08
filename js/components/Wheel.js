// (file path: js/components/Wheel.js)

import { snapRing, snapChromaticAndSettleMode, snapDegreeToDiatonic } from '../core/animation.js';
import { setRingAngle, rotateCoupledRings } from '../core/actions.js';
import { SEMITONES, ANGLE_STEP, FONT_FACTOR_OUTER, FONT_FACTOR_MIDDLE, FONT_FACTOR_INNER, FIXED_INTERVAL_COLOUR, PIANO_KEY_COLOUR } from '../core/constants.js';
import { getContrastColor } from '../core/color.js';

export default class Wheel {
  constructor(canvas, state, onInteractionEnd) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;
    this.onInteractionEnd = onInteractionEnd;

    this._initInteraction();
  }

  // --- Public Methods ---

  update(rings, labels, playbackState) {
    const { size, dpr } = this.state.dimensions;
    this._draw(size, dpr, rings, labels, playbackState);
  }

  // --- Private Methods ---

  _initInteraction() {
    const getPointerInfo = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const { cx, cy, size } = this.state.dimensions;
      const x = e.clientX - rect.left - cx;
      const y = e.clientY - rect.top - cy;
      const r = Math.hypot(x, y);

      const outer = size * 0.5, middle = size * 0.35, inner = size * 0.2;

      let ring = null;
      if (r > inner && r < middle) ring = 'degree';
      else if (r > middle && r < outer) ring = 'pitchClass';
      else if (r <= inner) ring = 'chromatic';
      
      return { x, y, ring };
    };

    const endDrag = () => {
      if (!this.state.drag.active) return;
      const ring = this.state.drag.active;
      this.state.drag.active = null;
      this.canvas.style.cursor = 'grab';

      if (ring === 'chromatic') snapChromaticAndSettleMode(this.onInteractionEnd);
      else if (ring === 'pitchClass') snapRing('pitchClass', this.onInteractionEnd);
      else if (ring === 'degree') snapDegreeToDiatonic(this.onInteractionEnd);
    };

    this.canvas.addEventListener('pointerdown', e => {
      const { x, y, ring } = getPointerInfo(e);
      if (!ring) return;
      
      const { drag, rings } = this.state;
      drag.active = ring;
      drag.startX = x;
      drag.startY = y;
      drag.startPitchClass = rings.pitchClass;
      drag.startDegree = rings.degree;
      drag.startChrom = rings.chromatic;
      drag.startHighlight = rings.highlightPosition;

      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('pointermove', e => {
      if (this.state.drag.active) {
        const { x, y } = getPointerInfo(e);
        const s = this.state.drag;
        const startAngle = Math.atan2(s.startY, s.startX);
        const curAngle = Math.atan2(y, x);
        const deltaAngle = curAngle - startAngle;

        if (s.active === 'pitchClass') {
          setRingAngle('pitchClass', s.startPitchClass + deltaAngle);
        } else if (s.active === 'degree') {
          setRingAngle('degree', s.startDegree + deltaAngle);
          setRingAngle('highlightPosition', s.startHighlight + deltaAngle);
        } else if (s.active === 'chromatic') {
           rotateCoupledRings({
              startPitchClass: s.startPitchClass,
              startDegree: s.startDegree,
              startChrom: s.startChrom,
              startHighlight: s.startHighlight
          }, deltaAngle);
        }
      } else {
        const { ring } = getPointerInfo(e);
        this.canvas.style.cursor = ring ? 'grab' : 'default';
      }
    });
    
    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);
    this.canvas.addEventListener('pointerleave', () => {
      if (!this.state.drag.active) this.canvas.style.cursor = 'default';
    });
  }

  _draw(size, dpr, rings, labels, playbackState) {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    
    const cx = size / 2, cy = size / 2;
    const { pitchClass, degree, chromatic } = rings;
    const { chromaticLabels, diatonicLabels } = labels;
    
    const segPath = (r0, r1, angle) => {
        const a0 = angle - ANGLE_STEP / 2, a1 = angle + ANGLE_STEP / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r1, a0, a1);
        ctx.arc(cx, cy, r0, a1, a0, true);
        ctx.closePath();
    };
    
    const drawOuterRing = () => {
        const r1=size*0.5, r0=size*0.35;
        const canonicalNotes = Object.keys(PIANO_KEY_COLOUR);
        canonicalNotes.forEach((note,i)=>{
          const ang=i*ANGLE_STEP+pitchClass-Math.PI/2;
          segPath(r0,r1,ang);
          // --- REVERTED to original static colors ---
          ctx.fillStyle = PIANO_KEY_COLOUR[note] ? '#fff' : '#000';
          ctx.fill();
          ctx.lineWidth = size * 0.002;
          ctx.strokeStyle='#000'; ctx.stroke();
        });
    };

    const drawMiddleRing = () => {
        const r1=size*0.35, r0=size*0.2;
        for(let i=0;i<12;i++){
          const ang=i*ANGLE_STEP+degree-Math.PI/2;
          segPath(r0,r1,ang);
          ctx.fillStyle = FIXED_INTERVAL_COLOUR[i] || '#e0e0e0';
          ctx.fill();
          ctx.lineWidth = size * 0.002;
          ctx.strokeStyle='#000'; ctx.stroke();
        }
    };

    const drawInner = () => {
        ctx.beginPath();
        ctx.arc(cx,cy,size*0.2,0,Math.PI*2);
        ctx.fillStyle='#000';
        ctx.fill();
    };

    const drawLabels = () => {
        const rOuter=size*0.5*0.85, rMid=size*0.35*0.8, rInner=size*0.2*0.8;
        const canonicalNotes = Object.keys(PIANO_KEY_COLOUR);

        const label = (angle, radius, text, fill, fontSize) => {
            ctx.fillStyle = fill;
            ctx.font = `${fontSize}px 'Atkinson Hyperlegible Next'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            if (String(text).includes('<br>')) {
                const lines = text.split('<br>');
                const lineHeight = fontSize * 1.1;
                const startY = y - (lineHeight * (lines.length - 1)) / 2;

                lines.forEach((line, index) => {
                    ctx.fillText(line, x, startY + (index * lineHeight));
                });
            } else {
                ctx.fillText(text, x, y);
            }
        };

        const outerFontSize = size * FONT_FACTOR_OUTER;
        chromaticLabels.forEach((n,i)=> {
            const originalNote = canonicalNotes[i];
            const textToDraw = n;
            // --- REVERTED to original static colors ---
            const textColor = PIANO_KEY_COLOUR[originalNote] ? '#000' : '#fff';
            label(i*ANGLE_STEP+pitchClass-Math.PI/2, rOuter, textToDraw, textColor, outerFontSize);
        });
        
        const middleFontSize = size * FONT_FACTOR_MIDDLE;
        diatonicLabels.forEach((inv,i)=> {
            const bgColor = FIXED_INTERVAL_COLOUR[i];
            const textColor = getContrastColor(bgColor); 
            const textToDraw = inv;
            label(i*ANGLE_STEP+degree-Math.PI/2, rMid, textToDraw, textColor, middleFontSize);
        });

        const innerFontSize = size * FONT_FACTOR_INNER;
        SEMITONES.forEach(i=> label(i*ANGLE_STEP+chromatic-Math.PI/2,rInner,i.toString(),'#fff', innerFontSize));
    };

    const drawPlaybackHighlight = () => {
        if (!playbackState || !playbackState.isPlaying || playbackState.currentNoteIndex === null) return;
        
        const visualNoteIndex = playbackState.currentNoteIndex % 12;
        const angle = visualNoteIndex * ANGLE_STEP + pitchClass - Math.PI / 2;
        const r1 = size * 0.5, r0 = size * 0.2;
        segPath(r0, r1, angle);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.fill();
    };
    
    const drawMarker = () => {
        const rOuter=size*0.5, rInner=size*0.125;
        const base=-Math.PI/2+chromatic, a0=base-ANGLE_STEP/2, a1=base+ANGLE_STEP/2;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(a0)*rInner, cy+Math.sin(a0)*rInner);
        ctx.arc(cx,cy,rOuter,a0,a1);
        ctx.lineTo(cx+Math.cos(a1)*rInner, cy+Math.sin(a1)*rInner);
        ctx.arc(cx,cy,rInner,a1,a0,true);
        ctx.closePath();
        ctx.lineWidth=size*0.006; ctx.strokeStyle='red'; ctx.stroke();
    };

    // --- Execute drawing ---
    drawOuterRing();
    drawMiddleRing();
    drawInner();
    drawLabels();
    drawPlaybackHighlight();
    drawMarker();
    
    ctx.restore();
  }
}