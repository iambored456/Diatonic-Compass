// (file path: js/components/UIControls.js)
import { updateResultText } from '../core/logic.js';
import OrderManager from './OrderManager.js';

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
      orientationHorizontal: document.getElementById('orientation-horizontal'),
      orientationVertical: document.getElementById('orientation-vertical'),
      themeLight: document.getElementById('theme-light'),
      themeDark: document.getElementById('theme-dark'),
      startTutorialBtn: document.getElementById('start-tutorial-btn'),
    };
    
    this._initListeners();
    this._initBeltOrderManager();
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

    // Orientation toggle switches
    this.elements.orientationHorizontal.addEventListener('change', () => {
      if (this.elements.orientationHorizontal.checked) {
        this.callbacks.onToggleOrientation('horizontal');
      }
    });
    
    this.elements.orientationVertical.addEventListener('change', () => {
      if (this.elements.orientationVertical.checked) {
        this.callbacks.onToggleOrientation('vertical');
      }
    });

    // Theme toggle switches  
    this.elements.themeLight.addEventListener('change', () => {
      if (this.elements.themeLight.checked) {
        this.callbacks.onToggleDarkMode(false);
      }
    });
    
    this.elements.themeDark.addEventListener('change', () => {
      if (this.elements.themeDark.checked) {
        this.callbacks.onToggleDarkMode(true);
      }
    });

    this.elements.startTutorialBtn.addEventListener('click', this.callbacks.onStartTutorial);
    
    // Make entire toggle switches clickable
    const orientationToggle = document.getElementById('orientation-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    
    orientationToggle.addEventListener('click', (e) => {
      console.log('Orientation toggle clicked', e.target);
      // Always toggle, regardless of what was clicked
      const currentChecked = this.elements.orientationHorizontal.checked;
      console.log('Current orientation horizontal checked:', currentChecked);
      if (currentChecked) {
        console.log('Switching to vertical');
        this.callbacks.onToggleOrientation('vertical');
      } else {
        console.log('Switching to horizontal');
        this.callbacks.onToggleOrientation('horizontal');
      }
    });
    
    themeToggle.addEventListener('click', (e) => {
      console.log('Theme toggle clicked', e.target);
      // Always toggle, regardless of what was clicked
      const currentChecked = this.elements.themeLight.checked;
      console.log('Current theme light checked:', currentChecked);
      if (currentChecked) {
        console.log('Switching to dark mode');
        this.callbacks.onToggleDarkMode(true);
      } else {
        console.log('Switching to light mode');
        this.callbacks.onToggleDarkMode(false);
      }
    });
  }

  _initBeltOrderManager() {
    try {
      this.orderManager = new OrderManager();
      
      // Set up callback for when order changes
      this.orderManager.setOrderChangeCallback((layoutOrder, beltOrder) => {
        // Trigger a redraw or other updates if needed
        if (this.callbacks.onOrderChange) {
          this.callbacks.onOrderChange(layoutOrder, beltOrder);
        }
      });
      
    } catch (error) {
      console.warn('Order Manager failed to initialize:', error);
    }
  }

  update() {
    const { display, playback, ui, belts } = this.state;
    const { 
      resultContainer, 
      flatBtn, 
      sharpBtn, 
      resultText, 
      sidebar, 
      sidebarOverlay, 
      settingsBtn,
      orientationHorizontal,
      orientationVertical,
      themeLight,
      themeDark
    } = this.elements;

    // Accidentals buttons
    flatBtn.classList.toggle('active', display.flat);
    sharpBtn.classList.toggle('active', display.sharp);
    flatBtn.setAttribute('aria-pressed', String(display.flat));
    sharpBtn.setAttribute('aria-pressed', String(display.sharp));

    // Playback state
    resultContainer.classList.toggle('playback-active', playback.isPlaying);
    updateResultText(this.state, resultText);
    
    // Orientation toggle switches
    const isHorizontal = belts.orientation === 'horizontal';
    orientationHorizontal.checked = isHorizontal;
    orientationVertical.checked = !isHorizontal;
    
    // Theme toggle switches
    themeLight.checked = !ui.darkMode;
    themeDark.checked = ui.darkMode;

    // Sidebar state
    const isSidebarOpen = ui.sidebarOpen;
    sidebar.classList.toggle('open', isSidebarOpen);
    // Only set aria-hidden when closed - never when open as it can contain focused elements
    if (isSidebarOpen) {
      sidebar.removeAttribute('aria-hidden');
    } else {
      sidebar.setAttribute('aria-hidden', 'true');
    }
    sidebarOverlay.classList.toggle('visible', isSidebarOpen);
    settingsBtn.setAttribute('aria-expanded', String(isSidebarOpen));
    
    // Notify OrderManager of orientation changes
    if (this.orderManager && this._lastOrientation !== belts.orientation) {
      this.orderManager.onOrientationChange();
      this._lastOrientation = belts.orientation;
    }
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    if (this.orderManager) {
      this.orderManager.destroy();
      this.orderManager = null;
    }
  }
}