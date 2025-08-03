// (file path: js/audio/synth.js)

import { appState } from '../state/appState.js';
import { BASE_NOTE_FREQUENCY } from '../core/constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * Initializes the Web Audio API context with comprehensive error handling.
 * Must be called from a user-initiated event (e.g., a click).
 */
export function initAudio() {
  try {
    // Check if already initialized
    if (appState.playback.audioContext) {
      // Try to resume if suspended
      if (appState.playback.audioContext.state === 'suspended') {
        return appState.playback.audioContext.resume().catch(error => {
          ErrorHandler.handle(error, 'AudioContext', () => {
            // Fallback: recreate context
            appState.playback.audioContext = null;
            initAudio();
          });
        });
      }
      return Promise.resolve();
    }

    // Check if Web Audio API is supported
    if (!ErrorHandler.isFeatureSupported('AudioContext')) {
      console.warn('Web Audio API not supported - audio playback disabled');
      return Promise.resolve();
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    appState.playback.audioContext = new AudioContext();

    // Handle context state changes
    appState.playback.audioContext.addEventListener('statechange', () => {
      // Check if audioContext still exists (might be nulled during cleanup)
      if (!appState.playback.audioContext) return;
      
      const state = appState.playback.audioContext.state;
      console.log(`Audio context state changed to: ${state}`);
      
      if (state === 'interrupted' || state === 'suspended') {
        // Try to resume after a brief delay
        setTimeout(() => {
          if (appState.playback.audioContext?.state === 'suspended') {
            appState.playback.audioContext.resume().catch(error => {
              ErrorHandler.handle(error, 'AudioContext');
            });
          }
        }, 100);
      }
    });

    // Resume context if it was suspended (common on mobile)
    if (appState.playback.audioContext.state === 'suspended') {
      return appState.playback.audioContext.resume().catch(error => {
        ErrorHandler.handle(error, 'AudioContext', () => {
          console.warn('Could not resume audio context - user interaction may be required');
        });
      });
    }

    return Promise.resolve();
    
  } catch (error) {
    ErrorHandler.handle(error, 'AudioContext', () => {
      console.warn('Audio initialization failed - continuing without audio');
      appState.playback.audioContext = null;
    });
    return Promise.resolve();
  }
}

/**
 * Plays a single note for a given duration with error handling.
 * @param {number} chromaticIndex - The 0-11 index of the note to play.
 * @param {number} durationSec - The duration to play the note in seconds.
 */
export function playNote(chromaticIndex, durationSec) {
  try {
    const audioCtx = appState.playback.audioContext;
    
    // Validate inputs
    if (!audioCtx) {
      console.warn('No audio context available');
      return;
    }

    if (audioCtx.state === 'closed') {
      console.warn('Audio context is closed');
      return;
    }

    if (typeof chromaticIndex !== 'number' || chromaticIndex < 0) {
      throw new Error(`Invalid chromatic index: ${chromaticIndex}`);
    }

    if (typeof durationSec !== 'number' || durationSec <= 0) {
      throw new Error(`Invalid duration: ${durationSec}`);
    }

    // Create audio nodes with error handling
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Calculate frequency (C4 is the base) - handle notes above octave
    const octaveAdjustedIndex = chromaticIndex % 12;
    const octaveShift = Math.floor(chromaticIndex / 12);
    const frequency = BASE_NOTE_FREQUENCY * Math.pow(2, octaveAdjustedIndex / 12 + octaveShift);
    
    // Validate frequency
    if (frequency < 20 || frequency > 20000) {
      throw new Error(`Frequency out of audible range: ${frequency}Hz`);
    }

    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.type = 'sine';

    // Connect nodes with error handling
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Create smooth envelope to prevent clicking/popping
    const now = audioCtx.currentTime;
    const attackTime = 0.01; // 10ms attack
    const releaseTime = Math.min(0.1, durationSec * 0.3); // 30% of duration or 100ms max
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + attackTime);
    gainNode.gain.setValueAtTime(0.3, now + durationSec - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

    // Schedule playback
    oscillator.start(now);
    oscillator.stop(now + durationSec);

    // Clean up after playback
    oscillator.addEventListener('ended', () => {
      try {
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (e) {
        // Nodes may already be disconnected - ignore
      }
    });

    // Handle oscillator errors
    oscillator.addEventListener('error', (event) => {
      ErrorHandler.handle(new Error('Oscillator error'), 'AudioContext');
    });

  } catch (error) {
    ErrorHandler.handle(error, 'AudioContext', () => {
      console.warn(`Failed to play note ${chromaticIndex} - continuing silently`);
    });
  }
}

/**
 * Check if audio is currently available and working
 * @returns {boolean} True if audio is available
 */
export function isAudioAvailable() {
  try {
    const audioCtx = appState.playback.audioContext;
    return audioCtx && audioCtx.state !== 'closed' && ErrorHandler.isFeatureSupported('AudioContext');
  } catch (error) {
    ErrorHandler.handle(error, 'AudioContext');
    return false;
  }
}

/**
 * Safely close audio context
 */
export function closeAudio() {
  try {
    if (appState.playback.audioContext && appState.playback.audioContext.state !== 'closed') {
      appState.playback.audioContext.close();
    }
  } catch (error) {
    ErrorHandler.handle(error, 'AudioContext');
  } finally {
    appState.playback.audioContext = null;
  }
}

/**
 * Test audio functionality
 * @returns {Promise<boolean>} True if audio test passes
 */
export async function testAudio() {
  try {
    await initAudio();
    
    if (!isAudioAvailable()) {
      return false;
    }

    // Create a very brief, quiet test tone
    const audioCtx = appState.playback.audioContext;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime); // Very quiet
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05); // 50ms test
    
    return new Promise(resolve => {
      oscillator.addEventListener('ended', () => {
        resolve(true);
      });
      
      oscillator.addEventListener('error', () => {
        resolve(false);
      });
      
      // Timeout fallback
      setTimeout(() => resolve(false), 200);
    });
    
  } catch (error) {
    ErrorHandler.handle(error, 'AudioContext');
    return false;
  }
}