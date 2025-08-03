// (file path: js/accessibility/ScreenReaderManager.js)

import { appState } from '../state/appState.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { CONFIG } from '../core/constants.js';
import { generateDisplayLabels, getMusicalInfo } from '../core/logic.js';
import { CHROMATIC_NOTES, DIATONIC_INTERVALS, MODE_NAME } from '../core/constants.js';

/**
 * Screen reader support manager for Diatonic Compass
 * Provides rich musical context and state announcements
 */
export class ScreenReaderManager {
  static isEnabled = true;
  static lastAnnouncedState = null;
  static announcementQueue = [];
  static isProcessingQueue = false;

  /**
   * Initialize screen reader support
   */
  static init() {
    try {
      this.setupLiveRegions();
      this.enhanceExistingElements();
      this.setupStateMonitoring();
      
      console.log('Screen reader support initialized');
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  }

  /**
   * Set up ARIA live regions for announcements
   */
  static setupLiveRegions() {
    // Create main announcement region
    const mainRegion = document.createElement('div');
    mainRegion.id = 'sr-main-announcements';
    mainRegion.setAttribute('aria-live', 'polite');
    mainRegion.setAttribute('aria-atomic', 'false');
    mainRegion.className = 'sr-only';
    this.applySROnlyStyles(mainRegion);
    document.body.appendChild(mainRegion);

    // Create urgent announcement region
    const urgentRegion = document.createElement('div');
    urgentRegion.id = 'sr-urgent-announcements';
    urgentRegion.setAttribute('aria-live', 'assertive');
    urgentRegion.setAttribute('aria-atomic', 'true');
    urgentRegion.className = 'sr-only';
    this.applySROnlyStyles(urgentRegion);
    document.body.appendChild(urgentRegion);

    // Create status region for current musical information
    const statusRegion = document.createElement('div');
    statusRegion.id = 'sr-musical-status';
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.className = 'sr-only';
    this.applySROnlyStyles(statusRegion);
    document.body.appendChild(statusRegion);
  }

  /**
   * Apply screen reader only styles
   */
  static applySROnlyStyles(element) {
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';
    element.style.clip = 'rect(1px, 1px, 1px, 1px)';
    element.style.whiteSpace = 'nowrap';
  }

  /**
   * Enhance existing elements with better ARIA attributes
   */
  static enhanceExistingElements() {
    // Enhance the main canvas
    const canvas = document.querySelector('#chromaWheel');
    if (canvas) {
      canvas.setAttribute('role', 'application');
      canvas.setAttribute('aria-label', 'Interactive Diatonic Compass');
      canvas.setAttribute('aria-describedby', 'sr-canvas-description');
      
      // Add detailed description
      const description = document.createElement('div');
      description.id = 'sr-canvas-description';
      description.className = 'sr-only';
      description.textContent = 'A circular interface with three concentric rings representing pitch classes, scale degrees, and chromatic positions. Use arrow keys to rotate rings and explore different musical keys and modes.';
      this.applySROnlyStyles(description);
      document.body.appendChild(description);
    }

    // Enhance result container
    const resultContainer = document.querySelector('#result-container');
    if (resultContainer) {
      resultContainer.setAttribute('role', 'status');
      resultContainer.setAttribute('aria-label', 'Current musical key and mode');
      resultContainer.setAttribute('aria-describedby', 'sr-result-description');
      
      const resultDesc = document.createElement('div');
      resultDesc.id = 'sr-result-description';
      resultDesc.className = 'sr-only';
      resultDesc.textContent = 'Shows the current musical key and mode. Click to play the scale.';
      this.applySROnlyStyles(resultDesc);
      document.body.appendChild(resultDesc);
    }

    // Enhance belts
    this.enhanceBelts();

    // Enhance controls
    this.enhanceControls();
  }

  /**
   * Enhance belt elements with accessibility
   */
  static enhanceBelts() {
    const belts = [
      { selector: '#pitchBelt', name: 'Pitch Class Belt', description: 'Shows note names (C, D, E, etc.)' },
      { selector: '#degreeBelt', name: 'Scale Degree Belt', description: 'Shows scale degrees (1, 2, 3, etc.)' },
      { selector: '#chromaticBelt', name: 'Chromatic Belt', description: 'Shows chromatic positions (0-11)' }
    ];

    belts.forEach(belt => {
      const element = document.querySelector(belt.selector);
      if (element) {
        element.setAttribute('role', 'listbox');
        element.setAttribute('aria-label', belt.name);
        element.setAttribute('aria-description', belt.description);
        element.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Enhance control elements
   */
  static enhanceControls() {
    // Enhance accidental toggles
    const flatBtn = document.querySelector('#flat-btn');
    const sharpBtn = document.querySelector('#sharp-btn');
    
    if (flatBtn) {
      flatBtn.setAttribute('aria-describedby', 'sr-flat-description');
      const desc = document.createElement('span');
      desc.id = 'sr-flat-description';
      desc.className = 'sr-only';
      desc.textContent = 'Toggle display of flat note names like D-flat, E-flat';
      this.applySROnlyStyles(desc);
      flatBtn.parentNode.appendChild(desc);
    }

    if (sharpBtn) {
      sharpBtn.setAttribute('aria-describedby', 'sr-sharp-description');
      const desc = document.createElement('span');
      desc.id = 'sr-sharp-description';
      desc.className = 'sr-only';
      desc.textContent = 'Toggle display of sharp note names like C-sharp, F-sharp';
      this.applySROnlyStyles(desc);
      sharpBtn.parentNode.appendChild(desc);
    }

    // Enhance sidebar button
    const settingsBtn = document.querySelector('#settings-btn');
    if (settingsBtn) {
      settingsBtn.setAttribute('aria-describedby', 'sr-settings-description');
      const desc = document.createElement('span');
      desc.id = 'sr-settings-description';
      desc.className = 'sr-only';
      desc.textContent = 'Open settings panel to change display options, theme, and layout';
      this.applySROnlyStyles(desc);
      settingsBtn.parentNode.appendChild(desc);
    }
  }

  /**
   * Set up monitoring for state changes
   */
  static setupStateMonitoring() {
    // Monitor state changes and announce important ones
    setInterval(() => {
      if (this.shouldAnnounceStateChange()) {
        this.announceCurrentState();
      }
    }, 1000); // Check every second, but don't spam
  }

  /**
   * Check if state change should be announced
   */
  static shouldAnnounceStateChange() {
    if (!this.isEnabled) return false;
    
    const currentState = this.getCurrentMusicalState();
    const hasChanged = JSON.stringify(currentState) !== JSON.stringify(this.lastAnnouncedState);
    
    // Only announce if there's been a significant change and no drag is active
    return hasChanged && !appState.drag.active && !appState.animation;
  }

  /**
   * Get current musical state for comparison
   */
  static getCurrentMusicalState() {
    try {
      const musicalInfo = getMusicalInfo(appState);
      return {
        pitch: musicalInfo?.pitch,
        mode: musicalInfo?.modeName,
        isPlaying: appState.playback.isPlaying
      };
    } catch (error) {
      return {
        pitch: 'Unknown',
        mode: 'Unknown',
        isPlaying: false
      };
    }
  }

  /**
   * Announce current musical state
   */
  static announceCurrentState() {
    try {
      const musicalInfo = getMusicalInfo(appState);
      if (!musicalInfo) return;

      const message = `${musicalInfo.pitch} ${musicalInfo.modeName}`;
      this.announceToRegion(message, 'sr-musical-status');
      
      this.lastAnnouncedState = this.getCurrentMusicalState();
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  }

  /**
   * Announce specific musical information
   */
  static announceMusicalChange(changeType, details = {}) {
    try {
      let message = '';
      
      switch (changeType) {
        case 'key-change':
          message = `Key changed to ${details.key} ${details.mode}`;
          break;
          
        case 'mode-change':
          message = `Mode changed to ${details.mode}`;
          break;
          
        case 'note-change':
          message = `Root note changed to ${details.note}`;
          break;
          
        case 'playback-start':
          message = `Playing ${details.key} ${details.mode} scale`;
          break;
          
        case 'playback-stop':
          message = 'Playback stopped';
          break;
          
        case 'playback-note':
          message = `Playing ${details.note}`;
          break;
          
        default:
          message = details.message || 'Musical state changed';
      }
      
      this.queueAnnouncement(message);
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  }

  /**
   * Announce interaction guidance
   */
  static announceInteractionStart(interactionType) {
    const messages = {
      'wheel-drag': 'Dragging wheel ring. Move to change musical key.',
      'belt-drag': 'Dragging belt. Move to change scale degrees.',
      'chromatic-drag': 'Dragging chromatic ring. Move to change perspective.',
      'playback-start': 'Scale playback started.',
      'settings-open': 'Settings panel opened.',
      'tutorial-start': 'Tutorial started. Follow the instructions to learn the interface.'
    };
    
    const message = messages[interactionType];
    if (message) {
      this.queueAnnouncement(message, 'polite');
    }
  }

  /**
   * Provide detailed musical context
   */
  static announceMusicalContext(includeTheory = false) {
    try {
      const musicalInfo = getMusicalInfo(appState);
      if (!musicalInfo) return;

      let message = `Current key: ${musicalInfo.pitch} ${musicalInfo.modeName}`;
      
      if (includeTheory) {
        const scaleNotes = this.getScaleNotes(musicalInfo);
        if (scaleNotes.length > 0) {
          message += `. Scale notes: ${scaleNotes.join(', ')}`;
        }
        
        const modeDescription = this.getModeDescription(musicalInfo.modeName);
        if (modeDescription) {
          message += `. ${modeDescription}`;
        }
      }
      
      this.queueAnnouncement(message, 'polite');
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  }

  /**
   * Get scale notes for current key
   */
  static getScaleNotes(musicalInfo) {
    try {
      // This would use the same logic as the playback system
      // to get the actual scale notes
      const labels = generateDisplayLabels(appState);
      // Simplified - in a full implementation, this would calculate the actual scale
      return []; // Placeholder
    } catch (error) {
      return [];
    }
  }

  /**
   * Get description of musical mode
   */
  static getModeDescription(modeName) {
    const descriptions = {
      'Major': 'A bright, happy sounding mode',
      'Minor': 'A darker, more melancholic mode',
      'Dorian': 'A minor mode with a raised 6th degree',
      'Phrygian': 'A minor mode with a lowered 2nd degree',
      'Lydian': 'A major mode with a raised 4th degree',
      'Mixolydian': 'A major mode with a lowered 7th degree',
      'Locrian': 'A diminished mode, rarely used in practice'
    };
    
    return descriptions[modeName] || '';
  }

  /**
   * Announce UI state changes
   */
  static announceUIChange(changeType, details = {}) {
    const messages = {
      'orientation-change': `Layout changed to ${details.orientation}`,
      'theme-change': `Theme changed to ${details.theme} mode`,
      'accidental-change': `${details.accidentalType} names ${details.enabled ? 'enabled' : 'disabled'}`,
      'sidebar-toggle': `Settings ${details.open ? 'opened' : 'closed'}`,
      'focus-change': `Focus moved to ${details.element}`
    };
    
    const message = messages[changeType] || details.message;
    if (message) {
      this.queueAnnouncement(message);
    }
  }

  /**
   * Queue announcement to prevent overwhelming screen readers
   */
  static queueAnnouncement(message, priority = 'polite') {
    this.announcementQueue.push({ message, priority, timestamp: Date.now() });
    
    if (!this.isProcessingQueue) {
      this.processAnnouncementQueue();
    }
  }

  /**
   * Process announcement queue with rate limiting
   */
  static async processAnnouncementQueue() {
    this.isProcessingQueue = true;
    
    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift();
      
      // Skip outdated announcements (older than 5 seconds)
      if (Date.now() - announcement.timestamp > 5000) {
        continue;
      }
      
      this.announceToRegion(announcement.message, 
        announcement.priority === 'assertive' ? 'sr-urgent-announcements' : 'sr-main-announcements'
      );
      
      // Rate limit: wait between announcements to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Announce message to specific ARIA live region
   */
  static announceToRegion(message, regionId) {
    try {
      const region = document.getElementById(regionId);
      if (!region || !message) return;

      // Clear previous content after a short delay to ensure it's read
      region.textContent = '';
      
      requestAnimationFrame(() => {
        region.textContent = message;
      });
      
      // Clear after reading to prevent re-reading on focus
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, 2000);
      
    } catch (error) {
      ErrorHandler.handle(error, CONFIG.ERROR_HANDLING.CONTEXTS.UI);
    }
  }

  /**
   * Announce tutorial steps
   */
  static announceTutorialStep(stepNumber, instruction, hint = '') {
    const message = `Tutorial step ${stepNumber}. ${instruction}${hint ? '. Hint: ' + hint : ''}`;
    this.queueAnnouncement(message, 'assertive');
  }

  /**
   * Announce validation messages
   */
  static announceValidation(type, message) {
    const priority = type === 'error' ? 'assertive' : 'polite';
    this.queueAnnouncement(message, priority);
  }

  /**
   * Provide help and instructions
   */
  static announceHelp(topic = 'general') {
    const helpMessages = {
      general: 'Use arrow keys to rotate rings, space to play scale, S for settings, H for keyboard shortcuts help.',
      navigation: 'Arrow keys rotate rings. Shift plus arrows for chromatic ring. Control plus arrows for large steps.',
      playback: 'Press space or enter to play the current scale. Escape to stop playback.',
      settings: 'Press S to open settings. Use tab to navigate options. Escape to close.',
      keyboard: 'Press H to see all keyboard shortcuts. Use tab to navigate between interface elements.'
    };
    
    const message = helpMessages[topic] || helpMessages.general;
    this.queueAnnouncement(message, 'polite');
  }

  /**
   * Enable screen reader support
   */
  static enable() {
    this.isEnabled = true;
    this.queueAnnouncement('Screen reader support enabled');
  }

  /**
   * Disable screen reader support
   */
  static disable() {
    this.isEnabled = false;
    this.queueAnnouncement('Screen reader support disabled');
  }

  /**
   * Emergency announcement (highest priority)
   */
  static emergencyAnnounce(message) {
    const urgentRegion = document.getElementById('sr-urgent-announcements');
    if (urgentRegion) {
      urgentRegion.textContent = message;
    }
  }

  /**
   * Clean up screen reader elements
   */
  static cleanup() {
    ['sr-main-announcements', 'sr-urgent-announcements', 'sr-musical-status'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
    
    this.announcementQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Get screen reader status
   */
  static getStatus() {
    return {
      isEnabled: this.isEnabled,
      queueLength: this.announcementQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      lastAnnouncedState: this.lastAnnouncedState
    };
  }
}