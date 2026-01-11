import * as Tone from 'tone';

export class ToneAudioService {
  private sampler: Tone.Sampler | null = null;
  private isInitialized = false;
  private activeNotes: Map<number, { note: string; time: number }> = new Map();

  constructor() {
    // Keep audio context running even when tab is inactive
    document.addEventListener('visibilitychange', () => {
      if (Tone.context.state === 'suspended') {
        Tone.context.resume();
      }
    });
  }

  // Map MIDI note numbers to note names
  private midiToNote(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor((midi - 12) / 12);
    const noteIndex = (midi - 12) % 12;
    return `${notes[noteIndex]}${octave}`;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create sampler first (without starting audio context)
      // Using Salamander Grand Piano samples (same as OnlinePianist)
      // MIDI numbers as filenames: 24.mp3 = C1, 36.mp3 = C2, 60.mp3 = C4 (Middle C), etc.
      this.sampler = new Tone.Sampler({
        urls: {
          C1: '24.mp3',
          F1: '29.mp3',
          C2: '36.mp3',
          F2: '41.mp3',
          C3: '48.mp3',
          F3: '53.mp3',
          C4: '60.mp3',
          E4: '64.mp3',
          F4: '65.mp3',
          A4: '69.mp3',
          C5: '72.mp3',
          F5: '77.mp3',
          G5: '79.mp3',
          C6: '84.mp3',
          C7: '96.mp3',
        },
        attack: 0.16,
        release: 1,
        volume: -8,
        baseUrl: 'https://assets.onlinepianist.com/player/sounds/',
        onload: () => {
          console.log('Salamander Grand Piano samples loaded successfully');
        },
      }).toDestination();

      // No reverb needed - Salamander samples already have natural room sound

      this.isInitialized = true;
      console.log('Tone.js sampler initialized (audio context will start on first interaction)');
    } catch (error) {
      console.error('Failed to initialize Tone.js sampler:', error);
      throw error;
    }
  }

  private async ensureAudioContextStarted(): Promise<void> {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log('Tone.js audio context started');
      } catch (error) {
        console.warn('Failed to start audio context:', error);
      }
    }
    
    // Force resume if suspended (e.g., tab was inactive)
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }
  }

  playNote(midiNote: number, velocity: number = 127): void {
    if (!this.sampler || !this.isInitialized) {
      console.warn('Sampler not initialized');
      return;
    }

    // Start audio context on first interaction
    this.ensureAudioContextStarted();

    const note = this.midiToNote(midiNote);
    
    // Convert MIDI velocity (0-127) to gain (0-1)
    const gain = velocity / 127;

    try {
      // Trigger attack with velocity
      this.sampler.triggerAttack(note, Tone.now(), gain);
      
      // Track active note
      this.activeNotes.set(midiNote, { note, time: Tone.now() });
    } catch (error) {
      console.error(`Failed to play note ${note}:`, error);
    }
  }

  releaseNote(midiNote: number): void {
    if (!this.sampler || !this.isInitialized) return;

    const activeNote = this.activeNotes.get(midiNote);
    if (!activeNote) return;

    try {
      // Trigger release
      this.sampler.triggerRelease(activeNote.note, Tone.now());
      this.activeNotes.delete(midiNote);
    } catch (error) {
      console.error(`Failed to release note ${activeNote.note}:`, error);
    }
  }

  stopAllNotes(): void {
    if (!this.sampler) return;

    try {
      this.sampler.releaseAll();
      this.activeNotes.clear();
    } catch (error) {
      console.error('Failed to stop all notes:', error);
    }
  }

  setVolume(_midiNote: number, _volume: number): void {
    // Tone.js handles volume through velocity on triggerAttack
    // This is a placeholder for compatibility
  }

  dispose(): void {
    if (this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }
    this.activeNotes.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const toneAudio = new ToneAudioService();
