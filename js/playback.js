// (file path: js/playback.js)

import { appState } from './state/appState.js';
import { MODE_SCALE_DEGREES, DEGREE_MAP, DIATONIC_INTERVALS, PLAYBACK_NOTE_DURATION_MS, PLAYBACK_PAUSE_MS } from './core/constants.js';
import { indexAtTop, normAngle } from './core/math.js';
import { initAudio, playNote } from './audio/synth.js';

/**
 * Calculates the sequence of notes for the current mode.
 * @returns {number[]} An array of 8 continuously ascending semitone numbers.
 */
function getScaleSequence() {
  const { pitchClass, degree, chromatic } = appState.rings;

  const rootNoteIndex = indexAtTop(normAngle(pitchClass - chromatic));
  const modeDegreeIndex = indexAtTop(normAngle(degree - chromatic));
  
  const tonicInterval = DIATONIC_INTERVALS[modeDegreeIndex];
  const modeKey = DEGREE_MAP[tonicInterval];
  if (!modeKey) return [];

  const modeIntervals = MODE_SCALE_DEGREES[modeKey];
  
  const scale = modeIntervals.map(interval => rootNoteIndex + interval);

  scale.push(scale[0] + 12); 
  
  return scale;
}

function playNextNote() {
  // Stop if playback was cancelled
  if (!appState.playback.isPlaying) {
    stopPlayback(false); // Ensure cleanup without class toggle
    return;
  }
  
  const sequence = appState.playback.sequence;
  if (sequence.length === 0) {
    stopPlayback();
    return;
  }
  
  const currentNote = sequence.shift();
  appState.playback.currentNoteIndex = currentNote;
  
  playNote(currentNote, PLAYBACK_NOTE_DURATION_MS / 1000);
  
  const timeoutId = setTimeout(playNextNote, PLAYBACK_NOTE_DURATION_MS + PLAYBACK_PAUSE_MS);
  appState.playback.timeoutId = timeoutId;
}

/**
 * Starts the musical playback sequence.
 */
export function startPlayback() {
  if (appState.playback.isPlaying) return;
  
  initAudio();
  
  const sequence = getScaleSequence();
  if (sequence.length === 0) return;

  // MODIFICATION: Store the root note for the flash calculation.
  appState.playback.rootNoteIndexForPlayback = sequence[0];
  appState.playback.isPlaying = true;
  appState.playback.sequence = sequence;
  
  document.getElementById('result-container').classList.add('playback-active');
  
  playNextNote();
}

/**
 * Stops the musical playback sequence.
 * @param {boolean} [toggleClass=true] - Whether to remove the active class.
 */
export function stopPlayback(toggleClass = true) {
  if (!appState.playback.isPlaying && toggleClass) return;
  
  clearTimeout(appState.playback.timeoutId);
  
  appState.playback.isPlaying = false;
  appState.playback.currentNoteIndex = null;
  appState.playback.sequence = [];
  appState.playback.timeoutId = null;
  // MODIFICATION: Clear the stored root note.
  appState.playback.rootNoteIndexForPlayback = null;
  
  if (toggleClass) {
    document.getElementById('result-container').classList.remove('playback-active');
  }
}
