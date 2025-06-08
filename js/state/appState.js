// (file path: js/state/appState.js)

export const appState = {
    rings: {
      pitchClass: 0,
      degree: 0,
      chromatic: 0,
      // REMOVED: degreeTonicIndex is no longer needed.
    },
    drag: { 
      active:null, 
      startX:0, 
      startY:0, 
      startPitchClass:0,
      startDegree:0,
      startChrom:0 
    },
    belts:{ 
        itemW:{}, 
        tracks:{}, 
        init:false,
        // REMOVED: highlightPattern is now calculated dynamically.
    },
    dimensions:{ size:0, cx:0, cy:0 },
    animation: null,
    display: {
      sharp: true,
      flat: true,
    }
  };
