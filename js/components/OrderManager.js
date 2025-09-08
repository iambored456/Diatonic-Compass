// (file path: js/components/OrderManager.js)

import { appState } from '../state/appState.js';
import { savePreferences, loadPreferences } from '../services/PreferencesService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export default class OrderManager {
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
        throw new Error('Order list container not found');
      }

      this._setupEventListeners();
      this._loadSavedOrder();
      this._updateDisplay();
      
    } catch (error) {
      ErrorHandler.handle(error, 'OrderManager', () => {
        console.error('Failed to initialize Order Manager');
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
    console.log('Drag start event triggered', event.target);
    if (!event.target.classList.contains('order-item')) {
      console.log('Not an order-item, ignoring');
      return;
    }
    
    this.draggedItem = event.target;
    this.draggedItem.classList.add('dragging');
    console.log('Dragging item:', this.draggedItem.dataset.component);
    
    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', this.draggedItem.outerHTML);
    
    // Hide the original item after a brief delay (to allow drag ghost to be created)
    setTimeout(() => {
      if (this.draggedItem) {
        this.draggedItem.style.opacity = '0';
      }
    }, 1);
  }

  _handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  _handleDragEnter(event) {
    if (event.target.classList.contains('order-item') && event.target !== this.draggedItem) {
      this.dragOverItem = event.target;
      event.target.classList.add('drag-over');
      this._animateReorder(event.target);
    }
  }

  _handleDragLeave(event) {
    if (event.target.classList.contains('order-item')) {
      event.target.classList.remove('drag-over');
    }
  }

  _handleDrop(event) {
    event.preventDefault();
    console.log('Drop event triggered');
    
    if (!this.dragOverItem || this.dragOverItem === this.draggedItem) {
      console.log('Drop cancelled - no valid target');
      return;
    }
    
    const draggedId = this.draggedItem.dataset.component;
    const targetId = this.dragOverItem.dataset.component;
    console.log(`Dropping ${draggedId} onto ${targetId}`);
    
    this._reorderComponents(draggedId, targetId);
    this._saveOrder();
    this._updateDisplay();
    this._applyComponentOrder();
  }

  _handleDragEnd(event) {
    // Clean up drag states
    if (this.draggedItem) {
      this.draggedItem.classList.remove('dragging');
      this.draggedItem.style.opacity = ''; // Restore visibility
    }
    
    // Remove all drag-over classes
    this.container.querySelectorAll('.drag-over').forEach(item => {
      item.classList.remove('drag-over');
    });
    
    // Reset all animations
    this._resetAnimations();
    
    this.draggedItem = null;
    this.dragOverItem = null;
  }

  _reorderComponents(draggedId, targetId) {
    const currentOrientation = appState.belts.orientation;
    const currentOrder = [...appState.belts.layoutOrder[currentOrientation]];
    
    // Handle vertical layout special case for nested belts
    if (currentOrientation === 'vertical') {
      this._reorderVerticalLayout(draggedId, targetId, currentOrder);
    } else {
      this._reorderHorizontalLayout(draggedId, targetId, currentOrder);
    }
  }

  _reorderHorizontalLayout(draggedId, targetId, currentOrder) {
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    
    console.log('=== HORIZONTAL REORDER DEBUG ===', {
      draggedId,
      targetId,
      currentOrder: [...currentOrder],
      draggedIndex,
      targetIndex
    });
    
    if (draggedIndex === -1 || targetIndex === -1) {
      console.log('Invalid indices - horizontal reorder cancelled');
      return;
    }
    
    // Remove dragged item and insert at target position
    currentOrder.splice(draggedIndex, 1);
    // When dropping onto an item, we want to place the dragged item AFTER the target
    // This fixes the "two drags for one move" issue
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    
    console.log('Horizontal reorder calculation:', {
      afterRemoval: [...currentOrder],
      newTargetIndex,
      calculation: `${draggedIndex} < ${targetIndex} ? ${targetIndex} : ${targetIndex + 1}`,
      explanation: draggedIndex < targetIndex ? 'Moving forward: place after target' : 'Moving backward: place after target'
    });
    
    currentOrder.splice(newTargetIndex, 0, draggedId);
    
    console.log('Final horizontal order:', [...currentOrder]);
    appState.belts.layoutOrder.horizontal = currentOrder;
  }

  _reorderVerticalLayout(draggedId, targetId, currentOrder) {
    console.log('=== VERTICAL REORDER DEBUG ===', {
      draggedId,
      targetId,
      currentOrder,
      isCompassInvolved: draggedId === 'compass' || targetId === 'compass'
    });
    
    // In vertical layout, only compass and result are top-level
    // Belts are nested under result
    if (draggedId === 'compass' || targetId === 'compass') {
      // If compass is being dragged onto a belt, treat it as dropping onto result group
      const beltIds = ['intervals', 'pitch', 'chromatic', 'degree'];
      let actualTargetId = targetId;
      let actualDraggedId = draggedId;
      
      // Convert belt targets to 'result' since belts are nested under result
      if (beltIds.includes(targetId)) {
        actualTargetId = 'result';
        console.log(`Converting belt target '${targetId}' to 'result'`);
      }
      if (beltIds.includes(draggedId)) {
        actualDraggedId = 'result';
        console.log(`Converting belt dragged '${draggedId}' to 'result'`);
      }
      
      // Simple reorder for compass vs result group
      const draggedIndex = currentOrder.indexOf(actualDraggedId);
      const targetIndex = currentOrder.indexOf(actualTargetId);
      
      console.log('Compass reorder indices:', { draggedIndex, targetIndex, actualDraggedId, actualTargetId });
      
      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        currentOrder.splice(draggedIndex, 1);
        
        // Special case: when compass is dragged onto a belt, it should go AFTER result group
        let newTargetIndex;
        if (actualDraggedId === 'compass' && beltIds.includes(targetId)) {
          // Place compass after the result group (at the end)
          newTargetIndex = currentOrder.length;
          console.log('Placing compass after result group at index:', newTargetIndex);
        } else {
          // Normal reorder logic - Fixed to prevent "two drags for one move"
          newTargetIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
          console.log('Normal reorder to index:', newTargetIndex);
        }
        
        currentOrder.splice(newTargetIndex, 0, actualDraggedId);
        appState.belts.layoutOrder.vertical = currentOrder;
        console.log('New vertical layout order:', currentOrder);
      } else {
        console.log('Invalid indices or same position - reorder cancelled');
      }
    } else {
      console.log('Belt reorder within result group');
      // Reordering belts within the result group
      this._reorderBelts(draggedId, targetId);
    }
  }

  _reorderBelts(draggedBelt, targetBelt) {
    const currentOrder = [...appState.belts.order];
    const draggedIndex = currentOrder.indexOf(draggedBelt);
    const targetIndex = currentOrder.indexOf(targetBelt);
    
    console.log('=== BELT REORDER DEBUG ===', {
      draggedBelt,
      targetBelt,
      currentOrder: [...currentOrder],
      draggedIndex,
      targetIndex
    });
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged item and insert at target position
    currentOrder.splice(draggedIndex, 1);
    // Fix: Use the same logic as horizontal layout to prevent "two drags for one move"
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    
    console.log('Belt reorder calculation:', {
      afterRemoval: [...currentOrder],
      newTargetIndex,
      calculation: `${draggedIndex} < ${targetIndex} ? ${targetIndex} : ${targetIndex + 1}`,
      explanation: draggedIndex < targetIndex ? 'Moving forward: place after target' : 'Moving backward: place after target'
    });
    
    currentOrder.splice(newTargetIndex, 0, draggedBelt);
    
    console.log('Final belt order:', [...currentOrder]);
    appState.belts.order = currentOrder;
  }

  _updateDisplay() {
    const currentOrientation = appState.belts.orientation;
    this.container.innerHTML = '';
    
    if (currentOrientation === 'horizontal') {
      this._renderHorizontalLayout();
    } else {
      this._renderVerticalLayout();
    }
  }

  _renderHorizontalLayout() {
    const order = appState.belts.layoutOrder.horizontal;
    
    order.forEach(componentId => {
      const item = this._createOrderItem(componentId, this._getComponentLabel(componentId));
      this.container.appendChild(item);
    });
  }

  _renderVerticalLayout() {
    const order = appState.belts.layoutOrder.vertical;
    
    console.log('=== RENDERING VERTICAL LAYOUT ===', {
      order,
      beltOrder: appState.belts.order
    });
    
    order.forEach((componentId, index) => {
      console.log(`Rendering component ${index}: ${componentId}`);
      
      if (componentId === 'result') {
        // Create result group with nested belts
        const resultItem = this._createOrderItem('result', 'Mode Name', true);
        this.container.appendChild(resultItem);
        console.log('Added result group item');
        
        // Add nested belt items
        appState.belts.order.forEach((beltId, beltIndex) => {
          const beltItem = this._createOrderItem(beltId, this._getComponentLabel(beltId), false, true);
          this.container.appendChild(beltItem);
          console.log(`Added nested belt item ${beltIndex}: ${beltId}`);
        });
      } else {
        const item = this._createOrderItem(componentId, this._getComponentLabel(componentId));
        this.container.appendChild(item);
        console.log(`Added regular item: ${componentId}`);
      }
    });
    
    console.log('Final sidebar structure:', Array.from(this.container.children).map(child => ({
      className: child.className,
      textContent: child.textContent.trim(),
      dataComponent: child.dataset.component
    })));
  }

  _createOrderItem(componentId, label, isGroup = false, isNested = false) {
    const item = document.createElement('div');
    item.className = `order-item${isGroup ? ' group' : ''}${isNested ? ' nested' : ''}`;
    item.draggable = true;
    item.dataset.component = componentId;
    
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '⋮⋮';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'component-label';
    labelSpan.textContent = label;
    
    if (isNested) {
      const indent = document.createElement('span');
      indent.className = 'nested-indent';
      indent.textContent = '  ';
      item.appendChild(indent);
    }
    
    item.appendChild(dragHandle);
    item.appendChild(labelSpan);
    
    return item;
  }

  _getComponentLabel(componentId) {
    const labels = {
      compass: 'Compass',
      result: 'Mode Name',
      pitch: 'Pitch',
      degree: 'Degrees',
      intervals: 'Intervals',
      chromatic: 'Chromatic'
    };
    
    return labels[componentId] || componentId;
  }

  _saveOrder() {
    try {
      const preferences = loadPreferences();
      preferences.layoutOrder = appState.belts.layoutOrder;
      preferences.beltOrder = appState.belts.order;
      savePreferences(preferences);
    } catch (error) {
      console.warn('Failed to save order preferences:', error);
    }
  }

  _loadSavedOrder() {
    try {
      const preferences = loadPreferences();
      if (preferences && preferences.layoutOrder) {
        appState.belts.layoutOrder = preferences.layoutOrder;
      }
      if (preferences && preferences.beltOrder) {
        appState.belts.order = preferences.beltOrder;
      }
    } catch (error) {
      console.warn('Failed to load order preferences:', error);
    }
  }

  _applyComponentOrder() {
    // Trigger layout update
    if (this.onOrderChange) {
      this.onOrderChange(appState.belts.layoutOrder, appState.belts.order);
    }
  }

  setOrderChangeCallback(callback) {
    this.onOrderChange = callback;
  }

  // Called when orientation changes to update the display
  onOrientationChange() {
    this._updateDisplay();
  }

  /**
   * Animate items moving out of the way when dragging over
   */
  _animateReorder(targetItem) {
    if (!this.draggedItem || !targetItem) return;
    
    const items = Array.from(this.container.querySelectorAll('.order-item'));
    const draggedIndex = items.indexOf(this.draggedItem);
    const targetIndex = items.indexOf(targetItem);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Determine drop position
    const insertBefore = draggedIndex > targetIndex;
    
    items.forEach((item, index) => {
      if (item === this.draggedItem) {
        // Keep dragged item in place visually
        return;
      }
      
      let translateY = 0;
      
      if (insertBefore) {
        // Dragging from bottom to top
        if (index >= targetIndex && index < draggedIndex) {
          translateY = this.draggedItem.offsetHeight + 8; // height + gap
        }
      } else {
        // Dragging from top to bottom
        if (index > draggedIndex && index <= targetIndex) {
          translateY = -(this.draggedItem.offsetHeight + 8); // negative height + gap
        }
      }
      
      item.style.transform = `translateY(${translateY}px)`;
      item.style.transition = 'transform 0.2s ease';
    });
  }
  
  /**
   * Reset all animation transforms
   */
  _resetAnimations() {
    const items = this.container.querySelectorAll('.order-item');
    items.forEach(item => {
      item.style.transform = '';
      item.style.transition = '';
    });
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('dragstart', this._handleDragStart.bind(this));
      this.container.removeEventListener('dragover', this._handleDragOver.bind(this));
      this.container.removeEventListener('dragenter', this._handleDragEnter.bind(this));
      this.container.removeEventListener('dragleave', this._handleDragLeave.bind(this));
      this.container.removeEventListener('drop', this._handleDrop.bind(this));
      this.container.removeEventListener('dragend', this._handleDragEnd.bind(this));
    }
  }
}