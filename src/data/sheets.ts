import type { PianoSheet, MidiNote } from '@/types/piano';
import { MidiConverter } from '@/services/midiConverter';

// Automatically discover all MIDI files in the public folder using Vite's glob import
const midiFiles = import.meta.glob('/public/*.mid', {
  eager: false,
  query: '?url',
  import: 'default'
});

let baseSheets: Record<string, PianoSheet> = {};
const loadedSheets: Set<string> = new Set();
const loadingSheets: Map<string, Promise<PianoSheet | null>> = new Map();

// Get available MIDI file list without loading them
export const getAvailableMidiFiles = (): string[] => {
  return Object.keys(midiFiles).map((filePath) => {
    const fileName = filePath.split('/').pop() || '';
    const key = fileName
      .replace(/\.(mid|midi)$/i, '')
      .replace(/[\s.-]/g, '_')
      .toLowerCase();
    return key;
  });
};

// Lazy load a single MIDI file by key
export const loadSheetByKey = async (key: string): Promise<PianoSheet | null> => {
  // If already loaded (has notes), return immediately
  if (baseSheets[key] && baseSheets[key].notes.length > 0) {
    return baseSheets[key];
  }

  // If currently loading, wait for that promise
  if (loadingSheets.has(key)) {
    return loadingSheets.get(key)!;
  }

  // Start loading
  const loadPromise = (async () => {
    try {
      // Find the matching MIDI file
      const midiFilePaths = Object.keys(midiFiles);
      const matchingPath = midiFilePaths.find((filePath) => {
        const fileName = filePath.split('/').pop() || '';
        const fileKey = fileName
          .replace(/\.(mid|midi)$/i, '')
          .replace(/[\s.-]/g, '_')
          .toLowerCase();
        return fileKey === key;
      });

      if (!matchingPath) {
        console.warn(`MIDI file not found for key: ${key}`);
        return null;
      }

      const fileName = matchingPath.split('/').pop() || '';

      // Fetch the MIDI file
      const response = await fetch(`/${fileName}`);
      if (!response.ok) {
        console.warn(`Failed to load ${fileName}`);
        return null;
      }

      const buffer = await response.arrayBuffer();
      const notes = await MidiConverter.parseMidiFile(buffer);

      // Extract display name (remove extension only, keep full name)
      const name = fileName.replace(/\.(mid|midi)$/i, '');

      const sheet: PianoSheet = {
        name,
        notes
      };

      // Cache the loaded sheet
      baseSheets[key] = sheet;
      loadedSheets.add(key);
      sheets = getAllSheets();

      return sheet;
    } catch (err) {
      console.error(`Failed to parse MIDI file for key ${key}:`, err);
      return null;
    } finally {
      loadingSheets.delete(key);
    }
  })();

  loadingSheets.set(key, loadPromise);
  return loadPromise;
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

// Initialize sheets with available MIDI files metadata only (no loading)
const initializeSheetMetadata = () => {
  const availableMidiKeys = getAvailableMidiFiles();

  // Create placeholder entries for available MIDI files
  availableMidiKeys.forEach((key) => {
    if (!baseSheets[key]) {
      // Find the original filename to get the display name
      const midiFilePaths = Object.keys(midiFiles);
      const matchingPath = midiFilePaths.find((filePath) => {
        const fileName = filePath.split('/').pop() || '';
        const fileKey = fileName
          .replace(/\.(mid|midi)$/i, '')
          .replace(/[\s.-]/g, '_')
          .toLowerCase();
        return fileKey === key;
      });

      if (matchingPath) {
        const fileName = matchingPath.split('/').pop() || '';
        const name = fileName.replace(/\.(mid|midi)$/i, '');

        // Create placeholder with empty notes array
        baseSheets[key] = {
          name,
          notes: []
        };
      }
    }
  });
};

// Initialize on module load
initializeSheetMetadata();

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
