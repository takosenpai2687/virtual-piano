# Virtual Piano - Vue3 + TypeScript Edition

A modern, refactored virtual piano application built with Vue 3, Vite, TypeScript, and Tailwind CSS.

## Features

- 🎹 **Interactive Piano**: 36 white keys spanning 3 octaves with realistic visual feedback
- 🎵 **Autoplay Mode**: Watch the piano play your favorite songs automatically
- 📝 **Multiple Sheets**: Choose from pre-loaded piano sheets via dropdown
- 📤 **MIDI Converter**: Upload and convert MIDI files directly in the browser (No more Go dependency!)
- 🎨 **Beautiful UI**: Smooth animations with falling note bubbles
- ⌨️ **Keyboard Support**: Play using your computer keyboard
- 🎬 **Video Background**: Synchronized video playback for select songs
- 📱 **Touch Support**: Works on touch devices

## Controls

### Keyboard Mapping
- **White Keys (C2-C6)**: `1234567890qwertyuiopasdfghjklzxcvbnm`
- **Black Keys**: Hold `Shift` + white key letter
- **Play/Pause**: `Space` or click the play button

### Mouse/Touch
- Click or tap on piano keys to play notes
- Drag across keys for smooth playing

## Getting Started

### Prerequisites
- Node.js 18+ (20.19+ or 22.12+ recommended)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── PianoCanvas.vue      # Main piano component
│   └── MidiUploader.vue     # MIDI file upload & conversion
├── services/
│   ├── pianoEngine.ts       # Core piano logic
│   └── midiConverter.ts     # MIDI file parser (replaces Go utility)
├── data/
│   ├── sheets.ts            # Sheet registry
│   └── sheets/              # Individual sheet data (JSON)
│       ├── unravel.json
│       ├── flower_dance.json
│       ├── luv_letter.json
│       ├── mywar.json
│       └── senbonzakura.json
├── types/
│   └── piano.ts             # TypeScript type definitions
├── App.vue
└── main.ts
```

## MIDI Conversion

### Browser-Based (New!)
1. Click "Upload MIDI" button in the top center
2. Select a .mid or .midi file
3. Choose to:
   - Download as JSON
   - Download as JS (compatible with old format)
   - Play immediately in the app

### Adding Custom Sheets

After converting a MIDI file to JSON:

1. Save the JSON file to `src/data/sheets/`
2. Create a TypeScript file (e.g., `my_song.ts`):
```typescript
import type { MidiNote } from '@/types/piano';
import notes from './my_song.json';
export default notes as MidiNote[];
```

3. Register in `src/data/sheets.ts`:
```typescript
import mySongNotes from './sheets/my_song';

export const sheets: Record<string, PianoSheet> = {
  // ... existing sheets
  mySong: {
    name: 'My Song',
    notes: mySongNotes,
    videoUrl: 'res/videos/my_song.mp4' // optional
  }
};
```

## Technical Improvements

### What Changed from Original

1. **Framework**: Pure JS → Vue 3 + TypeScript
2. **Build Tool**: None → Vite
3. **Styling**: Inline CSS → Tailwind CSS
4. **Type Safety**: None → Full TypeScript coverage
5. **MIDI Conversion**: Go backend → Pure TypeScript in browser
6. **Component Architecture**: Single file → Modular Vue components
7. **State Management**: Global vars → Reactive Vue refs/computed
8. **Code Organization**: Single file → Organized service/component structure

### Key Technologies

- **Vue 3**: Composition API with `<script setup>`
- **TypeScript**: Full type safety across the codebase
- **Vite**: Lightning-fast HMR and optimized builds
- **Tailwind CSS**: Utility-first styling
- **Canvas API**: Piano rendering and animations
- **Web Audio API**: Sound playback

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- Optimized canvas rendering with requestAnimationFrame
- Efficient bubble management with array filtering
- Lazy loading of audio files
- No external runtime dependencies (Go removed!)

## Credits

Original pure JavaScript implementation by [@takosenpai2687](https://github.com/takosenpai2687)

Refactored to Vue3 + TypeScript with modern tooling and features.

## License

See LICENSE file.
