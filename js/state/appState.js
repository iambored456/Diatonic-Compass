export const appState = {
    rings: {
      grey: 0,
      white: 0,
      chromatic: 0,
      whiteDiatonic: 0 // index into DIATONIC_DEGREE_INDICES
    },
    drag: { active:null, startX:0, startY:0, startGrey:0, startWhite:0, startChrom:0 },
    belts:{ itemW:{}, tracks:{}, lastMode:[], init:false },
    dimensions:{ size:0, cx:0, cy:0 },
    animation: null, // { t0, from:{}, to:{} } when active
    display: {
      sharp: true,
      flat: true,
    }
  };
