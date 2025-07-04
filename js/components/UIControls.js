// (file path: js/components/UIControls.js)
import { updateResultText } from '../core/logic.js';

export default class UIControls {
  constructor(container, state, callbacks) {
    this.state = state;
    this.callbacks = callbacks; // { onToggleSharp, onToggleFlat, onTogglePlayback, ..., onStartTutorial }

    // Find all control elements
    this.elements = {
      resultContainer: container.querySelector('#result-container'),
      resultText: container.querySelector('#result-text'),
      flatBtn: document.getElementById('flat-btn'),
      sharpBtn: document.getElementById('sharp-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      sidebar: document.getElementById('sidebar'),
      sidebarOverlay: document.getElementById('sidebar-overlay'),
      toggleOrientationBtn: document.getElementById('toggle-orientation-btn'),
      toggleDarkModeBtn: document.getElementById('toggle-dark-mode-btn'),
      startTutorialBtn: document.getElementById('start-tutorial-btn'), // --- ADDED ---
    };
    
    this._initListeners();
  }

  _initListeners() {
    this.elements.flatBtn.addEventListener('click', this.callbacks.onToggleFlat);
    this.elements.sharpBtn.addEventListener('click', this.callbacks.onToggleSharp);
    
    this.elements.resultContainer.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.callbacks.onTogglePlayback();
    });

    this.elements.settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onToggleSidebar();
    });
    
    this.elements.sidebarOverlay.addEventListener('click', () => {
        if(this.state.ui.sidebarOpen) {
            this.callbacks.onToggleSidebar(false);
        }
    });

    this.elements.toggleOrientationBtn.addEventListener('click', this.callbacks.onToggleOrientation);
    this.elements.toggleDarkModeBtn.addEventListener('click', this.callbacks.onToggleDarkMode);
    this.elements.startTutorialBtn.addEventListener('click', this.callbacks.onStartTutorial); // --- ADDED ---
  }

  update() {
    const { display, playback, ui, belts } = this.state;
    const { resultContainer, flatBtn, sharpBtn, resultText, sidebar, sidebarOverlay, settingsBtn, toggleOrientationBtn, toggleDarkModeBtn } = this.elements;

    flatBtn.classList.toggle('active', display.flat);
    sharpBtn.classList.toggle('active', display.sharp);
    flatBtn.setAttribute('aria-pressed', String(display.flat));
    sharpBtn.setAttribute('aria-pressed', String(display.sharp));

    resultContainer.classList.toggle('playback-active', playback.isPlaying);
    updateResultText(this.state, resultText);
    
    const currentOrientation = belts.orientation;
    const targetOrientation = currentOrientation === 'horizontal' ? 'Vertical' : 'Horizontal';
    if (toggleOrientationBtn.textContent !== targetOrientation) {
        toggleOrientationBtn.textContent = targetOrientation;
    }
    
    const themeText = ui.darkMode ? 'Light Mode' : 'Dark Mode';
    if (toggleDarkModeBtn.textContent !== themeText) {
        toggleDarkModeBtn.textContent = themeText;
    }

    const isSidebarOpen = ui.sidebarOpen;
    sidebar.classList.toggle('open', isSidebarOpen);
    sidebar.setAttribute('aria-hidden', String(!isSidebarOpen));
    sidebarOverlay.classList.toggle('visible', isSidebarOpen);
    settingsBtn.setAttribute('aria-expanded', String(isSidebarOpen));

    if (!isSidebarOpen) {
        if (document.activeElement === this.elements.toggleOrientationBtn) {
            settingsBtn.focus();
        }
    }
  }
}