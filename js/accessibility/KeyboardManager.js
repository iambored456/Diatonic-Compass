// (file path: js/accessibility/KeyboardManager.js)

import { ActionController } from '../core/ActionController.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { CONFIG, DIATONIC_DEGREE_INDICES, MAJOR_SCALE_INTERVAL_STEPS, ANGLE_STEP } from '../core/constants.js';
import { normAngle } from '../core/math.js';
import { appState } from '../state/appState.js';
import { snapRing, snapDegreeToDiatonic, snapChromaticAndSettleMode, startSnap } from '../core/animation.js';
import { setRingAngle } from '../core/actions.js';
import { indexAtTop } from '../core/math.js';

/**
 * Comprehensive keyboard navigation manager for Diatonic Compass
 * Provides full keyboard access to all interactive features
 */
export class KeyboardManager {
  static isEnabled = true;
  static keyMap = new Map();
  static activeRing = 'pitch'; // Track which ring is active for keyboard control
  static navigationMode = 'normal'; // 'normal', 'fine', 'help'

  /**
   * Set the currently active ring for keyboard control
   */
  static setActiveRing(ringType) {
    this.activeRing = ringType;
    // Highlights removed - no visual indication needed
  }


  /**
   * Initialize keyboard management
   */
  static init() {
    try {
      this.setupKeyMap();
      this.bindEvents();
      this.initFocusManagement();
      
      // Don't show ring highlighting by default - only when keyboard is actually used
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
    this.keyMap.set(' ', { action: 'togglePlayback', description: 'Play/pause scale (Space)' });
    this.keyMap.set('Enter', { action: 'togglePlayback', description: 'Play/pause scale' });
    this.keyMap.set('Escape', { action: 'closeSidebar', description: 'Close sidebar' });
    
    // Settings shortcuts - match sidebar documentation
    this.keyMap.set('F1', { action: 'toggleSidebar', description: 'Open/close settings' });
    this.keyMap.set('v', { action: 'toggleOrientation', description: 'Toggle vertical/horizontal layout' });
    this.keyMap.set('V', { action: 'toggleOrientation', description: 'Toggle vertical/horizontal layout' });
    this.keyMap.set('d', { action: 'toggleDarkMode', description: 'Toggle dark mode' });
    this.keyMap.set('h', { action: 'toggleHelp', description: 'Show/hide keyboard shortcuts' });
    
    // Accidental toggles - match sidebar documentation  
    this.keyMap.set('f', { action: 'toggleFlat', description: 'Toggle flat note names' });
    this.keyMap.set('F', { action: 'toggleFlat', description: 'Toggle flat note names' });
    this.keyMap.set('s', { action: 'toggleSharp', description: 'Toggle sharp note names' });
    this.keyMap.set('S', { action: 'toggleSharp', description: 'Toggle sharp note names' });
    
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
    // Set up focus indicators (just for keyboard help overlay)
    this.setupFocusIndicators();
  }

  /**
   * Set up visual focus indicators
   */
  static setupFocusIndicators() {
    const style = document.createElement('style');
    style.textContent = `
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
      console.log('=== KeyboardManager.handleKeyDown ===');
      console.log('Key pressed:', e.key);
      console.log('isEnabled:', this.isEnabled);

      if (!this.isEnabled) {
        console.log('Keyboard manager disabled, returning');
        return;
      }

      // Don't interfere with text inputs
      const isTextInput = this.isTextInputActive();
      console.log('isTextInputActive:', isTextInput);
      if (isTextInput) {
        console.log('Text input active, returning');
        return;
      }

      const key = this.getKeyString(e);
      console.log('Key string with modifiers:', key);

      const command = this.keyMap.get(key);
      console.log('Command found:', command);

      if (command) {
        console.log('Executing command:', command.action);
        this.executeCommand(command, e);
      } else {
        console.log('No command mapped for key:', key);
      }
    } catch (error) {
      console.error('Error in handleKeyDown:', error);
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
    console.log('=== shouldPreventDefault ===');
    console.log('Key:', e.key);

    if (this.isTextInputActive()) {
      console.log('Text input active, not preventing default');
      return false;
    }

    const key = this.getKeyString(e);
    const command = this.keyMap.get(key);

    const shouldPrevent = !!command && !['Escape'].includes(e.key);
    console.log('Command found:', !!command);
    console.log('Should prevent default:', shouldPrevent);

    // Prevent default for our handled keys, but allow normal browser behavior for others
    return shouldPrevent;
  }

  /**
   * Execute a keyboard command
   */
  static executeCommand(command, event) {
    const stepSize = this.navigationMode === 'fine' ? 0.5 : 1;

    switch (command.action) {
      case 'rotatePitchClass':
        this.setActiveRing('pitch');
        this.rotateRingAndSnap('pitchClass', command.direction * stepSize);
        this.announceRingPosition('pitch');
        break;

      case 'rotateDegree':
        this.setActiveRing('degree');
        this.rotateRingAndSnap('degree', command.direction * stepSize);
        this.announceRingPosition('degree');
        break;

      case 'rotateChromatic':
        this.setActiveRing('chromatic');
        this.rotateAllRingsAndSnap(command.direction * stepSize);
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
        
    }
  }

  /**
   * Rotate a specific ring by steps and snap to nearest position
   */
  static rotateRingAndSnap(ringName, steps) {
    if (ringName === 'degree') {
      // For degree ring, jump to next/previous diatonic degree with animation
      this.rotateDegreeRingDiatonically(steps);
    } else if (ringName === 'pitchClass') {
      // For pitch class ring, move by semitone steps with animation
      const stepAngle = steps * (Math.PI * 2 / 12);
      const currentAngle = appState.rings.pitchClass;
      const targetAngle = normAngle(currentAngle + stepAngle);

      // Calculate the snapped target (nearest semitone)
      const targetIndex = Math.round(-targetAngle / ANGLE_STEP);
      const snappedTarget = normAngle(-targetIndex * ANGLE_STEP);

      // Animate to the snapped position
      startSnap({
        pitchClass: snappedTarget
      });
    }
  }

  /**
   * Rotate the degree ring to the next/previous diatonic degree
   * Follows the major scale interval pattern: +2, +2, +1, +2, +2, +2, +1
   */
  static rotateDegreeRingDiatonically(steps) {
    const { degree, chromatic } = appState.rings;
    const effectiveDegreeRotation = normAngle(degree - chromatic);

    // Find current diatonic degree index (0-6)
    const currentRelativeIndexFloat = normAngle(-effectiveDegreeRotation) / ANGLE_STEP;

    // Find the closest current diatonic index
    let currentDiatonicIndex = 0;
    let minDiff = Infinity;

    DIATONIC_DEGREE_INDICES.forEach((validIndex, i) => {
      const diff = Math.abs(currentRelativeIndexFloat - validIndex);
      const circularDiff = Math.min(diff, 12 - diff);

      if (circularDiff < minDiff) {
        minDiff = circularDiff;
        currentDiatonicIndex = i; // Store the index in DIATONIC_DEGREE_INDICES array (0-6)
      }
    });

    // Move to next/previous diatonic degree based on direction
    const direction = steps > 0 ? 1 : -1;
    const targetDiatonicIndex = (currentDiatonicIndex + direction + 7) % 7;
    const targetSemitoneIndex = DIATONIC_DEGREE_INDICES[targetDiatonicIndex];

    // Calculate target angle
    const targetEffectiveRotation = normAngle(-targetSemitoneIndex * ANGLE_STEP);
    const targetDegree = normAngle(targetEffectiveRotation + chromatic);

    // Animate to the target position
    startSnap({
      degree: targetDegree,
      highlightPosition: targetDegree
    });
  }

  /**
   * Rotate all rings together (chromatic control) and snap
   */
  static rotateAllRingsAndSnap(steps) {
    const stepAngle = steps * (Math.PI * 2 / 12);

    // Calculate target angles for all rings
    const targetPitchClass = normAngle(appState.rings.pitchClass + stepAngle);
    const targetDegree = normAngle(appState.rings.degree + stepAngle);
    const targetChromatic = normAngle(appState.rings.chromatic + stepAngle);

    // Calculate snapped chromatic position
    const chromIdx = Math.round(-targetChromatic / ANGLE_STEP);
    const snappedChromatic = normAngle(-chromIdx * ANGLE_STEP);

    // Calculate how much the chromatic ring needs to snap
    const snapDelta = snappedChromatic - targetChromatic;

    // Apply the snap delta to pitch and degree rings too
    const snappedPitchClass = normAngle(targetPitchClass + snapDelta);
    const snappedDegree = normAngle(targetDegree + snapDelta);

    // Animate all rings to their snapped positions
    startSnap({
      pitchClass: snappedPitchClass,
      degree: snappedDegree,
      chromatic: snappedChromatic,
      highlightPosition: snappedDegree
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