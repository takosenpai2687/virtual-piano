// Import existing playlist files
import unravelNotes from './sheets/unravel';
import flowerDanceNotes from './sheets/flower_dance';
import luvLetterNotes from './sheets/luv_letter';
import mywarNotes from './sheets/mywar';
import senbonzakuraNotes from './sheets/senbonzakura';
import type { PianoSheet } from '@/types/piano';

export const sheets: Record<string, PianoSheet> = {
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

export const getSheetNames = (): string[] => Object.keys(sheets);
export const getSheet = (key: string): PianoSheet | undefined => sheets[key];
