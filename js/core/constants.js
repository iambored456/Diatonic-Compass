// (file path: js/core/constants.js)

export const CHROMATIC_NOTES = [
    'C','C♯/D♭','D','D♯/E♭','E','F',
    'F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'
  ];
  
export const DIATONIC_INTERVALS = [
    '1','♯1/♭2','2','♯2/♭3','3','4',
    '♯4/♭5','5','♯5/♭6','6','♯6/♭7','7'
  ];
  
export const SEMITONES = [...Array(12).keys()];
export const DIATONIC_DEGREE_INDICES = [0,2,4,5,7,9,11];
  
export const PIANO_KEY_COLOUR = {
    'C':true,'C♯/D♭':false,'D':true,'D♯/E♭':false,'E':true,'F':true,
    'F♯/G♭':false,'G':true,'G♯/A♭':false,'A':true,'A♯/B♭':false,'B':true
  };


export const FIXED_INTERVAL_COLOUR = {
    // Diatonic degrees (original colors)
    0:'#f090ae', // 1
    2:'#ea9e5e', // 2
    4:'#a8bd61', // 3
    5:'#76c788', // 4
    7:'#33c6dc', // 5
    9:'#94adff', // 6
    11:'#dd95d6', // 7
    // Chromatic degrees (new colors)
    1:'#a46055',  // #1/b2
    3:'#8a722f',  // #2/b3
    6:'#258677',  // #4/b5
    8:'#3d7ca5',  // #5/b6
    10:'#7d68a3'  // #6/b7
  };
  
export const MODE_SCALE_DEGREES = {
    '1':[0,2,4,5,7,9,11], '2':[0,2,3,5,7,9,10], '3':[0,1,3,5,7,8,10],
    '4':[0,2,4,6,7,9,11], '5':[0,2,4,5,7,9,10], '6':[0,2,3,5,7,8,10], '7':[0,1,3,5,6,8,10]
  };
export const DEGREE_MAP = {
    '1':'1','♯1/♭2':'2','2':'2','♯2/♭3':'3','3':'3','4':'4',
    '♯4/♭5':'5','5':'5','♯5/♭6':'6','6':'6','♯6/♭7':'7','7':'7'
  };
export const MODE_NAME = { '1':'Major','2':'Dorian','3':'Phrygian','4':'Lydian','5':'Mixolydian','6':'Minor','7':'Locrian' };
  
export const MAJOR_SCALE_INTERVAL_STEPS = [2,2,1,2,2,2,1];
  
export const TAU = Math.PI*2;
export const ANGLE_STEP = TAU/12;
export const FONT_FACTOR_OUTER = 0.057;   // For the Pitch Ring (C, C#, etc.)
export const FONT_FACTOR_MIDDLE = 0.052;  // For the Degree Ring (1, #1/b2, etc.)
export const FONT_FACTOR_INNER = 0.042;   // For the Chromatic Ring (0-11)
  
export const ANIM_MS = 300;

export const CANVAS_GUTTER_FACTOR = 0.02;

// MODIFICATION: Add threshold for stacking text in belts.
export const BELT_TEXT_STACK_THRESHOLD = 45; // in pixels

export const PLAYBACK_NOTE_DURATION_MS = 250;
export const PLAYBACK_PAUSE_MS = 50;
export const BASE_NOTE_FREQUENCY = 261.63; // C4
