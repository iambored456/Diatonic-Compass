// (file path: js/accessibility/KeyboardManager.js)

import { ActionController } from '../core/ActionController.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { CONFIG } from '../core/constants.js';
import { normAngle } from '../core/math.js';
import { appState } from '../state/appState.js';

/**
 * Comprehensive keyboard navigation manager for Diatonic Compass
 * Provides full keyboard access to all interactive features
 */
export class KeyboardManager {
  static isEnabled = true;
  static keyMap = new Map();
  static focusedElement = null;
  static navigationMode = 'normal'; // 'normal', 'fine', 'help'

  /**
   * Initialize keyboard management
   */
  static init() {
    try {
      this.setupKeyMap();
      this.bindEvents();
      this.initFocusManagement();
      
      console.log('Keyboard navigation initialized');
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  }

  /**
   * Set up keyboard command mappings
   */
  static setupKeyMap() {
    // Ring navigation
    this.keyMap.set('ArrowLeft', { action: 'rotatePitchClass', direction: -1, description: 'Rotate pitch ring left' });
    this.keyMap.set('ArrowRight', { action: 'rotatePitchClass', direction: 1, description: 'Rotate pitch ring right' });
    this.keyMap.set('ArrowUp', { action: 'rotateDegree', direction: 1, description: 'Rotate degree ring up' });
    this.keyMap.set('ArrowDown', { action: 'rotateDegree', direction: -1, description: 'Rotate degree ring down' });
    
    // Chromatic ring (Shift + arrows)
    this.keyMap.set('Shift+ArrowLeft', { action: 'rotateChromatic', direction: -1, description: 'Rotate chromatic ring left' });
    this.keyMap.set('Shift+ArrowRight', { action: 'rotateChromatic', direction: 1, description: 'Rotate chromatic ring right' });
    this.keyMap.set('Shift+ArrowUp', { action: 'rotateChromatic', direction: 1, description: 'Rotate chromatic ring up' });
    this.keyMap.set('Shift+ArrowDown', { action: 'rotateChromatic', direction: -1, description: 'Rotate chromatic ring down' });

    // Quick navigation (Ctrl + arrows) - larger steps
    this.keyMap.set('Ctrl+ArrowLeft', { action: 'rotatePitchClass', direction: -3, description: 'Rotate pitch ring left (large step)' });
    this.keyMap.set('Ctrl+ArrowRight', { action: 'rotatePitchClass', direction: 3, description: 'Rotate pitch ring right (large step)' });
    this.keyMap.set('Ctrl+ArrowUp', { action: 'rotateDegree', direction: 3, description: 'Rotate degree ring up (large step)' });
    this.keyMap.set('Ctrl+ArrowDown', { action: 'rotateDegree', direction: -3, description: 'Rotate degree ring down (large step)' });

    // Audio and UI controls
    this.keyMap.set('Space', { action: 'togglePlayback', description: 'Play/pause scale' });
    this.keyMap.set('Enter', { action: 'togglePlayback', description: 'Play/pause scale' });
    this.keyMap.set('Escape', { action: 'closeSidebar', description: 'Close sidebar' });
    this.keyMap.set('Tab', { action: 'handleTabNavigation', description: 'Navigate between elements' });
    
    // Settings shortcuts
    this.keyMap.set('s', { action: 'toggleSidebar', description: 'Toggle settings sidebar' });
    this.keyMap.set('d', { action: 'toggleDarkMode', description: 'Toggle dark mode' });
    this.keyMap.set('o', { action: 'toggleOrientation', description: 'Toggle horizontal/vertical layout' });
    this.keyMap.set('h', { action: 'toggleHelp', description: 'Show/hide keyboard shortcuts' });
    
    // Accidental toggles
    this.keyMap.set('f', { action: 'toggleFlat', description: 'Toggle flat note names' });
    this.keyMap.set('F', { action: 'toggleSharp', description: 'Toggle sharp note names' });
    
    // Reset and utility
    this.keyMap.set('r', { action: 'resetRings', description: 'Reset all rings to starting position' });
    this.keyMap.set('Home', { action: 'resetRings', description: 'Reset all rings to starting position' });
    
    // Fine control mode toggle
    this.keyMap.set('Shift+f', { action: 'toggleFineMode', description: 'Toggle fine control mode' });
    
    // Number keys for direct note selection (1-12)
    for (let i = 1; i <= 12; i++) {
      this.keyMap.set(i.toString(), { 
        action: 'selectNote', 
        noteIndex: i - 1, 
        description: `Select note ${i}` 
      });
    }
  }

  /**
   * Bind keyboard event listeners
   */
  static bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent default behavior for our handled keys only when appropriate
    document.addEventListener('keydown', (e) => {
      if (this.shouldPreventDefault(e)) {
        e.preventDefault();
      }
    }, { capture: true });
  }

