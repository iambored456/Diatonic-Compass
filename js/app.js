// (file path: js/app.js)
import { appState } from './state/appState.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { checkCanvasSize } from './utils/canvas.js';
import { generateDisplayLabels } from './core/logic.js';
import { stepAnim } from './core/animation.js';
import { DIATONIC_DEGREE_INDICES } from './core/constants.js';

// Import the ActionController
import { ActionController } from './core/ActionController.js';

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
      // This is now handled by the responsive logic, but we can leave it for the button
      onToggleOrientation: () => ActionController.setOrientation(
          this.state.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal'
      ),
    };

    // Initialize all components
    this.wheel = new Wheel(this.elements.canvas, this.state, this.onInteractionEnd.bind(this));
    this.belts = new Belts(this.elements.beltsContainer, this.state, this.onInteractionEnd.bind(this));
    this.uiControls = new UIControls(container, this.state, controlCallbacks);
    
    // Call the setup method
    this._setupResponsiveLogic();

    makeRenderLoop(this.redraw.bind(this));
  }
  
  onInteractionEnd() {
    // This hook remains for any post-animation logic if needed.
  }

  _setupResponsiveLogic() {
    // Debounce function to limit how often the resize logic runs
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // The core logic to check orientation
    const handleResize = () => {
        const isWide = window.innerWidth > window.innerHeight;
        const newOrientation = isWide ? 'vertical' : 'horizontal';
        
        // Use the existing action to change orientation
        if (this.state.belts.orientation !== newOrientation) {
          ActionController.setOrientation(newOrientation);
        } else {
          // Even if orientation doesn't change, we might need to resize the canvas
          this.redraw(performance.now());
        }
    };

    // Listen for window resize events
    window.addEventListener('resize', debounce(handleResize, 50)); // Lowered delay for smoother resizing feel
    
    // Run once on initial load
    handleResize();
  }

  redraw(time) {
    stepAnim(time);

    // **IMPROVEMENT**: We just check the canvas size. We no longer reset the belts here.
    // The `belts.init` flag is now correctly handled by `ActionController.setOrientation`.
    checkCanvasSize(this.elements.canvas, this.state.dimensions);
    
    if (!this.state.dimensions.size) return;

    const { rings, playback } = this.state;
    const labels = generateDisplayLabels(this.state);
    const highlightPattern = DIATONIC_DEGREE_INDICES;
  
    // Update all components
    this.wheel.update(rings, labels, playback);
    this.belts.update(labels, highlightPattern);
    this.uiControls.update();
  }
}