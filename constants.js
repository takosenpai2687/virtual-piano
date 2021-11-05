const N_WHITE_KEYS = 36;
var WHITE_KEY_HEIGHT = 200;
var BLACK_KEY_HEIGHT = WHITE_KEY_HEIGHT * 0.618;
const BG_COLOR = "#0000005F";
const BLACK = "#000";
const WHITE = "#FFF";
const KEYDOWN_COLOR = "#F3C320";
const KB_FONT_SIZE = 20;
const KB_FONT = `${KB_FONT_SIZE}px Verdana`;
var WHITE_KEY_TEXT_MARGIN_TOP = WHITE_KEY_HEIGHT * 0.28;
var BLACK_KEY_TEXT_MARGIN_TOP = BLACK_KEY_HEIGHT * 0.32;
const SHADOW_BLUR = 15;
const COLOR_WHEEL = ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#fffffc"];
const KEYDOWN_SHADOW_COLOR = "#4fB0FF";

const MIN_VEL = 30;
const MAX_VEL = 127;
const VOLUME_DECAY_SPEED = 0.035;
const GOD_MODE = true;
const DEBUG = true;

const midiKeyToNote = {
    36: 'C2',
    37: 'C2#',
    38: 'D2',
    39: 'D2#',
    40: 'E2',
    41: 'F2',
    42: 'F2#',
    43: 'G2',
    44: 'G2#',
    45: 'A2',
    46: 'A2#',
    47: 'B2',

    48: 'C3',
    49: 'C3#',
    50: 'D3',
    51: 'D3#',
    52: 'E3',
    53: 'F3',
    54: 'F3#',
    55: 'G3',
    56: 'G3#',
    57: 'A3',
    58: 'A3#',
    59: 'B3',

    60: 'C4',
    61: 'C4#',
    62: 'D4',
    63: 'D4#',
    64: 'E4',
    65: 'F4',
    66: 'F4#',
    67: 'G4',
    68: 'G4#',
    69: 'A4',
    70: 'A4#',
    71: 'B4',

    72: 'C5',
    73: 'C5#',
    74: 'D5',
    75: 'D5#',
    76: 'E5',
    77: 'F5',
    78: 'F5#',
    79: 'G5',
    80: 'G5#',
    81: 'A5',
    82: 'A5#',
    83: 'B5',

    84: 'C6',
    85: 'C6#',
    86: 'D6',
    87: 'D6#',
    88: 'E6',
    89: 'F6',
    90: 'F6#',
    91: 'G6',
    92: 'G6#',
    93: 'A6',
    94: 'A6#',
    95: 'B6',

    96: 'C7'
};
const noteToKeyboard = {
    "C7": "m",

    "B6": "n",
    "A6": "b",
    "G6": "v",
    "F6": "c",
    "E6": "x",
    "D6": "z",
    "C6": "l",

    "B5": "k",
    "A5": "j",
    "G5": "h",
    "F5": "g",
    "E5": "f",
    "D5": "d",
    "C5": "s",

    "B4": "a",
    "A4": "p",
    "G4": "o",
    "F4": "i",
    "E4": "u",
    "D4": "y",
    "C4": "t",

    "B3": "r",
    "A3": "e",
    "G3": "w",
    "F3": "q",
    "E3": "0",
    "D3": "9",
    "C3": "8",

    "B2": "7",
    "A2": "6",
    "G2": "5",
    "F2": "4",
    "E2": "3",
    "D2": "2",
    "C2": "1",
};
