// (file path: js/audio/synth.js)

import { appState } from '../state/appState.js';
import { BASE_NOTE_FREQUENCY } from '../core/constants.js';

/**
 * Initializes the Web Audio API context.
 * Must be called from a user-initiated event (e.g., a click).
 */
export function initAudio() {
  if (appState.playback.audioContext) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  appState.playback.audioContext = new AudioContext();
  // Resume context if it was suspended
  if (appState.playback.audioContext.state === 'suspended') {
    appState.playback.audioContext.resume();
  }
}

/**
 * Plays a single note for a given duration.
 * @param {number} chromaticIndex - The 0-11 index of the note to play.
 * @param {number} durationSec - The duration to play the note in seconds.
 */
export function playNote(chromaticIndex, durationSec) {
  const audioCtx = appState.playback.audioContext;
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // Calculate frequency (C4 is the base)
  const frequency = BASE_NOTE_FREQUENCY * Math.pow(2, chromaticIndex / 12);
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  oscillator.type = 'sine';

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Simple envelope to prevent clicking
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01); 
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + durationSec);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + durationSec);
}
