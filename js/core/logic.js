// (file path: js/core/logic.js)

import { CHROMATIC_NOTES, DIATONIC_INTERVALS, DEGREE_MAP, MODE_NAME, BELT_TEXT_STACK_THRESHOLD } from './constants.js';
import { indexAtTop, normAngle } from './math.js';

export function generateDisplayLabels(state) {
  const { sharp, flat } = state.display;
  const { orientation, itemSize } = state.belts;
  const cellW = itemSize.pitchBelt || 0;
  const useStacked = (orientation === 'vertical') || (cellW > 0 && cellW < BELT_TEXT_STACK_THRESHOLD);

  const processLabel = (label) => {
    if (!label.includes('/')) return label;
    const [sharpName, flatName] = label.split('/');
    
    // Stacked display for vertical layout or narrow horizontal cells
    if (useStacked) {
        if (sharp && flat) return `${sharpName}<br>${flatName}`;
        if (sharp) return sharpName;
        if (flat) return flatName;
        return `${sharpName}<br>${flatName}`; // Default to stacked if none are active
    }
    
    // Single line display
    if (sharp && flat) return label;
    if (sharp) return sharpName;
    if (flat) return flatName;
    return sharpName; // Default to sharp if none are active
  };

  const chromaticLabels = CHROMATIC_NOTES.map(processLabel);
  const diatonicLabels = DIATONIC_INTERVALS.map(processLabel);
  return { chromaticLabels, diatonicLabels };
}

export function updateResultText(state, resultElement) {
  const { sharp, flat } = state.display;
  const processLabel = (label) => {
    if (!label.includes('/')) return label;
    const [sharpName, flatName] = label.split('/');
    if (sharp && flat) return label;
    if (sharp) return sharpName;
    if (flat) return flatName;
    return sharpName;
  };
  const chromaticLabels = CHROMATIC_NOTES.map(processLabel);

  const { pitchClass, degree, chromatic } = state.rings;
  const effectivePitchRotation = normAngle(pitchClass - chromatic);
  const effectiveDegreeRotation = normAngle(degree - chromatic);

  const rootNoteIndex = indexAtTop(effectivePitchRotation);
  const modeDegreeIndex = indexAtTop(effectiveDegreeRotation);
  
  const pitch = chromaticLabels[rootNoteIndex];
  const tonicInterval = DIATONIC_INTERVALS[modeDegreeIndex];
  const modeKey = DEGREE_MAP[tonicInterval] || null;
  const modeName = modeKey ? MODE_NAME[modeKey] : '...';
  
  const newResult = `${pitch} ${modeName}`;
  if (resultElement.textContent !== newResult) {
      resultElement.textContent = newResult;
  }
}