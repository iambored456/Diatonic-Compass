// (file path: js/components/UIControls.js)
import { updateResultText } from '../core/logic.js';

export default class UIControls {
  constructor(container, state, callbacks) {
    this.state = state;
    this.callbacks = callbacks; // { onToggleSharp, onToggleFlat, onTogglePlayback, ... }

    // Find all control elements
    this.elements = {
      resultContainer: container.querySelector('#result-container'),
      resultText: container.querySelector('#result-text'),
      // UPDATED: Select these via document since they are outside the container
      flatBtn: document.getElementById('flat-btn'),
      sharpBtn: document.getElementById('sharp-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      sidebar: document.getElementById('sidebar'),
      sidebarOverlay: document.getElementById('sidebar-overlay'),
      toggleOrientationBtn: document.getElementById('toggle-orientation-btn'),
    };
    
    this._initListeners();
  }

  _initListeners() {
    this.elements.flatBtn.addEventListener('click', this.callbacks.onToggleFlat);
    this.elements.sharpBtn.addEventListener('click', this.callbacks.onToggleSharp);
    
    // The result container itself acts as the play/stop button
    this.elements.resultContainer.addEventListener('click', (e) => {
        // Prevent button clicks from triggering playback (this logic is now redundant but harmless)
        if (e.target.closest('button')) return;
        this.callbacks.onTogglePlayback();
    });

    this.elements.settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onToggleSidebar();
    });
    
    this.elements.sidebarOverlay.addEventListener('click', () => {
        if(this.state.ui.sidebarOpen) {
            this.callbacks.onToggleSidebar(false); // Explicitly close
        }
    });

    this.elements.toggleOrientationBtn.addEventListener('click', this.callbacks.onToggleOrientation);
  }

  update() {
    const { display, playback, ui, belts } = this.state;
    const { resultContainer, flatBtn, sharpBtn, resultText, sidebar, sidebarOverlay, settingsBtn, toggleOrientationBtn } = this.elements;

    // Update accidental buttons (this logic remains the same)
    flatBtn.classList.toggle('active', display.flat);
    sharpBtn.classList.toggle('active', display.sharp);
    flatBtn.setAttribute('aria-pressed', String(display.flat));
    sharpBtn.setAttribute('aria-pressed', String(display.sharp));

    // Update playback indicator
    resultContainer.classList.toggle('playback-active', playback.isPlaying);

    // Update result text
    updateResultText(this.state, resultText);
    
    // Update the orientation toggle button text
    const currentOrientation = belts.orientation;
    const targetOrientation = currentOrientation === 'horizontal' ? 'Vertical' : 'Horizontal';
    if (toggleOrientationBtn.textContent !== targetOrientation) {
        toggleOrientationBtn.textContent = targetOrientation;
    }
    
    // Update sidebar visibility
    const isSidebarOpen = ui.sidebarOpen;
    sidebar.classList.toggle('open', isSidebarOpen);
    sidebar.setAttribute('aria-hidden', String(!isSidebarOpen));
    sidebarOverlay.classList.toggle('visible', isSidebarOpen);
    settingsBtn.setAttribute('aria-expanded', String(isSidebarOpen));

    if (!isSidebarOpen) {
        // Ensure focus is managed correctly when closing
        if (document.activeElement === this.elements.toggleOrientationBtn) {
            settingsBtn.focus();
        }
    }
  }
}