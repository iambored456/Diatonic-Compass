var E=Object.defineProperty;var w=(c,e,t)=>e in c?E(c,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):c[e]=t;var h=(c,e,t)=>w(c,typeof e!="symbol"?e+"":e,t);import{E as M,C as S,A as s,a,s as b,D as A,n,b as g}from"./index-BDrWD3Bh.js";class y{static setActiveRing(e){this.activeRing=e}static init(){try{this.setupKeyMap(),this.bindEvents(),this.initFocusManagement(),console.log("Keyboard navigation initialized")}catch(e){M.handle(e,S.ERROR_HANDLING.CONTEXTS.UI)}}static setupKeyMap(){this.keyMap.set("ArrowLeft",{action:"rotatePitchClass",direction:-1,description:"Rotate pitch ring left"}),this.keyMap.set("ArrowRight",{action:"rotatePitchClass",direction:1,description:"Rotate pitch ring right"}),this.keyMap.set("ArrowUp",{action:"rotateDegree",direction:1,description:"Rotate degree ring up"}),this.keyMap.set("ArrowDown",{action:"rotateDegree",direction:-1,description:"Rotate degree ring down"}),this.keyMap.set("Shift+ArrowLeft",{action:"rotateChromatic",direction:-1,description:"Rotate chromatic ring left"}),this.keyMap.set("Shift+ArrowRight",{action:"rotateChromatic",direction:1,description:"Rotate chromatic ring right"}),this.keyMap.set("Shift+ArrowUp",{action:"rotateChromatic",direction:1,description:"Rotate chromatic ring up"}),this.keyMap.set("Shift+ArrowDown",{action:"rotateChromatic",direction:-1,description:"Rotate chromatic ring down"}),this.keyMap.set("Ctrl+ArrowLeft",{action:"rotatePitchClass",direction:-3,description:"Rotate pitch ring left (large step)"}),this.keyMap.set("Ctrl+ArrowRight",{action:"rotatePitchClass",direction:3,description:"Rotate pitch ring right (large step)"}),this.keyMap.set("Ctrl+ArrowUp",{action:"rotateDegree",direction:3,description:"Rotate degree ring up (large step)"}),this.keyMap.set("Ctrl+ArrowDown",{action:"rotateDegree",direction:-3,description:"Rotate degree ring down (large step)"}),this.keyMap.set(" ",{action:"togglePlayback",description:"Play/pause scale (Space)"}),this.keyMap.set("Enter",{action:"togglePlayback",description:"Play/pause scale"}),this.keyMap.set("Escape",{action:"closeSidebar",description:"Close sidebar"}),this.keyMap.set("F1",{action:"toggleSidebar",description:"Open/close settings"}),this.keyMap.set("v",{action:"toggleOrientation",description:"Toggle vertical/horizontal layout"}),this.keyMap.set("V",{action:"toggleOrientation",description:"Toggle vertical/horizontal layout"}),this.keyMap.set("d",{action:"toggleDarkMode",description:"Toggle dark mode"}),this.keyMap.set("h",{action:"toggleHelp",description:"Show/hide keyboard shortcuts"}),this.keyMap.set("f",{action:"toggleFlat",description:"Toggle flat note names"}),this.keyMap.set("F",{action:"toggleFlat",description:"Toggle flat note names"}),this.keyMap.set("s",{action:"toggleSharp",description:"Toggle sharp note names"}),this.keyMap.set("S",{action:"toggleSharp",description:"Toggle sharp note names"}),this.keyMap.set("r",{action:"resetRings",description:"Reset all rings to starting position"}),this.keyMap.set("Home",{action:"resetRings",description:"Reset all rings to starting position"}),this.keyMap.set("Shift+f",{action:"toggleFineMode",description:"Toggle fine control mode"});for(let e=1;e<=12;e++)this.keyMap.set(e.toString(),{action:"selectNote",noteIndex:e-1,description:`Select note ${e}`})}static bindEvents(){document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("keyup",this.handleKeyUp.bind(this)),document.addEventListener("keydown",e=>{this.shouldPreventDefault(e)&&e.preventDefault()},{capture:!0})}static initFocusManagement(){this.setupFocusIndicators()}static setupFocusIndicators(){const e=document.createElement("style");e.textContent=`
      .keyboard-help-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-surface);
        color: var(--color-text-primary);
        padding: 2rem;
        border-radius: var(--radius-medium);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 3000;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        border: 2px solid #33c6dc;
      }

      .keyboard-help-overlay h2 {
        margin-top: 0;
        color: #33c6dc;
      }

      .keyboard-help-shortcuts {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.5rem 1rem;
        margin: 1rem 0;
      }

      .keyboard-help-key {
        background: #f0f0f0;
        color: #333;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        font-weight: bold;
        text-align: center;
        min-width: 3rem;
      }

      .keyboard-help-description {
        padding: 0.25rem 0;
      }

      .keyboard-help-close {
        background: #33c6dc;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
      }
    `,document.head.appendChild(e)}static handleKeyDown(e){try{if(console.log("=== KeyboardManager.handleKeyDown ==="),console.log("Key pressed:",e.key),console.log("isEnabled:",this.isEnabled),!this.isEnabled){console.log("Keyboard manager disabled, returning");return}const t=this.isTextInputActive();if(console.log("isTextInputActive:",t),t){console.log("Text input active, returning");return}const i=this.getKeyString(e);console.log("Key string with modifiers:",i);const o=this.keyMap.get(i);console.log("Command found:",o),o?(console.log("Executing command:",o.action),this.executeCommand(o,e)):console.log("No command mapped for key:",i)}catch(t){console.error("Error in handleKeyDown:",t),M.handle(t,S.ERROR_HANDLING.CONTEXTS.UI)}}static handleKeyUp(e){}static getKeyString(e){const t=[];return e.ctrlKey&&t.push("Ctrl"),e.shiftKey&&t.push("Shift"),e.altKey&&t.push("Alt"),e.metaKey&&t.push("Meta"),t.push(e.key),t.join("+")}static isTextInputActive(){const e=document.activeElement;return["INPUT","TEXTAREA","SELECT"].includes(e==null?void 0:e.tagName)||(e==null?void 0:e.contentEditable)==="true"}static shouldPreventDefault(e){if(console.log("=== shouldPreventDefault ==="),console.log("Key:",e.key),this.isTextInputActive())return console.log("Text input active, not preventing default"),!1;const t=this.getKeyString(e),i=this.keyMap.get(t),o=!!i&&!["Escape"].includes(e.key);return console.log("Command found:",!!i),console.log("Should prevent default:",o),o}static executeCommand(e,t){const i=this.navigationMode==="fine"?.5:1;switch(e.action){case"rotatePitchClass":this.setActiveRing("pitch"),this.rotateRingAndSnap("pitchClass",e.direction*i),this.announceRingPosition("pitch");break;case"rotateDegree":this.setActiveRing("degree"),this.rotateRingAndSnap("degree",e.direction*i),this.announceRingPosition("degree");break;case"rotateChromatic":this.setActiveRing("chromatic"),this.rotateAllRingsAndSnap(e.direction*i),this.announceRingPosition("chromatic");break;case"selectNote":this.selectNoteDirectly(e.noteIndex);break;case"togglePlayback":s.togglePlayback(),this.announcePlaybackState();break;case"toggleSidebar":s.toggleSidebar(),this.announceSidebarState();break;case"closeSidebar":s.toggleSidebar(!1),this.announce("Settings closed");break;case"toggleDarkMode":s.toggleDarkMode(),this.announce(a.ui.darkMode?"Dark mode enabled":"Light mode enabled");break;case"toggleOrientation":const o=a.belts.orientation==="horizontal"?"vertical":"horizontal";s.setOrientation(o),this.announce(`Layout changed to ${o}`);break;case"toggleFlat":s.toggleAccidental("flat"),this.announce(a.display.flat?"Flat names enabled":"Flat names disabled");break;case"toggleSharp":s.toggleAccidental("sharp"),this.announce(a.display.sharp?"Sharp names enabled":"Sharp names disabled");break;case"resetRings":s.resetRings(),this.announce("All rings reset to starting position");break;case"toggleFineMode":this.navigationMode=this.navigationMode==="fine"?"normal":"fine",this.announce(`Fine control mode ${this.navigationMode==="fine"?"enabled":"disabled"}`);break;case"toggleHelp":this.toggleKeyboardHelp();break}}static rotateRingAndSnap(e,t){if(e==="degree")this.rotateDegreeRingDiatonically(t);else if(e==="pitchClass"){const i=t*(Math.PI*2/12),o=a.rings.pitchClass,l=n(o+i),d=Math.round(-l/g),r=n(-d*g);b({pitchClass:r})}}static rotateDegreeRingDiatonically(e){const{degree:t,chromatic:i}=a.rings,o=n(t-i),l=n(-o)/g;let d=0,r=1/0;A.forEach((C,D)=>{const f=Math.abs(l-C),v=Math.min(f,12-f);v<r&&(r=v,d=D)});const p=e>0?1:-1,m=(d+p+7)%7,u=A[m],R=n(-u*g),k=n(R+i);b({degree:k,highlightPosition:k})}static rotateAllRingsAndSnap(e){const t=e*(Math.PI*2/12),i=n(a.rings.pitchClass+t),o=n(a.rings.degree+t),l=n(a.rings.chromatic+t),d=Math.round(-l/g),r=n(-d*g),p=r-l,m=n(i+p),u=n(o+p);b({pitchClass:m,degree:u,chromatic:r,highlightPosition:u})}static selectNoteDirectly(e){const t=n(-e*(Math.PI*2/12));s.setRingAngle("chromatic",t),this.announce(`Selected note ${e+1}`)}static toggleKeyboardHelp(){let e=document.querySelector(".keyboard-help-overlay");if(e){e.remove(),this.announce("Keyboard help closed");return}e=document.createElement("div"),e.className="keyboard-help-overlay",e.innerHTML=this.generateHelpContent();const t=()=>{e.remove(),this.announce("Keyboard help closed")};e.querySelector(".keyboard-help-close").addEventListener("click",t),document.addEventListener("keydown",i=>{i.key==="Escape"&&document.querySelector(".keyboard-help-overlay")&&t()},{once:!0}),document.body.appendChild(e),e.querySelector(".keyboard-help-close").focus(),this.announce("Keyboard help opened")}static generateHelpContent(){return`
      <h2>Keyboard Shortcuts</h2>
      <div class="keyboard-help-shortcuts">
        ${Array.from(this.keyMap.entries()).filter(([i,o])=>o.description).sort(([i],[o])=>i.localeCompare(o)).map(([i,o])=>`<div class="keyboard-help-key">${i}</div>
       <div class="keyboard-help-description">${o.description}</div>`).join("")}
      </div>
      <button class="keyboard-help-close">Close (Esc)</button>
    `}static announceRingPosition(e){const t=Math.round((a.rings[e]||0)*180/Math.PI);this.announce(`${e} ring at ${t} degrees`)}static announcePlaybackState(){const e=a.playback.isPlaying?"Scale playing":"Playback stopped";this.announce(e)}static announceSidebarState(){const e=a.ui.sidebarOpen?"Settings opened":"Settings closed";this.announce(e)}static announce(e,t="polite"){const i=document.createElement("div");i.setAttribute("aria-live",t),i.setAttribute("aria-atomic","true"),i.className="sr-only",i.textContent=e,i.style.position="absolute",i.style.left="-10000px",i.style.width="1px",i.style.height="1px",i.style.overflow="hidden",document.body.appendChild(i),setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},1e3)}static enable(){this.isEnabled=!0,this.announce("Keyboard navigation enabled")}static disable(){this.isEnabled=!1,this.announce("Keyboard navigation disabled")}static getShortcuts(){return Array.from(this.keyMap.entries()).map(([e,t])=>({key:e,description:t.description,action:t.action}))}}h(y,"isEnabled",!0),h(y,"keyMap",new Map),h(y,"activeRing","pitch"),h(y,"navigationMode","normal");export{y as KeyboardManager};
