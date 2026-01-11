// MIDI Note and Piano Types
export interface MidiNote {
  TimeMs: number;
  Key: number;
  DurationMs: number;
  Vel: number;
}

export interface PianoSheet {
  name: string;
  notes: MidiNote[];
}

export interface KeyboardRect {
  index: number;
  isBlack: boolean;
  wkIndex: number | null;
  bkIndex: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  text: string | null;
}

export interface Bubble {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  keyboardRectIndex: number;
}

export interface AudioElement extends HTMLAudioElement {
  volume: number;
}

// Constants
export const N_WHITE_KEYS = 36;
export const BG_COLOR = '#0000004a';
export const BLACK = '#000';
export const WHITE = '#FFF';
export const KB_FONT_SIZE = 20;
export const KB_FONT = `bold ${KB_FONT_SIZE}px Verdana`;
export const SHADOW_BLUR = 15;
export const COLOR_WHEEL = [
  '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf',
  '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc'
];
export const MIN_VEL = 66;
export const MAX_VEL = 127;
export const VOLUME_DECAY_SPEED = 0.035;

// Mapping objects
export const midiKeyToNote: Record<number, string> = {
  36: 'C2', 37: 'C2#', 38: 'D2', 39: 'D2#', 40: 'E2', 41: 'F2',
  42: 'F2#', 43: 'G2', 44: 'G2#', 45: 'A2', 46: 'A2#', 47: 'B2',
  48: 'C3', 49: 'C3#', 50: 'D3', 51: 'D3#', 52: 'E3', 53: 'F3',
  54: 'F3#', 55: 'G3', 56: 'G3#', 57: 'A3', 58: 'A3#', 59: 'B3',
  60: 'C4', 61: 'C4#', 62: 'D4', 63: 'D4#', 64: 'E4', 65: 'F4',
  66: 'F4#', 67: 'G4', 68: 'G4#', 69: 'A4', 70: 'A4#', 71: 'B4',
  72: 'C5', 73: 'C5#', 74: 'D5', 75: 'D5#', 76: 'E5', 77: 'F5',
  78: 'F5#', 79: 'G5', 80: 'G5#', 81: 'A5', 82: 'A5#', 83: 'B5',
  84: 'C6', 85: 'C6#', 86: 'D6', 87: 'D6#', 88: 'E6', 89: 'F6',
  90: 'F6#', 91: 'G6', 92: 'G6#', 93: 'A6', 94: 'A6#', 95: 'B6',
  96: 'C7'
};

export const noteToKeyboard: Record<string, string> = {
  'C7': 'm', 'B6': 'n', 'A6': 'b', 'G6': 'v', 'F6': 'c', 'E6': 'x', 'D6': 'z', 'C6': 'l',
  'B5': 'k', 'A5': 'j', 'G5': 'h', 'F5': 'g', 'E5': 'f', 'D5': 'd', 'C5': 's',
  'B4': 'a', 'A4': 'p', 'G4': 'o', 'F4': 'i', 'E4': 'u', 'D4': 'y', 'C4': 't',
  'B3': 'r', 'A3': 'e', 'G3': 'w', 'F3': 'q', 'E3': '0', 'D3': '9', 'C3': '8',
  'B2': '7', 'A2': '6', 'G2': '5', 'F2': '4', 'E2': '3', 'D2': '2', 'C2': '1'
};
