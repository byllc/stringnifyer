class StringGaugeCalculator {
  constructor() {
    // Semitone offsets from C
    this.noteOffsets = {
      'C': 0, 'C#': 1, 'DB': 1,
      'D': 2, 'D#': 3, 'EB': 3,
      'E': 4,
      'F': 5, 'F#': 6, 'GB': 6,
      'G': 7, 'G#': 8, 'AB': 8,
      'A': 9, 'A#': 10, 'BB': 10,
      'B': 11
    };
  }

  // Converts a note string (e.g., "C1", "Bb2") to frequency in Hz (A4 = 440Hz)
  noteToFrequency(noteStr) {
    const match = noteStr.trim().toUpperCase().match(/^([A-G][B#]?)(-?\d+)$/);
    if (!match) throw new Error(`Invalid note format: ${noteStr}`);

    const [, noteName, octaveStr] = match;
    const semitone = this.noteOffsets[noteName];
    const octave = parseInt(octaveStr, 10);

    if (semitone === undefined) throw new Error(`Unknown note name: ${noteName}`);

    // Calculate MIDI note number (C4 = 60)
    const midiNote = 12 * (octave + 1) + semitone;

    // Frequency formula
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  // Calculates required string gauge for a target note at equivalent tension
  calculateTargetGauge(currentNote, currentGauge, targetNote) {
    const fCurrent = this.noteToFrequency(currentNote);
    const fTarget = this.noteToFrequency(targetNote);

    // Constant-tension scaling: diameter is inversely proportional to frequency
    const targetGauge = currentGauge * (fCurrent / fTarget);
    return targetGauge;
  }
}

module.exports = StringGaugeCalculator;
