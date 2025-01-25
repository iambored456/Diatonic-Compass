// scrollingbelts.js

// ===== HELPER FUNCTIONS =====

const diatonicDegreeIndices = [0, 2, 4, 5, 7, 9, 11];


// rotateArray: Rotates an array by rotationIndex
function rotateArray(array, rotationIndex) {
    return array.slice(rotationIndex).concat(array.slice(0, rotationIndex));
  }
  
  // getIndexAtTop: Gets the chromatic index at the top based on rotation
  function getIndexAtTop(rotation, angleStep = (2 * Math.PI) / 12) {
    let index = Math.round(-normalizeAngle(rotation) / angleStep) % 12;
    if (index < 0) {
      index += 12;
    }
    return index;
  }
  
  // normalizeAngle: Normalizes angle to [0, 2π)
  function normalizeAngle(angle) {
    return (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  }
  
  // ===== CREATE BELT =====
  // Creates a belt by populating the container with items, highlighting specific indices
  function createBelt(containerId, items, centerIndex, scaleDegreeIndices = [], highlightClass = 'scale-degree') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
  
    items.forEach((item, index) => {
      const cell = document.createElement('div');
      cell.classList.add('belt-cell');
      cell.textContent = item;
  
      if (index === centerIndex) {
        cell.classList.add('center');
      }
  
      if (scaleDegreeIndices.includes(index)) {
        cell.classList.add(highlightClass);
      }
  
      container.appendChild(cell);
    });
  }
  
  // ===== UPDATE BELTS =====
  // Updates all belts based on the current mode and rotation
  function updateBelts(
    whiteRingDiatonicIndex, 
    whiteRingRotation, 
    greyRingRotation, 
    diatonicDegreeIndicesArray, 
    chromaticNotesArray, 
    diatonicIntervalsArray, 
    semitoneStepsArray, 
    modeScaleDegreesMap, 
    degreeMapObject
) {
    // Determine current mode's scale degrees based on whiteRingDiatonicIndex
    const degreeAtTop = diatonicIntervalsArray[diatonicDegreeIndicesArray[whiteRingDiatonicIndex]];
    const mappedDegree = degreeMapObject[degreeAtTop];
    const scaleDegreeIndices = modeScaleDegreesMap[mappedDegree] || [];
  
    // Rotate diatonicIntervals by degreeRotationIndex
    const degreeRotationIndex = diatonicDegreeIndicesArray[whiteRingDiatonicIndex];
    const rotatedDegree = rotateArray(diatonicIntervalsArray, degreeRotationIndex);

    // Create indices for highlighting diatonic positions
    const highlightIndices = diatonicDegreeIndices.map(
        index => (index - degreeRotationIndex + 12) % 12
    );

    // Create degreeBelt with rotated highlight positions
    createBelt('degreeBelt', rotatedDegree, 0, highlightIndices, 'scale-degree-yellow');
  
    // Rotate chromaticNotes based on greyRingRotation
    const pitchRotationIndex = getIndexAtTop(greyRingRotation);
    const rotatedPitch = rotateArray(chromaticNotesArray, pitchRotationIndex);
  
    // Create pitchBelt
    createBelt('pitchBelt', rotatedPitch, 0, scaleDegreeIndices);
  
    // Create chromaticBelt
    createBelt('chromaticBelt', semitoneStepsArray, 0, scaleDegreeIndices, 'scale-degree-red');
  }
  
  // ===== EXPORTS =====
  export {
    rotateArray,
    getIndexAtTop,
    createBelt,
    updateBelts,
    normalizeAngle
  };
  