  /**
   * Initialize focus management
   */
  static initFocusManagement() {
    // Make the main canvas focusable
    const canvas = document.querySelector('#chromaWheel');
    if (canvas) {
      canvas.setAttribute('tabindex', '0');
      canvas.setAttribute('role', 'application');
      canvas.setAttribute('aria-label', 'Diatonic Compass wheel - use arrow keys to rotate rings, space to play scale');
      
      canvas.addEventListener('focus', () => {
        this.focusedElement = 'canvas';
        this.announceInstructions();
      });
    }

    // Set up focus indicators
    this.setupFocusIndicators();
  }

  /**
   * Set up visual focus indicators
   */
  static setupFocusIndicators() {
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle keydown events
   */
  static handleKeyDown(e) {
    try {
      if (!this.isEnabled) return;
      
      // Don't interfere with text inputs
      if (this.isTextInputActive()) return;
      
      const key = this.getKeyString(e);
      const command = this.keyMap.get(key);
      
      if (command) {
        this.executeCommand(command, e);
      }
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  }

  /**
   * Handle keyup events
   */
  static handleKeyUp(e) {
    // Currently unused but available for future enhancements
  }

  /**
   * Get key string including modifiers
   */
  static getKeyString(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    if (e.metaKey) parts.push('Meta');
    parts.push(e.key);
    return parts.join('+');
  }

  /**
   * Check if text input is currently active
   */
  static isTextInputActive() {
    const activeElement = document.activeElement;
    const textInputs = ['INPUT', 'TEXTAREA', 'SELECT'];
    return textInputs.includes(activeElement?.tagName) || 
           activeElement?.contentEditable === 'true';
  }

  /**
   * Check if we should prevent default for this key event
   */
  static shouldPreventDefault(e) {
    if (this.isTextInputActive()) return false;
    
    const key = this.getKeyString(e);
    const command = this.keyMap.get(key);
    
    // Prevent default for our handled keys, but allow normal browser behavior for others
    return !!command && !['Tab', 'Escape'].includes(e.key);
  }

  /**
   * Execute a keyboard command
   */
  static executeCommand(command, event) {
    const stepSize = this.navigationMode === 'fine' ? 0.5 : 1;
    
    switch (command.action) {
      case 'rotatePitchClass':
        this.rotateRing('pitchClass', command.direction * stepSize);
        this.announceRingPosition('pitch');
        break;
        
      case 'rotateDegree':
        this.rotateRing('degree', command.direction * stepSize);
        this.rotateRing('highlightPosition', command.direction * stepSize);
        this.announceRingPosition('degree');
        break;
        
      case 'rotateChromatic':
        this.rotateAllRings(command.direction * stepSize);
        this.announceRingPosition('chromatic');
        break;
        
      case 'selectNote':
        this.selectNoteDirectly(command.noteIndex);
        break;
        
      case 'togglePlayback':
        ActionController.togglePlayback();
        this.announcePlaybackState();
        break;
        
      case 'toggleSidebar':
        ActionController.toggleSidebar();
        this.announceSidebarState();
        break;
        
      case 'closeSidebar':
        ActionController.toggleSidebar(false);
        this.announce('Settings closed');
        break;
        
      case 'toggleDarkMode':
        ActionController.toggleDarkMode();
        this.announce(appState.ui.darkMode ? 'Dark mode enabled' : 'Light mode enabled');
        break;
        
      case 'toggleOrientation':
        const newOrientation = appState.belts.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        ActionController.setOrientation(newOrientation);
        this.announce(`Layout changed to ${newOrientation}`);
        break;
        
      case 'toggleFlat':
        ActionController.toggleAccidental('flat');
        this.announce(appState.display.flat ? 'Flat names enabled' : 'Flat names disabled');
        break;
        
      case 'toggleSharp':
        ActionController.toggleAccidental('sharp');
        this.announce(appState.display.sharp ? 'Sharp names enabled' : 'Sharp names disabled');
        break;
        
      case 'resetRings':
        ActionController.resetRings();
        this.announce('All rings reset to starting position');
        break;
        
      case 'toggleFineMode':
        this.navigationMode = this.navigationMode === 'fine' ? 'normal' : 'fine';
        this.announce(`Fine control mode ${this.navigationMode === 'fine' ? 'enabled' : 'disabled'}`);
        break;
        
      case 'toggleHelp':
        this.toggleKeyboardHelp();
        break;
        
      case 'handleTabNavigation':
        this.handleTabNavigation(event);
        break;
    }
  }

  /**
   * Rotate a specific ring by steps
   */
  static rotateRing(ringName, steps) {
    const currentAngle = appState.rings[ringName];
    const newAngle = normAngle(currentAngle + (steps * CONFIG.WHEEL.SEGMENTS / 12));
    ActionController.setRingAngle(ringName, newAngle);
  }

  /**
   * Rotate all rings together (chromatic control)
   */
  static rotateAllRings(steps) {
    const stepAngle = steps * (CONFIG.WHEEL.SEGMENTS / 12);
    ['pitchClass', 'degree', 'chromatic', 'highlightPosition'].forEach(ring => {
      const currentAngle = appState.rings[ring];
      ActionController.setRingAngle(ring, normAngle(currentAngle + stepAngle));
    });
  }

  /**
   * Select a note directly by index
   */
  static selectNoteDirectly(noteIndex) {
    const targetAngle = normAngle(-noteIndex * (Math.PI * 2 / 12));
    ActionController.setRingAngle('chromatic', targetAngle);
    this.announce(`Selected note ${noteIndex + 1}`);
  }

  /**
   * Handle tab navigation between focusable elements
   */
  static handleTabNavigation(event) {
    const focusableElements = [
      '#chromaWheel',
      '#settings-btn',
      '#result-container',
      '.accidental-toggle',
      '.sidebar-btn'
    ];
    
    // Let normal tab behavior handle this
    // We just ensure our elements are properly focusable
  }

  /**
   * Toggle keyboard help overlay
   */
  static toggleKeyboardHelp() {
    let helpOverlay = document.querySelector('.keyboard-help-overlay');
    
    if (helpOverlay) {
      helpOverlay.remove();
      this.announce('Keyboard help closed');
      return;
    }
    
    helpOverlay = document.createElement('div');
    helpOverlay.className = 'keyboard-help-overlay';
    helpOverlay.innerHTML = this.generateHelpContent();
    
    // Close on escape or click outside
    const closeHelp = () => {
      helpOverlay.remove();
      this.announce('Keyboard help closed');
    };
    
    helpOverlay.querySelector('.keyboard-help-close').addEventListener('click', closeHelp);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.querySelector('.keyboard-help-overlay')) {
        closeHelp();
      }
    }, { once: true });
    
