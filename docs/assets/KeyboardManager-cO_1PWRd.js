var p=Object.defineProperty;var g=(s,e,t)=>e in s?p(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var r=(s,e,t)=>g(s,typeof e!="symbol"?e+"":e,t);import{E as h,C as c,A as o,a as n,n as d}from"./index-CtzSe68x.js";class l{static init(){try{this.setupKeyMap(),this.bindEvents(),this.initFocusManagement(),console.log("Keyboard navigation initialized")}catch(e){h.handle(e,c.ERROR_HANDLING.CONTEXTS.UI)}}static setupKeyMap(){this.keyMap.set("ArrowLeft",{action:"rotatePitchClass",direction:-1,description:"Rotate pitch ring left"}),this.keyMap.set("ArrowRight",{action:"rotatePitchClass",direction:1,description:"Rotate pitch ring right"}),this.keyMap.set("ArrowUp",{action:"rotateDegree",direction:1,description:"Rotate degree ring up"}),this.keyMap.set("ArrowDown",{action:"rotateDegree",direction:-1,description:"Rotate degree ring down"}),this.keyMap.set("Shift+ArrowLeft",{action:"rotateChromatic",direction:-1,description:"Rotate chromatic ring left"}),this.keyMap.set("Shift+ArrowRight",{action:"rotateChromatic",direction:1,description:"Rotate chromatic ring right"}),this.keyMap.set("Shift+ArrowUp",{action:"rotateChromatic",direction:1,description:"Rotate chromatic ring up"}),this.keyMap.set("Shift+ArrowDown",{action:"rotateChromatic",direction:-1,description:"Rotate chromatic ring down"}),this.keyMap.set("Ctrl+ArrowLeft",{action:"rotatePitchClass",direction:-3,description:"Rotate pitch ring left (large step)"}),this.keyMap.set("Ctrl+ArrowRight",{action:"rotatePitchClass",direction:3,description:"Rotate pitch ring right (large step)"}),this.keyMap.set("Ctrl+ArrowUp",{action:"rotateDegree",direction:3,description:"Rotate degree ring up (large step)"}),this.keyMap.set("Ctrl+ArrowDown",{action:"rotateDegree",direction:-3,description:"Rotate degree ring down (large step)"}),this.keyMap.set("Space",{action:"togglePlayback",description:"Play/pause scale"}),this.keyMap.set("Enter",{action:"togglePlayback",description:"Play/pause scale"}),this.keyMap.set("Escape",{action:"closeSidebar",description:"Close sidebar"}),this.keyMap.set("Tab",{action:"handleTabNavigation",description:"Navigate between elements"}),this.keyMap.set("s",{action:"toggleSidebar",description:"Toggle settings sidebar"}),this.keyMap.set("d",{action:"toggleDarkMode",description:"Toggle dark mode"}),this.keyMap.set("o",{action:"toggleOrientation",description:"Toggle horizontal/vertical layout"}),this.keyMap.set("h",{action:"toggleHelp",description:"Show/hide keyboard shortcuts"}),this.keyMap.set("f",{action:"toggleFlat",description:"Toggle flat note names"}),this.keyMap.set("F",{action:"toggleSharp",description:"Toggle sharp note names"}),this.keyMap.set("r",{action:"resetRings",description:"Reset all rings to starting position"}),this.keyMap.set("Home",{action:"resetRings",description:"Reset all rings to starting position"}),this.keyMap.set("Shift+f",{action:"toggleFineMode",description:"Toggle fine control mode"});for(let e=1;e<=12;e++)this.keyMap.set(e.toString(),{action:"selectNote",noteIndex:e-1,description:`Select note ${e}`})}static bindEvents(){document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("keyup",this.handleKeyUp.bind(this)),document.addEventListener("keydown",e=>{this.shouldPreventDefault(e)&&e.preventDefault()},{capture:!0})}static initFocusManagement(){const e=document.querySelector("#chromaWheel");e&&(e.setAttribute("tabindex","0"),e.setAttribute("role","application"),e.setAttribute("aria-label","Diatonic Compass wheel - use arrow keys to rotate rings, space to play scale"),e.addEventListener("focus",()=>{this.focusedElement="canvas",this.announceInstructions()})),this.setupFocusIndicators()}static setupFocusIndicators(){const e=document.createElement("style");e.textContent=`
      .keyboard-focus {
        outline: 3px solid #33c6dc !important;
        outline-offset: 2px !important;
      }
      
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
    `,document.head.appendChild(e)}static handleKeyDown(e){try{if(!this.isEnabled||this.isTextInputActive())return;const t=this.getKeyString(e),i=this.keyMap.get(t);i&&this.executeCommand(i,e)}catch(t){h.handle(t,c.ERROR_HANDLING.CONTEXTS.UI)}}static handleKeyUp(e){}static getKeyString(e){const t=[];return e.ctrlKey&&t.push("Ctrl"),e.shiftKey&&t.push("Shift"),e.altKey&&t.push("Alt"),e.metaKey&&t.push("Meta"),t.push(e.key),t.join("+")}static isTextInputActive(){const e=document.activeElement;return["INPUT","TEXTAREA","SELECT"].includes(e==null?void 0:e.tagName)||(e==null?void 0:e.contentEditable)==="true"}static shouldPreventDefault(e){if(this.isTextInputActive())return!1;const t=this.getKeyString(e);return!!this.keyMap.get(t)&&!["Tab","Escape"].includes(e.key)}static executeCommand(e,t){const i=this.navigationMode==="fine"?.5:1;switch(e.action){case"rotatePitchClass":this.rotateRing("pitchClass",e.direction*i),this.announceRingPosition("pitch");break;case"rotateDegree":this.rotateRing("degree",e.direction*i),this.rotateRing("highlightPosition",e.direction*i),this.announceRingPosition("degree");break;case"rotateChromatic":this.rotateAllRings(e.direction*i),this.announceRingPosition("chromatic");break;case"selectNote":this.selectNoteDirectly(e.noteIndex);break;case"togglePlayback":o.togglePlayback(),this.announcePlaybackState();break;case"toggleSidebar":o.toggleSidebar(),this.announceSidebarState();break;case"closeSidebar":o.toggleSidebar(!1),this.announce("Settings closed");break;case"toggleDarkMode":o.toggleDarkMode(),this.announce(n.ui.darkMode?"Dark mode enabled":"Light mode enabled");break;case"toggleOrientation":const a=n.belts.orientation==="horizontal"?"vertical":"horizontal";o.setOrientation(a),this.announce(`Layout changed to ${a}`);break;case"toggleFlat":o.toggleAccidental("flat"),this.announce(n.display.flat?"Flat names enabled":"Flat names disabled");break;case"toggleSharp":o.toggleAccidental("sharp"),this.announce(n.display.sharp?"Sharp names enabled":"Sharp names disabled");break;case"resetRings":o.resetRings(),this.announce("All rings reset to starting position");break;case"toggleFineMode":this.navigationMode=this.navigationMode==="fine"?"normal":"fine",this.announce(`Fine control mode ${this.navigationMode==="fine"?"enabled":"disabled"}`);break;case"toggleHelp":this.toggleKeyboardHelp();break;case"handleTabNavigation":this.handleTabNavigation(t);break}}static rotateRing(e,t){const i=n.rings[e],a=d(i+t*c.WHEEL.SEGMENTS/12);o.setRingAngle(e,a)}static rotateAllRings(e){const t=e*(c.WHEEL.SEGMENTS/12);["pitchClass","degree","chromatic","highlightPosition"].forEach(i=>{const a=n.rings[i];o.setRingAngle(i,d(a+t))})}static selectNoteDirectly(e){const t=d(-e*(Math.PI*2/12));o.setRingAngle("chromatic",t),this.announce(`Selected note ${e+1}`)}static handleTabNavigation(e){}static toggleKeyboardHelp(){let e=document.querySelector(".keyboard-help-overlay");if(e){e.remove(),this.announce("Keyboard help closed");return}e=document.createElement("div"),e.className="keyboard-help-overlay",e.innerHTML=this.generateHelpContent();const t=()=>{e.remove(),this.announce("Keyboard help closed")};e.querySelector(".keyboard-help-close").addEventListener("click",t),document.addEventListener("keydown",i=>{i.key==="Escape"&&document.querySelector(".keyboard-help-overlay")&&t()},{once:!0}),document.body.appendChild(e),e.querySelector(".keyboard-help-close").focus(),this.announce("Keyboard help opened")}static generateHelpContent(){return`
      <h2>Keyboard Shortcuts</h2>
      <div class="keyboard-help-shortcuts">
        ${Array.from(this.keyMap.entries()).filter(([i,a])=>a.description).sort(([i],[a])=>i.localeCompare(a)).map(([i,a])=>`<div class="keyboard-help-key">${i}</div>
       <div class="keyboard-help-description">${a.description}</div>`).join("")}
      </div>
      <button class="keyboard-help-close">Close (Esc)</button>
    `}static announceRingPosition(e){const t=Math.round((n.rings[e]||0)*180/Math.PI);this.announce(`${e} ring at ${t} degrees`)}static announcePlaybackState(){const e=n.playback.isPlaying?"Scale playing":"Playback stopped";this.announce(e)}static announceSidebarState(){const e=n.ui.sidebarOpen?"Settings opened":"Settings closed";this.announce(e)}static announceInstructions(){this.announce("Diatonic Compass focused. Use arrow keys to rotate rings, space to play scale, H for help.")}static announce(e,t="polite"){const i=document.createElement("div");i.setAttribute("aria-live",t),i.setAttribute("aria-atomic","true"),i.className="sr-only",i.textContent=e,i.style.position="absolute",i.style.left="-10000px",i.style.width="1px",i.style.height="1px",i.style.overflow="hidden",document.body.appendChild(i),setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},1e3)}static enable(){this.isEnabled=!0,this.announce("Keyboard navigation enabled")}static disable(){this.isEnabled=!1,this.announce("Keyboard navigation disabled")}static getShortcuts(){return Array.from(this.keyMap.entries()).map(([e,t])=>({key:e,description:t.description,action:t.action}))}}r(l,"isEnabled",!0),r(l,"keyMap",new Map),r(l,"focusedElement",null),r(l,"navigationMode","normal");export{l as KeyboardManager};
