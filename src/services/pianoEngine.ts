import type { MidiNote, Bubble, KeyboardRect } from '@/types/piano';
import {
  N_WHITE_KEYS,
  MIN_VEL,
  MAX_VEL,
  COLOR_WHEEL,
  midiKeyToNote,
  noteToKeyboard,
  BLACK,
  WHITE
} from '@/types/piano';
import { toneAudio } from './toneAudio';

export { toneAudio };

export class PianoEngine {
  private currentMidiKeys: number[] = [];
  private audioLoaded = false;
  private cvHeight = 0;
  private whiteKeyWidth = 0;
  private blackKeyWidth = 0;
  private whiteKeyHeight = 0;
  private blackKeyHeight = 0;

  constructor() {}

  async initSounds(): Promise<void> {
    if (this.audioLoaded) return;

    try {
      await toneAudio.init();
      this.audioLoaded = true;
      console.log('Audio system ready');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      // Don't throw - allow keyboard to render even if audio fails
      this.audioLoaded = false;
    }
  }

  playSound(midiKey: number, vel: number): void {
    try {
      toneAudio.playNote(midiKey, vel);
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  }

  updateVolumes(_sustain: boolean): void {
    // Tone.js handles volume decay naturally through release
    // This method can be kept for compatibility but doesn't need to do anything
  }

  addCurrentKey(midiKey: number): void {
    if (!this.currentMidiKeys.includes(midiKey)) {
      this.currentMidiKeys.push(midiKey);
    }
  }

  removeCurrentKey(midiKey: number): void {
    const wasPressed = this.currentMidiKeys.includes(midiKey);
    this.currentMidiKeys = this.currentMidiKeys.filter((k) => k !== midiKey);

    // Release the note in Tone.js when key is removed
    if (wasPressed) {
      toneAudio.releaseNote(midiKey);
    }
  }

  removeCurrentKeyVisual(midiKey: number): void {
    // Remove from visual tracking only, without releasing audio
    this.currentMidiKeys = this.currentMidiKeys.filter((k) => k !== midiKey);
  }

  getCurrentKeys(): number[] {
    return [...this.currentMidiKeys];
  }

  clearCurrentKeys(): void {
    // Release all currently pressed keys
    this.currentMidiKeys.forEach((key) => toneAudio.releaseNote(key));
    this.currentMidiKeys = [];
  }

  setKeyVolume(_midiKey: number, _volume: number): void {
    // Tone.js handles volume through velocity on note trigger
    // This method kept for compatibility
  }

  preprocessMidiNotes(notes: MidiNote[]): MidiNote[] {
    let maxVel = 0;
    let minVel = 127;

    notes.forEach((n) => {
      if (n.Vel < minVel) minVel = n.Vel;
      if (n.Vel > maxVel) maxVel = n.Vel;
    });

    return notes.map((note) => ({
      ...note,
      Vel: MIN_VEL + ((note.Vel - minVel) / (maxVel - minVel)) * (MAX_VEL - MIN_VEL)
    }));
  }

  createBubbles(notes: MidiNote[], keyboardRects: KeyboardRect[]): Bubble[] {
    const validNotes = notes.filter((n) => n.Key >= 36 && n.Key <= 96);
    const whiteKeyWidth = keyboardRects[0]?.width || 0;
    const blackKeyWidth = keyboardRects.find((r) => r.isBlack)?.width || 0;

    const bubbles: Bubble[] = validNotes.map((midi) => {
      const keyboardRect = keyboardRects[midi.Key - 36];
      const width = whiteKeyWidth - blackKeyWidth;
      const height = midi.DurationMs;
      const x = keyboardRect.x + keyboardRect.width / 2 - width / 2;
      const y = -(midi.TimeMs + midi.DurationMs);

      return {
        x,
        y,
        width,
        height,
        color: COLOR_WHEEL[midi.Key % COLOR_WHEEL.length],
        keyboardRectIndex: midi.Key - 36
      };
    });

    return bubbles.sort((a, b) => b.y - a.y);
  }

  updateBubbles(bubbles: Bubble[], keyboardRects: KeyboardRect[], dt: number): Bubble[] {
    const whiteKeyWidth = keyboardRects[0]?.width || 0;
    const blackKeyWidth = keyboardRects.find((r) => r.isBlack)?.width || 0;
    const maxY = this.cvHeight - this.whiteKeyHeight;

    return bubbles
      .map((b) => {
        const keyboardRect = keyboardRects[b.keyboardRectIndex];
        return {
          ...b,
          width: whiteKeyWidth - blackKeyWidth,
          x: keyboardRect.x + keyboardRect.width / 2 - (whiteKeyWidth - blackKeyWidth) / 2,
          y: b.y + dt
        };
      })
      .filter((b) => b.y < maxY);
  }

  setDimensions(width: number, height: number): void {
    // Width and height are used to calculate keyboard dimensions
    this.cvHeight = height;
    this.whiteKeyWidth = width / N_WHITE_KEYS;
    this.blackKeyWidth = this.whiteKeyWidth * 0.58;
    this.whiteKeyHeight = height * 0.27;
    this.blackKeyHeight = this.whiteKeyHeight * 0.618;
  }

  createKeyboardRects(): KeyboardRect[] {
    const keyboardRects: KeyboardRect[] = [];

    // Add White Keys
    for (let i = 0; i < N_WHITE_KEYS; i++) {
      keyboardRects.push({
        index: i,
        isBlack: false,
        wkIndex: i,
        bkIndex: null,
        x: i * this.whiteKeyWidth,
        y: this.cvHeight - this.whiteKeyHeight,
        width: this.whiteKeyWidth,
        height: this.whiteKeyHeight,
        fillStyle: WHITE,
        strokeStyle: BLACK,
        lineWidth: 1.5,
        text: null
      });
    }

    // Add Black Keys
    for (let i = 0; i < 5; i++) {
      const offsetX = (i * 7 + 1) * this.whiteKeyWidth - this.blackKeyWidth / 2;
      const bKeysTmp: KeyboardRect[] = [];

      for (let j = 0; j < 5; j++) {
        bKeysTmp.push({
          index: 0,
          isBlack: true,
          wkIndex: null,
          bkIndex: i * 5 + j,
          x: 0,
          y: this.cvHeight - this.whiteKeyHeight,
          width: this.blackKeyWidth,
          height: this.blackKeyHeight,
          fillStyle: BLACK,
          strokeStyle: BLACK,
          lineWidth: 1.0,
          text: null
        });
      }

      bKeysTmp[0].x = offsetX; // C#
      bKeysTmp[1].x = offsetX + this.whiteKeyWidth; // D#
      bKeysTmp[2].x = offsetX + 3 * this.whiteKeyWidth; // F#
      bKeysTmp[3].x = offsetX + 4 * this.whiteKeyWidth; // G#
      bKeysTmp[4].x = offsetX + 5 * this.whiteKeyWidth; // A#

      keyboardRects.push(...bKeysTmp);
    }

    // Sort by x-coord and set index
    keyboardRects.sort((a, b) => a.x - b.x);
    keyboardRects.forEach((r, i) => {
      r.index = i;
      const note = midiKeyToNote[i + 36];
      r.text = noteToKeyboard[note.slice(0, 2)]?.toUpperCase() || null;
    });

    return keyboardRects;
  }

  resolveKeyByMouse(x: number, y: number, keyboardRects: KeyboardRect[]): number | null {
    const wkIndex = Math.floor(x / this.whiteKeyWidth);
    let keysToCheck: number[] = [];

    if (wkIndex === 0) {
      keysToCheck = [0, 1];
    } else if (wkIndex === 35) {
      keysToCheck = [60];
    } else {
      const realIndex = keyboardRects.findIndex((e) => e.wkIndex === wkIndex);
      if (realIndex >= 0) {
        keysToCheck = [realIndex, realIndex - 1, realIndex + 1];
      }
    }

    for (const k of keysToCheck) {
      if (this.isWithinRect({ x, y }, keyboardRects[k])) {
        return k + 36;
      }
    }
    return null;
  }

  resolveKeyByKeyboard(key: string, shiftKey: boolean): number | null {
    const lowerKey = key.toLowerCase();
    if (!Object.values(noteToKeyboard).includes(lowerKey)) return null;

    const rawNote = Object.keys(noteToKeyboard).find((k) => noteToKeyboard[k] === lowerKey);
    if (!rawNote) return null;

    const note = shiftKey ? `${rawNote}#` : rawNote;
    const midiKey = Number(
      Object.keys(midiKeyToNote).find((k) => midiKeyToNote[Number(k)] === note)
    );

    return isNaN(midiKey) ? null : midiKey;
  }

  private isWithinRect(pos: { x: number; y: number }, rect: KeyboardRect): boolean {
    return (
      pos.x >= rect.x &&
      pos.x < rect.x + rect.width &&
      pos.y >= rect.y &&
      pos.y < rect.y + rect.height
    );
  }
}
