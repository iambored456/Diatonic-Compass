/**
 * State tracking utility for dirty checking
 * Determines if the app state has changed and requires a redraw
 */
export class StateTracker {
  /**
   * Check if state has changed and needs redraw
   * @param {Object} currentState - Current application state
   * @param {Object} lastState - Last rendered state
   * @returns {boolean} True if redraw is needed
   */
  static hasStateChanged(currentState, lastState) {
    // Always redraw on first render
    if (!lastState) return true;

    // Check if animation is running
    if (currentState.animation !== null) return true;

    // Check if user is dragging
    if (currentState.drag.active !== null) return true;

    // Check if playback state changed
    if (currentState.playback.isPlaying !== lastState.playback.isPlaying) return true;
    if (currentState.playback.currentNoteIndex !== lastState.playback.currentNoteIndex) return true;

    // Check ring positions
    if (!this._ringsEqual(currentState.rings, lastState.rings)) return true;

    // Check display preferences
    if (currentState.display.sharp !== lastState.display.sharp) return true;
    if (currentState.display.flat !== lastState.display.flat) return true;

    // Check UI state
    if (currentState.ui.darkMode !== lastState.ui.darkMode) return true;
    if (currentState.ui.sidebarOpen !== lastState.ui.sidebarOpen) return true;

    // Check belt orientation
    if (currentState.belts.orientation !== lastState.belts.orientation) return true;

    // Check dimensions (resize)
    if (!this._dimensionsEqual(currentState.dimensions, lastState.dimensions)) return true;

    // No changes detected
    return false;
  }

  /**
   * Check if ring positions are equal (with tolerance for floating point)
   */
  static _ringsEqual(rings1, rings2) {
    const tolerance = 0.0001;
    return (
      Math.abs(rings1.pitchClass - rings2.pitchClass) < tolerance &&
      Math.abs(rings1.degree - rings2.degree) < tolerance &&
      Math.abs(rings1.chromatic - rings2.chromatic) < tolerance &&
      Math.abs(rings1.highlightPosition - rings2.highlightPosition) < tolerance
    );
  }

  /**
   * Check if dimensions are equal
   */
  static _dimensionsEqual(dim1, dim2) {
    return (
      dim1.size === dim2.size &&
      dim1.dpr === dim2.dpr
    );
  }

  /**
   * Create a snapshot of current state for comparison
   * Only copies the properties we care about for rendering
   */
  static createSnapshot(state) {
    return {
      rings: { ...state.rings },
      playback: {
        isPlaying: state.playback.isPlaying,
        currentNoteIndex: state.playback.currentNoteIndex,
      },
      display: { ...state.display },
      ui: {
        darkMode: state.ui.darkMode,
        sidebarOpen: state.ui.sidebarOpen,
      },
      belts: {
        orientation: state.belts.orientation,
      },
      dimensions: { ...state.dimensions },
      animation: state.animation,
      drag: {
        active: state.drag.active,
      },
    };
  }

  /**
   * Mark state as needing redraw
   */
  static markDirty(state) {
    if (state.performance) {
      state.performance.needsRedraw = true;
    }
  }

  /**
   * Mark state as clean (just rendered)
   */
  static markClean(state) {
    if (state.performance) {
      state.performance.needsRedraw = false;
      state.performance.lastRenderState = this.createSnapshot(state);
    }
  }

  /**
   * Check if redraw is needed based on dirty flag or state changes
   */
  static needsRedraw(state) {
    // Check explicit dirty flag first
    if (state.performance?.needsRedraw) return true;

    // Compare state changes
    return this.hasStateChanged(state, state.performance?.lastRenderState);
  }
}
