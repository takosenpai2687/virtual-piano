import type { PianoSheet, MidiNote } from '@/types/piano';
import { MidiConverter } from '@/services/midiConverter';

// Automatically discover all MIDI files in the public folder using Vite's glob import
const midiFiles = import.meta.glob('/public/*.mid', {
  eager: false,
  query: '?url',
  import: 'default'
});

let baseSheets: Record<string, PianoSheet> = {};
let sheetsLoaded = false;

// Load MIDI files from public folder
export const loadDefaultSheets = async (): Promise<void> => {
  if (sheetsLoaded) return;

  const loadedSheets: Record<string, PianoSheet> = {};

  // Get all MIDI file paths
  const midiFilePaths = Object.keys(midiFiles);

  for (const filePath of midiFilePaths) {
    try {
      // Extract filename from path
      const fileName = filePath.split('/').pop() || '';

      // Fetch the MIDI file
      const response = await fetch(`/${fileName}`);
      if (!response.ok) {
        console.warn(`Failed to load ${fileName}`);
        continue;
      }

      const buffer = await response.arrayBuffer();
      const notes = await MidiConverter.parseMidiFile(buffer);

      // Generate a key from the filename (remove extension, replace spaces/special chars)
      const key = fileName
        .replace(/\.(mid|midi)$/i, '')
        .replace(/[\s.-]/g, '_') // Replace spaces, dots, and hyphens with underscores
        .toLowerCase();

      // Extract display name (remove extension only, keep full name)
      const name = fileName.replace(/\.(mid|midi)$/i, '');

      loadedSheets[key] = {
        name,
        notes
      };
    } catch (err) {
      console.error(`Failed to parse MIDI file ${filePath}:`, err);
    }
  }

  baseSheets = loadedSheets;
  sheetsLoaded = true;

  // Update the sheets object after loading
  sheets = getAllSheets();
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

export const getSheetNames = (): string[] => {
  return Object.keys(sheets).sort((a, b) => {
    const nameA = sheets[a]?.name || a;
    const nameB = sheets[b]?.name || b;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });
};
export const getSheet = (key: string): PianoSheet | undefined => sheets[key];
