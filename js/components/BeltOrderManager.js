// (file path: js/components/BeltOrderManager.js)

import { appState } from '../state/appState.js';
import { savePreferences, loadPreferences } from '../services/PreferencesService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export default class BeltOrderManager {
  constructor() {
    this.container = null;
    this.draggedItem = null;
    this.dragOverItem = null;
    this.onOrderChange = null;
    
    this.init();
  }

  init() {
    try {
      this.container = document.getElementById('belt-order-list');
      if (!this.container) {
        throw new Error('Belt order list container not found');
      }

      this._setupEventListeners();
      this._loadSavedOrder();
      this._updateDisplay();
      
    } catch (error) {
      ErrorHandler.handle(error, 'BeltOrderManager', () => {
        console.error('Failed to initialize Belt Order Manager');
      });
    }
  }

  _setupEventListeners() {
    this.container.addEventListener('dragstart', this._handleDragStart.bind(this));
    this.container.addEventListener('dragover', this._handleDragOver.bind(this));
    this.container.addEventListener('dragenter', this._handleDragEnter.bind(this));
    this.container.addEventListener('dragleave', this._handleDragLeave.bind(this));
    this.container.addEventListener('drop', this._handleDrop.bind(this));
    this.container.addEventListener('dragend', this._handleDragEnd.bind(this));
  }

  _handleDragStart(event) {
    if (!event.target.classList.contains('belt-order-item')) return;
    
    this.draggedItem = event.target;
    this.draggedItem.classList.add('dragging');
    
    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.draggedItem.dataset.belt);
    
    // Add ghost image
    event.dataTransfer.setDragImage(this.draggedItem, 0, 0);
  }

  _handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  _handleDragEnter(event) {
    event.preventDefault();
    
    if (event.target.classList.contains('belt-order-item') && 
        event.target !== this.draggedItem) {
      
      // Remove previous drag-over class
      if (this.dragOverItem) {
        this.dragOverItem.classList.remove('drag-over');
      }
      
      this.dragOverItem = event.target;
      this.dragOverItem.classList.add('drag-over');
    }
  }

  _handleDragLeave(event) {
    if (event.target.classList.contains('belt-order-item')) {
      event.target.classList.remove('drag-over');
    }
  }

  _handleDrop(event) {
    event.preventDefault();
    
    if (!this.draggedItem || !this.dragOverItem) return;
    
    try {
      const draggedBelt = this.draggedItem.dataset.belt;
      const targetBelt = this.dragOverItem.dataset.belt;
      
      this._reorderBelts(draggedBelt, targetBelt);
      this._saveOrder();
      this._updateDisplay();
      this._applyBeltOrder();
      
      // Announce change for accessibility
      this._announceOrderChange(draggedBelt, targetBelt);
      
    } catch (error) {
      ErrorHandler.handle(error, 'BeltOrderManager', () => {
        console.error('Failed to handle belt reordering');
      });
    }
  }

  _handleDragEnd(event) {
    // Clean up drag states
    if (this.draggedItem) {
      this.draggedItem.classList.remove('dragging');
      this.draggedItem = null;
    }
    
    if (this.dragOverItem) {
      this.dragOverItem.classList.remove('drag-over');
      this.dragOverItem = null;
    }
    
    // Remove any remaining drag-over classes
    this.container.querySelectorAll('.drag-over').forEach(item => {
      item.classList.remove('drag-over');
    });
  }

  _reorderBelts(draggedBelt, targetBelt) {
    const currentOrder = [...appState.belts.order];
    const draggedIndex = currentOrder.indexOf(draggedBelt);
    const targetIndex = currentOrder.indexOf(targetBelt);
    
    console.log('=== BELT ORDER MANAGER REORDER DEBUG ===', {
      draggedBelt,
      targetBelt,
      currentOrder: [...currentOrder],
      draggedIndex,
      targetIndex
    });
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged item and insert at target position
    currentOrder.splice(draggedIndex, 1);
    // Fix: Use proper logic to place after target instead of before
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    
    console.log('BeltOrderManager reorder calculation:', {
      afterRemoval: [...currentOrder],
      newTargetIndex,
      calculation: `${draggedIndex} < ${targetIndex} ? ${targetIndex} : ${targetIndex + 1}`,
      explanation: draggedIndex < targetIndex ? 'Moving forward: place after target' : 'Moving backward: place after target'
    });
    
    currentOrder.splice(newTargetIndex, 0, draggedBelt);
    
    console.log('Final BeltOrderManager order:', [...currentOrder]);
    appState.belts.order = currentOrder;
  }

  _updateDisplay() {
    const items = Array.from(this.container.querySelectorAll('.belt-order-item'));
    
    // Sort items according to current order
    appState.belts.order.forEach((beltId, index) => {
      const item = items.find(item => item.dataset.belt === beltId);
      if (item) {
        item.style.order = index + 1;
      }
    });
  }

  _applyBeltOrder() {
    const beltsContainer = document.querySelector('.belts-container');
    if (!beltsContainer) return;
    
    // Map belt IDs to their corresponding CSS classes
    const beltMapping = {
      'pitch': '.pitch-belt',
      'degree': '.degree-belt', 
      'intervals': '.interval-brackets-wrapper',
      'chromatic': '.chromatic-belt'
    };
    
    // Apply order to actual belt elements
    appState.belts.order.forEach((beltId, index) => {
      const selector = beltMapping[beltId];
      if (selector) {
        const element = beltsContainer.querySelector(selector);
        if (element) {
          element.style.order = index + 1;
        }
      }
    });
    
    // Trigger callback if set
    if (this.onOrderChange) {
      this.onOrderChange(appState.belts.order);
    }
  }

  _loadSavedOrder() {
    try {
      const preferences = loadPreferences();
      if (preferences && preferences.beltOrder && Array.isArray(preferences.beltOrder)) {
        // Validate that saved order contains all required belts
        const requiredBelts = ['pitch', 'degree', 'intervals', 'chromatic'];
        const hasAllBelts = requiredBelts.every(belt => preferences.beltOrder.includes(belt));
        
        if (hasAllBelts && preferences.beltOrder.length === requiredBelts.length) {
          appState.belts.order = preferences.beltOrder;
        }
      }
    } catch (error) {
      console.warn('Failed to load belt order preferences:', error);
    }
  }

  _saveOrder() {
    try {
      const preferences = loadPreferences() || {};
      preferences.beltOrder = appState.belts.order;
      savePreferences(preferences);
    } catch (error) {
      console.warn('Failed to save belt order preferences:', error);
    }
  }

  _announceOrderChange(draggedBelt, targetBelt) {
    const beltNames = {
      'pitch': 'Pitch Classes',
      'degree': 'Degrees',
      'intervals': 'Intervals',
      'chromatic': 'Chromatic'
    };
    
    const message = `${beltNames[draggedBelt]} moved before ${beltNames[targetBelt]}`;
    
    // Try to use existing announcement system
    const liveRegion = document.getElementById('basic-announcements') || 
                      document.getElementById('status-messages');
    
    if (liveRegion) {
      liveRegion.textContent = '';
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 100);
    }
  }

  /**
   * Set callback for order changes
   * @param {Function} callback - Function to call when order changes
   */
  setOrderChangeCallback(callback) {
    this.onOrderChange = callback;
  }

  /**
   * Get current belt order
   * @returns {Array<string>} Current order of belt IDs
   */
  getCurrentOrder() {
    return [...appState.belts.order];
  }

  /**
   * Set belt order programmatically
   * @param {Array<string>} newOrder - New order of belt IDs
   */
  setOrder(newOrder) {
    if (!Array.isArray(newOrder)) return false;
    
    const requiredBelts = ['pitch', 'degree', 'intervals', 'chromatic'];
    const hasAllBelts = requiredBelts.every(belt => newOrder.includes(belt));
    
    if (!hasAllBelts || newOrder.length !== requiredBelts.length) {
      console.error('Invalid belt order - must contain all required belts');
      return false;
    }
    
    appState.belts.order = [...newOrder];
    this._updateDisplay();
    this._applyBeltOrder();
    this._saveOrder();
    
    return true;
  }

  /**
   * Reset to default order
   */
  resetToDefault() {
    const defaultOrder = ['pitch', 'degree', 'intervals', 'chromatic'];
    this.setOrder(defaultOrder);
    
    // Announce reset
    const liveRegion = document.getElementById('basic-announcements') || 
                      document.getElementById('status-messages');
    if (liveRegion) {
      liveRegion.textContent = 'Belt order reset to default';
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (this.container) {
      this.container.removeEventListener('dragstart', this._handleDragStart);
      this.container.removeEventListener('dragover', this._handleDragOver);
      this.container.removeEventListener('dragenter', this._handleDragEnter);
      this.container.removeEventListener('dragleave', this._handleDragLeave);
      this.container.removeEventListener('drop', this._handleDrop);
      this.container.removeEventListener('dragend', this._handleDragEnd);
    }
  }
}