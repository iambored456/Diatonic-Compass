// (file path: js/state/appState.js)

export const appState = {
    rings: {
      pitchClass: 0,
      degree: 0,
      chromatic: 0,
      highlightPosition: 0,
    },
    drag: { 
      active:null, 
      startX:0, 
      startY:0, 
      startPitchClass:0,
      startDegree:0,
      startChrom:0,
      startHighlight:0
    },
    belts:{ 
        itemSize:{}, 
        tracks:{}, 
        init:false,
        orientation: 'horizontal'
    },
    dimensions:{ size:0, cx:0, cy:0, dpr: 1 },
    animation: null,
    playback: {
      isPlaying: false,
      currentNoteIndex: null,
      sequence: [],
      timeoutId: null,
      audioContext: null,
      rootNoteIndexForPlayback: null,
    },
    display: {
      sharp: true,
      flat: true,
    },
    // ADDED: State for UI elements like the sidebar
    ui: {
      sidebarOpen: false,
    }
  };