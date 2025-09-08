var v=Object.defineProperty;var w=(r,t,e)=>t in r?v(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var h=(r,t,e)=>w(r,typeof t!="symbol"?t+"":t,e);import{E as f,C as p,A as o,a as n,n as k}from"./index-I8egu1CP.js";class u{static setActiveRing(t){this.activeRing=t,this.updateRingHighlights()}static updateRingHighlights(){const t=document.getElementById("chromaWheel");if(!t)return;this.removeRingHighlight();const e=t.getBoundingClientRect(),i=Math.min(e.width,e.height),a=e.left+e.width/2,y=e.top+e.height/2;this.createRingHighlight(this.activeRing,i,a,y)}static createRingHighlight(t,e,i,a){const y=e*.5,m=e*.35,b=e*.2;let l="",c="";switch(t){case"pitch":l=this.createRingPath(i,a,m,y),c="#ff6b6b";break;case"degree":l=this.createRingPath(i,a,b,m),c="#4ecdc4";break;case"chromatic":l=this.createCirclePath(i,a,b),c="#ffe66d";break;case"intervals":l=this.createRingPath(i,a,b,m),c="#a8e6cf";break}const g=document.createElementNS("http://www.w3.org/2000/svg","svg");g.id="ring-highlight-overlay",g.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1000;
    `;const s=document.createElementNS("http://www.w3.org/2000/svg","path");if(s.setAttribute("d",l),s.setAttribute("fill","none"),s.setAttribute("stroke",c),s.setAttribute("stroke-width","4"),s.setAttribute("stroke-dasharray","8,4"),s.style.filter="drop-shadow(0 0 6px "+c+")",window.matchMedia("(prefers-reduced-motion: reduce)").matches)s.setAttribute("stroke-opacity","0.9");else{const d=document.createElementNS("http://www.w3.org/2000/svg","animate");d.setAttribute("attributeName","stroke-opacity"),d.setAttribute("values","0.7;1;0.7"),d.setAttribute("dur","2s"),d.setAttribute("repeatCount","indefinite"),s.appendChild(d)}g.appendChild(s),document.body.appendChild(g)}static createRingPath(t,e,i,a){return`
      M ${t-a} ${e}
      A ${a} ${a} 0 1 1 ${t+a} ${e}
      A ${a} ${a} 0 1 1 ${t-a} ${e}
      M ${t-i} ${e}
      A ${i} ${i} 0 1 0 ${t+i} ${e}
      A ${i} ${i} 0 1 0 ${t-i} ${e}
      Z
    `.replace(/\s+/g," ").trim()}static createCirclePath(t,e,i){return`
      M ${t-i} ${e}
      A ${i} ${i} 0 1 1 ${t+i} ${e}
      A ${i} ${i} 0 1 1 ${t-i} ${e}
      Z
    `.replace(/\s+/g," ").trim()}static removeRingHighlight(){const t=document.getElementById("ring-highlight-overlay");t&&t.remove()}static init(){try{this.setupKeyMap(),this.bindEvents(),this.initFocusManagement(),console.log("Keyboard navigation initialized")}catch(t){f.handle(t,p.ERROR_HANDLING.CONTEXTS.UI)}}static setupKeyMap(){this.keyMap.set("ArrowLeft",{action:"rotatePitchClass",direction:-1,description:"Rotate pitch ring left"}),this.keyMap.set("ArrowRight",{action:"rotatePitchClass",direction:1,description:"Rotate pitch ring right"}),this.keyMap.set("ArrowUp",{action:"rotateDegree",direction:1,description:"Rotate degree ring up"}),this.keyMap.set("ArrowDown",{action:"rotateDegree",direction:-1,description:"Rotate degree ring down"}),this.keyMap.set("Shift+ArrowLeft",{action:"rotateChromatic",direction:-1,description:"Rotate chromatic ring left"}),this.keyMap.set("Shift+ArrowRight",{action:"rotateChromatic",direction:1,description:"Rotate chromatic ring right"}),this.keyMap.set("Shift+ArrowUp",{action:"rotateChromatic",direction:1,description:"Rotate chromatic ring up"}),this.keyMap.set("Shift+ArrowDown",{action:"rotateChromatic",direction:-1,description:"Rotate chromatic ring down"}),this.keyMap.set("Ctrl+ArrowLeft",{action:"rotatePitchClass",direction:-3,description:"Rotate pitch ring left (large step)"}),this.keyMap.set("Ctrl+ArrowRight",{action:"rotatePitchClass",direction:3,description:"Rotate pitch ring right (large step)"}),this.keyMap.set("Ctrl+ArrowUp",{action:"rotateDegree",direction:3,description:"Rotate degree ring up (large step)"}),this.keyMap.set("Ctrl+ArrowDown",{action:"rotateDegree",direction:-3,description:"Rotate degree ring down (large step)"}),this.keyMap.set("Space",{action:"togglePlayback",description:"Play/pause scale"}),this.keyMap.set("Enter",{action:"togglePlayback",description:"Play/pause scale"}),this.keyMap.set("Escape",{action:"closeSidebar",description:"Close sidebar"}),this.keyMap.set("F1",{action:"toggleSidebar",description:"Open/close settings"}),this.keyMap.set("v",{action:"toggleOrientation",description:"Toggle vertical/horizontal layout"}),this.keyMap.set("V",{action:"toggleOrientation",description:"Toggle vertical/horizontal layout"}),this.keyMap.set("d",{action:"toggleDarkMode",description:"Toggle dark mode"}),this.keyMap.set("h",{action:"toggleHelp",description:"Show/hide keyboard shortcuts"}),this.keyMap.set("f",{action:"toggleFlat",description:"Toggle flat note names"}),this.keyMap.set("F",{action:"toggleFlat",description:"Toggle flat note names"}),this.keyMap.set("s",{action:"toggleSharp",description:"Toggle sharp note names"}),this.keyMap.set("S",{action:"toggleSharp",description:"Toggle sharp note names"}),this.keyMap.set("r",{action:"resetRings",description:"Reset all rings to starting position"}),this.keyMap.set("Home",{action:"resetRings",description:"Reset all rings to starting position"}),this.keyMap.set("Shift+f",{action:"toggleFineMode",description:"Toggle fine control mode"});for(let t=1;t<=12;t++)this.keyMap.set(t.toString(),{action:"selectNote",noteIndex:t-1,description:`Select note ${t}`})}static bindEvents(){document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("keyup",this.handleKeyUp.bind(this)),document.addEventListener("keydown",t=>{this.shouldPreventDefault(t)&&t.preventDefault()},{capture:!0})}static initFocusManagement(){this.setupFocusIndicators()}static setupFocusIndicators(){const t=document.createElement("style");t.textContent=`
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
    `,document.head.appendChild(t),this.setupResizeHandler()}static setupResizeHandler(){let t;window.addEventListener("resize",()=>{clearTimeout(t),t=setTimeout(()=>{this.updateRingHighlights()},100)})}static handleKeyDown(t){try{if(!this.isEnabled||this.isTextInputActive())return;const e=this.getKeyString(t),i=this.keyMap.get(e);i&&this.executeCommand(i,t)}catch(e){f.handle(e,p.ERROR_HANDLING.CONTEXTS.UI)}}static handleKeyUp(t){}static getKeyString(t){const e=[];return t.ctrlKey&&e.push("Ctrl"),t.shiftKey&&e.push("Shift"),t.altKey&&e.push("Alt"),t.metaKey&&e.push("Meta"),e.push(t.key),e.join("+")}static isTextInputActive(){const t=document.activeElement;return["INPUT","TEXTAREA","SELECT"].includes(t==null?void 0:t.tagName)||(t==null?void 0:t.contentEditable)==="true"}static shouldPreventDefault(t){if(this.isTextInputActive())return!1;const e=this.getKeyString(t);return!!this.keyMap.get(e)&&!["Escape"].includes(t.key)}static executeCommand(t,e){const i=this.navigationMode==="fine"?.5:1;switch(t.action){case"rotatePitchClass":this.setActiveRing("pitch"),this.rotateRing("pitchClass",t.direction*i),this.announceRingPosition("pitch");break;case"rotateDegree":this.setActiveRing("degree"),this.rotateRing("degree",t.direction*i),this.rotateRing("highlightPosition",t.direction*i),this.announceRingPosition("degree");break;case"rotateChromatic":this.setActiveRing("chromatic"),this.rotateAllRings(t.direction*i),this.announceRingPosition("chromatic");break;case"selectNote":this.selectNoteDirectly(t.noteIndex);break;case"togglePlayback":o.togglePlayback(),this.announcePlaybackState();break;case"toggleSidebar":o.toggleSidebar(),this.announceSidebarState();break;case"closeSidebar":o.toggleSidebar(!1),this.announce("Settings closed");break;case"toggleDarkMode":o.toggleDarkMode(),this.announce(n.ui.darkMode?"Dark mode enabled":"Light mode enabled");break;case"toggleOrientation":const a=n.belts.orientation==="horizontal"?"vertical":"horizontal";o.setOrientation(a),this.announce(`Layout changed to ${a}`);break;case"toggleFlat":o.toggleAccidental("flat"),this.announce(n.display.flat?"Flat names enabled":"Flat names disabled");break;case"toggleSharp":o.toggleAccidental("sharp"),this.announce(n.display.sharp?"Sharp names enabled":"Sharp names disabled");break;case"resetRings":o.resetRings(),this.announce("All rings reset to starting position");break;case"toggleFineMode":this.navigationMode=this.navigationMode==="fine"?"normal":"fine",this.announce(`Fine control mode ${this.navigationMode==="fine"?"enabled":"disabled"}`);break;case"toggleHelp":this.toggleKeyboardHelp();break}}static rotateRing(t,e){const i=n.rings[t],a=k(i+e*p.WHEEL.SEGMENTS/12);o.setRingAngle(t,a)}static rotateAllRings(t){const e=t*(p.WHEEL.SEGMENTS/12);["pitchClass","degree","chromatic","highlightPosition"].forEach(i=>{const a=n.rings[i];o.setRingAngle(i,k(a+e))})}static selectNoteDirectly(t){const e=k(-t*(Math.PI*2/12));o.setRingAngle("chromatic",e),this.announce(`Selected note ${t+1}`)}static toggleKeyboardHelp(){let t=document.querySelector(".keyboard-help-overlay");if(t){t.remove(),this.announce("Keyboard help closed");return}t=document.createElement("div"),t.className="keyboard-help-overlay",t.innerHTML=this.generateHelpContent();const e=()=>{t.remove(),this.announce("Keyboard help closed")};t.querySelector(".keyboard-help-close").addEventListener("click",e),document.addEventListener("keydown",i=>{i.key==="Escape"&&document.querySelector(".keyboard-help-overlay")&&e()},{once:!0}),document.body.appendChild(t),t.querySelector(".keyboard-help-close").focus(),this.announce("Keyboard help opened")}static generateHelpContent(){return`
      <h2>Keyboard Shortcuts</h2>
      <div class="keyboard-help-shortcuts">
        ${Array.from(this.keyMap.entries()).filter(([i,a])=>a.description).sort(([i],[a])=>i.localeCompare(a)).map(([i,a])=>`<div class="keyboard-help-key">${i}</div>
       <div class="keyboard-help-description">${a.description}</div>`).join("")}
      </div>
      <button class="keyboard-help-close">Close (Esc)</button>
    `}static announceRingPosition(t){const e=Math.round((n.rings[t]||0)*180/Math.PI);this.announce(`${t} ring at ${e} degrees`)}static announcePlaybackState(){const t=n.playback.isPlaying?"Scale playing":"Playback stopped";this.announce(t)}static announceSidebarState(){const t=n.ui.sidebarOpen?"Settings opened":"Settings closed";this.announce(t)}static announce(t,e="polite"){const i=document.createElement("div");i.setAttribute("aria-live",e),i.setAttribute("aria-atomic","true"),i.className="sr-only",i.textContent=t,i.style.position="absolute",i.style.left="-10000px",i.style.width="1px",i.style.height="1px",i.style.overflow="hidden",document.body.appendChild(i),setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},1e3)}static enable(){this.isEnabled=!0,this.announce("Keyboard navigation enabled")}static disable(){this.isEnabled=!1,this.removeRingHighlight(),this.announce("Keyboard navigation disabled")}static getShortcuts(){return Array.from(this.keyMap.entries()).map(([t,e])=>({key:t,description:e.description,action:e.action}))}}h(u,"isEnabled",!0),h(u,"keyMap",new Map),h(u,"activeRing","pitch"),h(u,"navigationMode","normal");export{u as KeyboardManager};
