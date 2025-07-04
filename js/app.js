// (file path: js/app.js)
import { appState } from './state/appState.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { checkCanvasSize } from './utils/canvas.js';
import { generateDisplayLabels } from './core/logic.js';
import { stepAnim } from './core/animation.js';
import { DIATONIC_DEGREE_INDICES } from './core/constants.js';
import { ActionController } from './core/ActionController.js';
import { startTutorial } from './tutorial.js'; // --- ADDED ---

import Wheel from './components/Wheel.js';
import Belts from './components/Belts.js';
import UIControls from './components/UIControls.js';

export default class App {
  constructor(container) {
    this.container = container;
    this.state = appState;

    this.elements = {
      canvas: container.querySelector('#chromaWheel'),
      beltsContainer: container.querySelector('.belts-container'),
    };

    const controlCallbacks = {
      onToggleFlat: () => ActionController.toggleAccidental('flat'),
      onToggleSharp: () => ActionController.toggleAccidental('sharp'),
      onToggleDarkMode: () => ActionController.toggleDarkMode(),
      onTogglePlayback: () => ActionController.togglePlayback(),
      onToggleSidebar: (state) => ActionController.toggleSidebar(state),
      onToggleOrientation: () => ActionController.setOrientation(
          this.state.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal'
      ),
      onStartTutorial: startTutorial, // --- ADDED ---
    };

    this.wheel = new Wheel(this.elements.canvas, this.state, this.onInteractionEnd.bind(this));
    this.belts = new Belts(this.elements.beltsContainer, this.state, this.onInteractionEnd.bind(this));
    this.uiControls = new UIControls(container, this.state, controlCallbacks);
    
    this._setupResponsiveLogic();

    makeRenderLoop(this.redraw.bind(this));
  }
  
  onInteractionEnd() {
    // This hook remains for any post-animation logic if needed.
  }

  _setupResponsiveLogic() {
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const handleResize = () => {
        const isWide = window.innerWidth > window.innerHeight;
        const newOrientation = isWide ? 'vertical' : 'horizontal';
        
        if (this.state.belts.orientation !== newOrientation) {
          ActionController.setOrientation(newOrientation);
        } else {
          this.redraw(performance.now());
        }
    };

    window.addEventListener('resize', debounce(handleResize, 50));
    handleResize();
  }

  redraw(time) {
    stepAnim(time);
    checkCanvasSize(this.elements.canvas, this.state.dimensions);
    
    if (!this.state.dimensions.size) return;

    const { rings, playback } = this.state;
    const labels = generateDisplayLabels(this.state);
    const highlightPattern = DIATONIC_DEGREE_INDICES;
  
    this.wheel.update(rings, labels, playback);
    this.belts.update(labels, highlightPattern);
    this.uiControls.update();
  }
}