<template>
  <!-- Sheet Music Display (五线谱) at top center -->
  <div class="sheet-display-wrapper">
    <div ref="containerRef" class="vexflow-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { Stave, StaveNote, Voice, Formatter, Renderer, Accidental } from 'vexflow';
import type { PianoSheet } from '@/types/piano';

interface Props {
  sheet: PianoSheet | null;
  currentTime: number;
  isPlaying: boolean;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLDivElement | null>(null);
let renderer: Renderer | null = null;
let animationFrameId: number | null = null;

// Display constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 240;
const STAVE_WIDTH = 350;
const STAVE_X_START = 10;
const TREBLE_STAVE_Y = 20;
const BASS_STAVE_Y = 120;
const SECONDS_PER_STAVE = 4; // Each stave shows 4 seconds
const STAVE_SPACING = 20;
const MIDDLE_C = 60;
const CENTER_MARKER_X = CANVAS_WIDTH / 2; // Center position for current note indicator
const VISIBLE_WINDOW_BEFORE = 4; // Show 4 seconds before current time
const VISIBLE_WINDOW_AFTER = 8; // Show 8 seconds after current time

// Convert MIDI number to VexFlow note string
// VexFlow uses lowercase note names without sharp/flat in key string
// Accidentals are added separately via Accidental modifier
// Format: "c/4" not "C#/4"
const midiToVexFlowNote = (midiNum: number): string => {
  // Note names without accidentals (naturals only)
  const noteNames = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b'];
  const octave = Math.floor(midiNum / 12) - 1;
  const noteName = noteNames[midiNum % 12];
  return `${noteName}/${octave}`;
};

// Determine note duration for VexFlow (w, h, q, 8, 16)
const getDuration = (durationMs: number): string => {
  if (durationMs >= 1500) return 'h'; // Half note
  if (durationMs >= 700) return 'q'; // Quarter note
  if (durationMs >= 300) return '8'; // Eighth note
  return '16'; // Sixteenth note
};

// Check if a MIDI number is a black key (needs accidental)
const isBlackKey = (midiNum: number): boolean => {
  const note = midiNum % 12;
  return [1, 3, 6, 8, 10].includes(note); // C#, D#, F#, G#, A#
};

// Group notes into staves for rendering
interface StaveGroup {
  startTime: number;
  endTime: number;
  notes: PianoSheet['notes'];
}

const groupNotesIntoStaves = (notes: PianoSheet['notes'], startTime: number, endTime: number): StaveGroup[] => {
  const staves: StaveGroup[] = [];
  const totalDuration = endTime - startTime;
  const numStaves = Math.max(1, Math.ceil(totalDuration / (SECONDS_PER_STAVE * 1000)));
  
  for (let i = 0; i < Math.min(numStaves, 3); i++) { // Limit to 3 staves max
    const staveStartTime = startTime + (i * SECONDS_PER_STAVE * 1000);
    const staveEndTime = staveStartTime + (SECONDS_PER_STAVE * 1000);
    
    // Filter notes and limit to max 8 notes per stave to avoid "too many ticks"
    const staveNotes = notes
      .filter(note => note.TimeMs >= staveStartTime && note.TimeMs < staveEndTime)
      .slice(0, 8); // Limit notes per stave
    
    if (staveNotes.length > 0 || i === 0) {
      staves.push({
        startTime: staveStartTime,
        endTime: staveEndTime,
        notes: staveNotes
      });
    }
  }
  
  return staves;
};

// Render the sheet music using VexFlow
const render = () => {
  if (!containerRef.value || !props.sheet) return;
  
  // Clear previous render
  containerRef.value.innerHTML = '';
  
  try {
    // Create SVG renderer
    renderer = new Renderer(containerRef.value, Renderer.Backends.SVG);
    renderer.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
    const context = renderer.getContext();
    
    // Calculate visible time range (centered on current time)
    const startTime = props.currentTime - (VISIBLE_WINDOW_BEFORE * 1000);
    const endTime = props.currentTime + (VISIBLE_WINDOW_AFTER * 1000);
    
    // Get notes in visible range
    const visibleNotes = props.sheet.notes.filter(note => {
      return note.TimeMs >= startTime - 1000 && note.TimeMs <= endTime;
    });
    
    if (visibleNotes.length === 0) {
      // Draw empty grand staff if no notes
      const trebleStave = new Stave(STAVE_X_START, TREBLE_STAVE_Y, STAVE_WIDTH);
      trebleStave.addClef('treble').addTimeSignature('4/4');
      trebleStave.setContext(context).draw();
      
      const bassStave = new Stave(STAVE_X_START, BASS_STAVE_Y, STAVE_WIDTH);
      bassStave.addClef('bass').addTimeSignature('4/4');
      bassStave.setContext(context).draw();
      return;
    }
    
    // Calculate smooth scrolling offset
    // Notes scroll from right to left, current time stays at CENTER_MARKER_X
    const pixelsPerMs = (STAVE_WIDTH - 100) / (SECONDS_PER_STAVE * 1000);
    
    // Group notes into staves
    const staves = groupNotesIntoStaves(visibleNotes, startTime, endTime);
    
    // Render each grand staff (treble + bass)
    staves.forEach((staveData, index) => {
      // Calculate X position with smooth scrolling
      const staveTimeOffset = staveData.startTime - props.currentTime;
      const scrollOffset = staveTimeOffset * pixelsPerMs;
      const xPos = CENTER_MARKER_X + scrollOffset;
      
      // Create treble staff
      const trebleStave = new Stave(xPos, TREBLE_STAVE_Y, STAVE_WIDTH);
      if (index === 0) {
        trebleStave.addClef('treble').addTimeSignature('4/4');
      }
      trebleStave.setContext(context).draw();
      
      // Create bass staff
      const bassStave = new Stave(xPos, BASS_STAVE_Y, STAVE_WIDTH);
      if (index === 0) {
        bassStave.addClef('bass').addTimeSignature('4/4');
      }
      bassStave.setContext(context).draw();
      
      // Split notes between treble and bass staves
      // Notes >= middle C (60) go to treble, notes < 60 go to bass
      const trebleNotes: StaveNote[] = [];
      const bassNotes: StaveNote[] = [];
      
      staveData.notes.forEach(note => {
        const noteName = midiToVexFlowNote(note.Key);
        const duration = getDuration(note.DurationMs);
        
        // Determine if note is currently playing
        const isActive = note.TimeMs <= props.currentTime && 
                        (note.TimeMs + note.DurationMs) >= props.currentTime;
        
        try {
          const staveNote = new StaveNote({
            keys: [noteName],
            duration: duration,
            clef: note.Key >= MIDDLE_C ? 'treble' : 'bass'
          });
          
          // Add accidental if it's a black key
          if (isBlackKey(note.Key)) {
            staveNote.addModifier(new Accidental('#'), 0);
          }
          
          // Color notes based on state
          if (isActive) {
            staveNote.setStyle({ fillStyle: '#ff4444', strokeStyle: '#ff4444' });
          } else if (note.TimeMs < props.currentTime) {
            staveNote.setStyle({ fillStyle: '#999', strokeStyle: '#999' });
          } else {
            staveNote.setStyle({ fillStyle: '#000', strokeStyle: '#000' });
          }
          
          // Add to appropriate staff
          if (note.Key >= MIDDLE_C) {
            trebleNotes.push(staveNote);
          } else {
            bassNotes.push(staveNote);
          }
        } catch (e) {
          console.error('Failed to create note:', {
            noteName,
            duration,
            midiKey: note.Key,
            error: e
          });
        }
      });
      
      // Draw treble notes
      if (trebleNotes.length > 0) {
        try {
          Formatter.FormatAndDraw(context, trebleStave, trebleNotes);
        } catch (e) {
          console.error('Failed to draw treble notes:', e);
        }
      }
      
      // Draw bass notes
      if (bassNotes.length > 0) {
        try {
          Formatter.FormatAndDraw(context, bassStave, bassNotes);
        } catch (e) {
          console.error('Failed to draw bass notes:', e);
        }
      }
      
    });
    
    // Draw center highlight area (current measure background)
    context.save();
    context.setFillStyle('rgba(255, 255, 200, 0.15)');
    context.fillRect(CENTER_MARKER_X - 40, TREBLE_STAVE_Y - 10, 80, BASS_STAVE_Y + 80 - TREBLE_STAVE_Y);
    context.restore();
    
    // Draw current position indicator (vertical red line at center)
    context.save();
    context.setStrokeStyle('#ff3333');
    context.setLineWidth(3);
    context.beginPath();
    context.moveTo(CENTER_MARKER_X, TREBLE_STAVE_Y - 10);
    context.lineTo(CENTER_MARKER_X, BASS_STAVE_Y + 70);
    context.stroke();
    context.restore();
    
  } catch (error) {
    console.error('VexFlow rendering error:', error);
  }
};

// Setup and animation loop
let lastRenderTime = 0;
const RENDER_THROTTLE = 50; // Render every 50ms for smooth 20fps sheet music

onMounted(() => {
  const animate = (timestamp: number) => {
    if (props.isPlaying && timestamp - lastRenderTime >= RENDER_THROTTLE) {
      render();
      lastRenderTime = timestamp;
    }
    animationFrameId = requestAnimationFrame(animate);
  };
  
  // Initial render
  render();
  
  // Start animation loop
  requestAnimationFrame(animate);
});

// Watch for changes
watch(() => [props.sheet, props.currentTime, props.isPlaying], () => {
  if (!props.isPlaying) {
    render();
  }
}, { deep: true });

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.sheet-display-wrapper {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(250, 250, 255, 0.98);
  border: 2px solid rgba(100, 100, 255, 0.5);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.vexflow-container {
  width: 1200px;
  height: 240px;
}

.vexflow-container :deep(svg) {
  background: white;
  border-radius: 4px;
}
</style>
