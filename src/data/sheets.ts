// Import existing playlist files
import unravelNotes from './sheets/unravel';
import flowerDanceNotes from './sheets/flower_dance';
import luvLetterNotes from './sheets/luv_letter';
import mywarNotes from './sheets/mywar';
import senbonzakuraNotes from './sheets/senbonzakura';
import type { PianoSheet } from '@/types/piano';

const baseSheets: Record<string, PianoSheet> = {
  unravel: {
    name: 'Unravel',
    notes: unravelNotes
  },
  flowerDance: {
    name: 'Flower Dance',
    notes: flowerDanceNotes
  },
  luvLetter: {
    name: 'Luv Letter',
    notes: luvLetterNotes
  },
  mywar: {
    name: 'My War',
    notes: mywarNotes
  },
  senbonzakura: {
    name: 'Senbonzakura',
    notes: senbonzakuraNotes
  }
};

// Load custom sheets from localStorage
export const loadCustomSheets = (): Record<string, PianoSheet> => {
  try {
    const savedSheetsJson = localStorage.getItem('customSheets');
    if (savedSheetsJson) {
      return JSON.parse(savedSheetsJson);
    }
  } catch (err) {
    console.error('Failed to load custom sheets:', err);
  }
  return {};
};

// Merge base sheets with custom sheets
export const getAllSheets = (): Record<string, PianoSheet> => {
  return {
    ...baseSheets,
    ...loadCustomSheets()
  };
};

export let sheets: Record<string, PianoSheet> = getAllSheets();

// Function to reload sheets (call this after saving a new custom sheet)
export const reloadSheets = () => {
  sheets = getAllSheets();
};

export const getSheetNames = (): string[] => Object.keys(sheets);
export const getSheet = (key: string): PianoSheet | undefined => sheets[key];