    document.body.appendChild(helpOverlay);
    helpOverlay.querySelector('.keyboard-help-close').focus();
    this.announce('Keyboard help opened');
  }

  /**
   * Generate help content HTML
   */
  static generateHelpContent() {
    const shortcuts = Array.from(this.keyMap.entries())
      .filter(([key, command]) => command.description)
      .sort(([a], [b]) => a.localeCompare(b));
    
    const shortcutHTML = shortcuts.map(([key, command]) => 
      `<div class="keyboard-help-key">${key}</div>
       <div class="keyboard-help-description">${command.description}</div>`
    ).join('');
    
    return `
      <h2>Keyboard Shortcuts</h2>
      <div class="keyboard-help-shortcuts">
        ${shortcutHTML}
      </div>
      <button class="keyboard-help-close">Close (Esc)</button>
    `;
  }

  /**
   * Announce ring position for screen readers
   */
  static announceRingPosition(ringType) {
    // This will be enhanced with actual musical information
    const position = Math.round((appState.rings[ringType] || 0) * 180 / Math.PI);
    this.announce(`${ringType} ring at ${position} degrees`);
  }

  /**
   * Announce playback state
   */
  static announcePlaybackState() {
    const message = appState.playback.isPlaying ? 'Scale playing' : 'Playback stopped';
    this.announce(message);
  }

  /**
   * Announce sidebar state
   */
  static announceSidebarState() {
    const message = appState.ui.sidebarOpen ? 'Settings opened' : 'Settings closed';
    this.announce(message);
  }

  /**
   * Announce instructions when canvas gains focus
   */
  static announceInstructions() {
    this.announce('Diatonic Compass focused. Use arrow keys to rotate rings, space to play scale, H for help.');
  }

  /**
   * Announce message to screen readers
   */
  static announce(message, priority = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    // Add screen reader only styles
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    }, 1000);
  }

  /**
   * Enable keyboard navigation
   */
  static enable() {
    this.isEnabled = true;
    this.announce('Keyboard navigation enabled');
  }

  /**
   * Disable keyboard navigation
   */
  static disable() {
    this.isEnabled = false;
    this.announce('Keyboard navigation disabled');
  }

  /**
   * Get current keyboard shortcuts
   */
  static getShortcuts() {
    return Array.from(this.keyMap.entries()).map(([key, command]) => ({
      key,
      description: command.description,
      action: command.action
    }));
  }
}