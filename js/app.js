// (file path: js/app.js)

import { appState } from './state/appState.js';
import { makeRenderLoop } from './core/renderLoop.js';
import { checkCanvasSize } from './utils/canvas.js';
import { generateDisplayLabels } from './core/logic.js';
import { stepAnim } from './core/animation.js';
import { DIATONIC_DEGREE_INDICES } from './core/constants.js';
import { startPlayback, stopPlayback } from './playback.js';

import Wheel from './components/Wheel.js';
import Belts from './components/Belts.js';
import UIControls from './components/UIControls.js';

export default class App {
  constructor(container) {
    console.log("Diatonic Compass Initializing...");
    this.container = container;
    this.state = appState;

    this.elements = {
      canvas: container.querySelector('#chromaWheel'),
      beltsContainer: container.querySelector('.belts-container'),
    };

    // Define callbacks to pass to the UIControls component
    const controlCallbacks = {
      onToggleFlat: this.handleAccidentalToggle.bind(this, 'flat'),
      onToggleSharp: this.handleAccidentalToggle.bind(this, 'sharp'),
      onTogglePlayback: this.handleTogglePlayback.bind(this),
      onToggleSidebar: this.handleToggleSidebar.bind(this),
      onToggleOrientation: this.handleToggleOrientation.bind(this),
    };

    // Initialize all components
    this.wheel = new Wheel(this.elements.canvas, this.state, this.onInteractionEnd.bind(this));
    this.belts = new Belts(this.elements.beltsContainer, this.state, this.onInteractionEnd.bind(this));
    this.uiControls = new UIControls(container, this.state, controlCallbacks);

    makeRenderLoop(this.redraw.bind(this));
  }
  
  // --- Callback Handlers for State Changes ---

  onInteractionEnd() {
    // This is now just a hook. The text update is handled in UIControls.
  }
  
  handleAccidentalToggle(type) {
    this.state.display[type] = !this.state.display[type];
    // Ensure at least one accidental is always active
    if (!this.state.display.sharp && !this.state.display.flat) {
      const otherType = type === 'sharp' ? 'flat' : 'sharp';
      this.state.display[otherType] = true;
    }
  }

  handleTogglePlayback() {
    if (this.state.playback.isPlaying) {
      stopPlayback();
    } else if (!this.state.drag.active && !this.state.animation) {
      startPlayback();
    }
  }
  
  handleToggleSidebar(forceState) {
    this.state.ui.sidebarOpen = typeof forceState === 'boolean' ? forceState : !this.state.ui.sidebarOpen;
  }
  
  handleToggleOrientation() {
    const newOrientation = this.state.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    this.state.belts.orientation = newOrientation;
    
    // Reset state for the change
    this.state.rings.pitchClass = 0;
    this.state.rings.degree = 0;
    this.state.rings.chromatic = 0;
    this.state.rings.highlightPosition = 0;
    this.state.belts.init = false;
    
    this.container.classList.toggle('vertical-layout', newOrientation === 'vertical');
    this.handleToggleSidebar(false); // Always close sidebar after toggling
  }

  // --- Main Render Loop ---

  redraw(time) {
    stepAnim(time); // Advance animation if active

    const canvasResized = checkCanvasSize(this.elements.canvas, this.state.dimensions);
    if (canvasResized) {
      this.state.belts.init = false;
    }
    
    if (!this.state.dimensions.size) return;

    const { rings, playback } = this.state;
    const labels = generateDisplayLabels(this.state);
    const highlightPattern = DIATONIC_DEGREE_INDICES;
  
    // Update all components with the latest state
    this.wheel.update(rings, labels, playback);
    this.belts.update(labels, highlightPattern);
    this.uiControls.update();
  }
}