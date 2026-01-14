<template>
  <div class="fixed inset-0 bg-gray-900 overflow-hidden select-none">
    <!-- Star Background Component -->
    <StarBackground />

    <!-- Animated Electric Wave Border -->
    <canvas v-if="!isLandscapeMobile" ref="waveCanvasRef" class="wave-border-canvas"></canvas>

    <!-- Canvas for Piano -->
    <canvas
      ref="canvasRef"
      class="absolute w-full h-full z-10"
      @mousedown="keyboardInteraction?.onMouseDown"
      @mouseup="keyboardInteraction?.onMouseUp"
      @mousemove="keyboardInteraction?.onMouseMove"
      @touchstart="keyboardInteraction?.onMouseDown"
      @touchend="keyboardInteraction?.onMouseUp"
      @touchmove="keyboardInteraction?.onMouseMove"
      @contextmenu.prevent
    />

    <!-- Control Panel Component -->
    <ControlPanel
      :is-playing="isPlaying"
      :playback-speed="playbackSpeed"
      :volume="volume"
      :volume-icon="volumeIcon"
      :selected-sheet-key="selectedSheetKey"
      :sheet-keys="sheetKeys"
      :all-sheets="getAllSheets()"
      :play-mode-icon="playModeIcon"
      :play-mode-title="playModeTitle"
      @stop="stop"
      @previous-song="previousSong"
      @next-song="nextSong"
      @toggle-play-pause="togglePlayPause"
      @cycle-speed="cycleSpeed"
      @update-volume="
        (v) => {
          volume = v;
          updateVolume();
        }
      "
      @sheet-change="
        (key) => {
          selectedSheetKey = key;
          onSheetChange();
        }
      "
      @delete-sheet="deleteCustomSheet"
      @cycle-play-mode="cyclePlayMode"
      @notes-converted="onNotesConverted"
      @sheet-saved="onSheetSaved"
    />

    <!-- Progress Bar Component -->
    <ProgressBar
      :progress-percentage="progressPercentage"
      :playback-time="playbackTime"
      :total-duration="totalDuration"
      :format-time="formatTime"
      @seek="setTime"
    />

    <!-- Debug Text -->
    <div
      v-if="debugText && !isPlaying"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 font-bold z-0 pointer-events-none select-none tracking-widest whitespace-nowrap"
      style="font-size: 2.5rem"
    >
      {{ debugText }}
    </div>

    <!-- GitHub Link -->
    <a
      href="https://github.com/takosenpai2687/virtual-piano"
      target="_blank"
      rel="noopener noreferrer"
      class="github-link fixed flex items-center justify-center rounded-full bg-gray-900/60 backdrop-blur-md border border-gray-700 text-gray-300 hover:text-white transition-all z-50 group"
      style="top: 1vh; right: 1vh; width: 5vh; height: 5vh; min-width: 40px; min-height: 40px"
    >
      <i class="fab fa-github" style="font-size: 2.2vh"></i>
    </a>

    <!-- Rotate Prompt Component -->
    <RotatePrompt :show="showRotatePrompt" />
  </div>
</template>

<style scoped>
/* GitHub Link Styles */
.github-link {
  transition: all 0.3s ease;
}

.github-link:hover {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px) brightness(1.2);
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.4),
    0 0 40px rgba(255, 255, 255, 0.2),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.4);
}

.github-link:active {
  transform: scale(0.95);
}

/* Play Mode Icon Animation */
@keyframes playModeIconPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { PianoEngine, toneAudio } from '@/services/pianoEngine';
import { sheets, getSheetNames, reloadSheets, getAllSheets, loadSheetByKey } from '@/data/sheets';
import ControlPanel from './ControlPanel.vue';
import ProgressBar from './ProgressBar.vue';
import RotatePrompt from './RotatePrompt.vue';
import StarBackground from './StarBackground.vue';
import * as Tone from 'tone';

// Import composables
import { useParticleEffects } from '@/composables/useParticleEffects';
import { useBackgroundEffects } from '@/composables/useBackgroundEffects';
import { useNoteVisualization } from '@/composables/useNoteVisualization';
import { useWaveAnimation } from '@/composables/useWaveAnimation';
import { usePlaybackControls } from '@/composables/usePlaybackControls';
import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useKeyboardInteraction } from '@/composables/useKeyboardInteraction';

import type { MidiNote, KeyboardRect, Bubble } from '@/types/piano';
import {
  BG_COLOR,
  WHITE,
  BLACK,
  KB_FONT,
  KB_FONT_SIZE,
  SHADOW_BLUR,
  COLOR_WHEEL,
  midiKeyToNote
} from '@/types/piano';

// ========================================
// COLOR CONFIGURATION
// Easily customize colors here by changing the hex color codes
// Examples:
//   - Red: '#FF0000'
//   - Blue: '#0000FF'
//   - Green: '#00FF00'
//   - Cyan: '#00FFFF'
//   - Pink: '#FF1493'
//   - Orange: '#FF6B35'
// ========================================
const PIANO_KEYDOWN_COLOR_TOP = '#F50057';
const PIANO_KEYDOWN_COLOR_BOT = '#C2185B';
const WAVE_COLOR = '#F50057'; // Wave border color (Cyan)
const NOTE_DURATION_MULTIPLIER = 1.67; // Multiplier for note sustain duration (1.67 = 67% longer)

const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedSheetKey = ref<string>('unravel___animenz');
const songHistory = ref<string[]>([]); // Stack to track previously played songs
const debugText = ref('PRESS PLAY BUTTON OR SPACE');
const customSheet = ref<{ name: string; notes: MidiNote[] } | null>(null);
const pianoY = ref(0);

// Initialize device detection composable
const deviceDetection = useDeviceDetection();
const {
  canvasWidth,
  canvasHeight,
  isMobile,
  showRotatePrompt,
  isLandscapeMobile,
  shouldThinBubbles,
  setupListeners: setupDeviceListeners,
  cleanupListeners: cleanupDeviceListeners
} = deviceDetection;

// Initialize playback controls composable
const playbackControls = usePlaybackControls();
const {
  isPlaying,
  playbackTime,
  totalDuration,
  playbackSpeed,
  volume,
  playMode,
  showVolumeSlider,
  progressPercentage,
  volumeIcon,
  playModeIcon,
  playModeTitle,
  play: playControl,
  pause: pauseControl,
  stop: stopControl,
  togglePlayPause: togglePlayPauseControl,
  cycleSpeed,
  cyclePlayMode,
  formatTime,
  seekTo: setTime
} = playbackControls;

// Initialize wave animation composable
const waveAnimation = useWaveAnimation(WAVE_COLOR);
const { waveCanvasRef, initWaveCanvas, animateWaves, stopWaveAnimation, repositionWave } =
  waveAnimation;

const sheetKeys = ref(getSheetNames());
const currentSheet = computed(() => {
  if (customSheet.value) return customSheet.value;
  const allSheets = getAllSheets();
  return allSheets[selectedSheetKey.value];
});

let ctx: CanvasRenderingContext2D | null = null;
let engine: PianoEngine;
let keyboardRects = ref<KeyboardRect[]>([]);
let midiNotes = ref<MidiNote[]>([]);
let lastFrameTime = 0;
let animationFrameId: number;
let cachedWhiteKeyWidth = ref(0);
let cachedBlackKeyWidth = ref(0);
let activeNoteTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map(); // Track active note release timeouts

// Initialize composables after ctx is available
let particleEffects: ReturnType<typeof useParticleEffects>;
let backgroundEffects: ReturnType<typeof useBackgroundEffects>;
let noteVisualization: ReturnType<typeof useNoteVisualization>;
let keyboardInteraction: ReturnType<typeof useKeyboardInteraction>;
let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;

const onSheetChange = async () => {
  customSheet.value = null;
  // Save the selected sheet to localStorage
  localStorage.setItem('selectedSheetKey', selectedSheetKey.value);
  await reset();
};

const onNotesConverted = async (notes: MidiNote[], fileName: string, autoPlay?: boolean) => {
  // Generate a unique key for this custom sheet
  const sheetKey = `custom_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;

  customSheet.value = {
    name: fileName,
    notes: notes
  };

  // Update selected sheet key to show it in the dropdown
  selectedSheetKey.value = sheetKey;
  // Save the selected sheet to localStorage
  localStorage.setItem('selectedSheetKey', sheetKey);

  await reset();

  // Auto-play if requested
  if (autoPlay) {
    // Small delay to ensure everything is initialized
    setTimeout(() => {
      play();
    }, 100);
  }
};

const onSheetSaved = () => {
  // Reload sheets from localStorage
  reloadSheets();
  sheetKeys.value = getSheetNames();
};

const loadSavedSelection = () => {
  try {
    const savedKey = localStorage.getItem('selectedSheetKey');
    if (savedKey && sheetKeys.value.includes(savedKey)) {
      // Saved selection exists, use it
      selectedSheetKey.value = savedKey;
    } else {
      // No saved selection - use Unravel as default if it exists, otherwise first available
      const defaultKey = 'unravel___animenz';
      if (sheetKeys.value.includes(defaultKey)) {
        selectedSheetKey.value = defaultKey;
      } else {
        selectedSheetKey.value = sheetKeys.value[0] || defaultKey;
      }
      // Update localStorage with the selection
      localStorage.setItem('selectedSheetKey', selectedSheetKey.value);
    }
  } catch (err) {
    console.error('Failed to load saved selection:', err);
    selectedSheetKey.value = 'unravel___animenz';
  }
};

const isCustomSheet = (key: string): boolean => {
  return key.startsWith('custom_');
};

const deleteCustomSheet = async () => {
  const currentKey = selectedSheetKey.value;

  if (!isCustomSheet(currentKey)) {
    return;
  }

  try {
    // Get existing saved sheets from localStorage
    const savedSheetsJson = localStorage.getItem('customSheets');
    const savedSheets = savedSheetsJson ? JSON.parse(savedSheetsJson) : {};

    // Delete the sheet
    delete savedSheets[currentKey];

    // Save back to localStorage
    localStorage.setItem('customSheets', JSON.stringify(savedSheets));

    // Reload sheets
    reloadSheets();
    sheetKeys.value = getSheetNames();

    // Find the next sheet to switch to
    const currentIndex = sheetKeys.value.indexOf(currentKey);
    let nextKey: string;

    if (currentIndex < sheetKeys.value.length - 1) {
      // Switch to the next sheet
      nextKey = sheetKeys.value[currentIndex + 1];
    } else {
      // We're at the end, switch to the first sheet
      nextKey = sheetKeys.value[0];
    }

    // Update selection and reset
    selectedSheetKey.value = nextKey;
    // Save the new selection to localStorage
    localStorage.setItem('selectedSheetKey', nextKey);
    customSheet.value = null;
    await reset();
  } catch (err) {
    console.error('Failed to delete sheet:', err);
  }
};

const updateVolume = () => {
  // Update Tone.js master volume
  // Tone.js volume is in decibels: -60 dB (silent) to 0 dB (full)
  // Convert 0-1 linear scale to -60 to 0 dB logarithmic scale
  if (volume.value === 0) {
    Tone.Destination.volume.value = -Infinity;
  } else {
    const dbValue = -60 + volume.value * 60;
    Tone.Destination.volume.value = dbValue;
  }
};

const calcTotalDuration = () => {
  if (!midiNotes.value.length) {
    totalDuration.value = 1000;
    return;
  }
  const lastNote = midiNotes.value[midiNotes.value.length - 1];
  // Total duration is when last note ends
  totalDuration.value = lastNote.TimeMs + lastNote.DurationMs;
};

const reset = async () => {
  isPlaying.value = false;
  playbackTime.value = 0;
  lastFrameTime = 0;
  engine.clearCurrentKeys();

  // Clear all active note timeouts
  activeNoteTimeouts.forEach((timeout) => clearTimeout(timeout));
  activeNoteTimeouts.clear();

  // Clear keyboard interaction timeouts
  if (keyboardInteraction) {
    keyboardInteraction.cleanup();
  }

  await initSheet();
};

const stop = async () => {
  pause();
  await reset();
};

const initSheet = async () => {
  if (!currentSheet.value) return;

  // Lazy load MIDI notes if not already loaded (empty notes array means not loaded yet)
  if (currentSheet.value.notes.length === 0 && !selectedSheetKey.value.startsWith('custom_')) {
    console.log(`Lazy loading MIDI file: ${selectedSheetKey.value}`);
    const loadedSheet = await loadSheetByKey(selectedSheetKey.value);
    if (!loadedSheet || loadedSheet.notes.length === 0) {
      console.error(`Failed to load sheet: ${selectedSheetKey.value}`);
      return;
    }
    // After loading, reloadSheets to update the sheets object
    reloadSheets();
  }

  // Re-fetch currentSheet after potential loading
  const sheet = customSheet.value || getAllSheets()[selectedSheetKey.value];
  if (!sheet || sheet.notes.length === 0) {
    console.error(`Sheet not available after loading: ${selectedSheetKey.value}`);
    return;
  }

  // Use original MIDI velocities without normalization
  midiNotes.value = [...sheet.notes];
  // Sort notes by time
  midiNotes.value.sort((a, b) => a.TimeMs - b.TimeMs);

  calcTotalDuration();
};

const togglePlayPause = () => {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
};

const play = async () => {
  // CRITICAL: Start and WAIT for audio context on user interaction
  try {
    await toneAudio.startAudioContext();
    console.log('Audio context fully started, state:', Tone.context.state);
  } catch (err) {
    console.error('Failed to start audio context:', err);
    return; // Don't start playback if audio failed
  }

  if (playbackTime.value >= totalDuration.value) {
    playbackTime.value = 0;
  }
  debugText.value = '';
  isPlaying.value = true;
  lastFrameTime = performance.now();
};

const pause = () => {
  debugText.value = 'PAUSED';
  isPlaying.value = false;
};

const getNextSheetKey = (): string | null => {
  return playbackControls.getNextSheetKey(sheetKeys.value, selectedSheetKey.value);
};

const previousSong = async () => {
  // Pop from history to go to previous song
  if (songHistory.value.length > 0) {
    const previousKey = songHistory.value.pop()!;
    selectedSheetKey.value = previousKey;
    localStorage.setItem('selectedSheetKey', previousKey);
    customSheet.value = null;
    await reset();
    setTimeout(() => play(), 100);
  } else {
    // If no history, go to first song in list
    const allKeys = sheetKeys.value;
    if (allKeys.length > 0) {
      const firstKey = allKeys[0];
      if (firstKey !== selectedSheetKey.value) {
        selectedSheetKey.value = firstKey;
        localStorage.setItem('selectedSheetKey', firstKey);
        customSheet.value = null;
        await reset();
        setTimeout(() => play(), 100);
      }
    }
  }
};

const nextSong = async () => {
  // Manual next button should always go to next song in list, regardless of play mode
  const allKeys = sheetKeys.value;
  if (allKeys.length === 0) return;

  const currentIndex = allKeys.indexOf(selectedSheetKey.value);
  const nextIndex = (currentIndex + 1) % allKeys.length;
  const nextKey = allKeys[nextIndex];

  if (nextKey === selectedSheetKey.value) {
    playbackTime.value = 0;
    play();
  } else {
    songHistory.value.push(selectedSheetKey.value);
    selectedSheetKey.value = nextKey;
    localStorage.setItem('selectedSheetKey', nextKey);
    customSheet.value = null;
    await reset();
    setTimeout(() => play(), 100);
  }
};

const playNextSong = async () => {
  // Auto-play next song respects the play mode
  const nextKey = getNextSheetKey();
  if (!nextKey) return;

  if (nextKey === selectedSheetKey.value) {
    playbackTime.value = 0;
    play();
  } else {
    songHistory.value.push(selectedSheetKey.value);
    selectedSheetKey.value = nextKey;
    localStorage.setItem('selectedSheetKey', nextKey);
    customSheet.value = null;
    await reset();
    setTimeout(() => play(), 100);
  }
};

const playNotesInTimeRange = (fromTime: number, toTime: number) => {
  // Find and play all notes that should trigger in this time range
  for (const note of midiNotes.value) {
    const noteStartTime = note.TimeMs;
    const noteEndTime = note.TimeMs + note.DurationMs;

    // Skip notes that haven't started yet
    if (noteStartTime > toTime) break;

    // Skip notes that already finished before this range
    if (noteEndTime < fromTime) continue;

    // If note starts within this time range, trigger it
    if (noteStartTime >= fromTime && noteStartTime < toTime) {
      const midiKey = note.Key;
      const vel = note.Vel || 127;

      // Calculate the delay before playing this note
      const delayMs = Math.max(0, (noteStartTime - fromTime) / playbackSpeed.value);

      // Schedule the note to play at the correct time
      setTimeout(() => {
        engine.addCurrentKey(midiKey);
        engine.playSound(midiKey, vel);

        // Schedule note release with duration multiplier for better sustain
        const adjustedDuration = (note.DurationMs * NOTE_DURATION_MULTIPLIER) / playbackSpeed.value;
        const timeout = setTimeout(() => {
          engine.removeCurrentKey(midiKey);
          engine.setKeyVolume(midiKey, 1.0);
          activeNoteTimeouts.delete(midiKey);
        }, adjustedDuration - 10);

        // Clear any existing timeout for this key
        if (activeNoteTimeouts.has(midiKey)) {
          clearTimeout(activeNoteTimeouts.get(midiKey)!);
        }
        activeNoteTimeouts.set(midiKey, timeout);
      }, delayMs);
    }
  }
};

const triggerManualPlayEffects = (midiKey: number) => {
  if (!particleEffects) return;

  const keyIndex = midiKey - 36;
  const keyRect = keyboardRects.value[keyIndex];
  if (!keyRect) return;

  const color = COLOR_WHEEL[midiKey % COLOR_WHEEL.length];
  const bubbleWidth = noteVisualization.cachedBubbleWidth.value;

  const x = keyRect.x + keyRect.width / 2;
  const y = pianoY.value;

  // Create smoke particles
  if (Math.random() > 0.5) {
    particleEffects.createSmokeParticles(x, y, color);
  }

  // Create electric sparks
  if (Math.random() > 0.4) {
    particleEffects.createElectricSparks(x, y, color, bubbleWidth);
  }

  // Add key glow effect
  particleEffects.addKeyGlowEffect(keyIndex, color);

  // Trigger music reactive effects
  backgroundEffects.triggerMusicReaction(color);

  // Create background wave occasionally
  if (Math.random() > 0.7) {
    backgroundEffects.createBackgroundWave(x, y - 50, color);
  }
};

const drawKey = (r: KeyboardRect, currentKeysSet: Set<number>) => {
  if (!ctx) return;

  const isKeyDown = currentKeysSet.has(r.index + 36);
  const glowEffect = particleEffects.keyGlowEffects.value.get(r.index);

  // Apply pressed-in effect with inset shadow and slight size reduction
  let offsetX = 0;
  let offsetY = 0;
  let widthReduction = 0;
  let heightReduction = 0;

  if (isKeyDown) {
    // Make key appear pressed in
    offsetY = r.height * 0.03; // Push down slightly
    heightReduction = r.height * 0.03; // Make slightly shorter
    if (r.isBlack) {
      widthReduction = r.width * 0.02; // Slight width reduction for black keys
      offsetX = widthReduction / 2; // Center the reduction
    }
  }

  const adjustedRect = {
    x: r.x + offsetX,
    y: r.y + offsetY,
    width: r.width - widthReduction,
    height: r.height - heightReduction
  };

  if (isKeyDown) {
    // Use darker gradient for pressed key
    const gradient = ctx.createLinearGradient(
      adjustedRect.x,
      adjustedRect.y,
      adjustedRect.x,
      adjustedRect.y + adjustedRect.height
    );
    gradient.addColorStop(0, PIANO_KEYDOWN_COLOR_TOP);
    gradient.addColorStop(1, PIANO_KEYDOWN_COLOR_BOT);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = PIANO_KEYDOWN_COLOR_BOT;
  } else if (glowEffect && glowEffect.intensity > 0) {
    // Apply glow effect from bubble hit
    ctx.fillStyle = r.fillStyle;
    ctx.strokeStyle = glowEffect.color;
    ctx.shadowColor = glowEffect.color;
    ctx.shadowBlur = SHADOW_BLUR * 4 * glowEffect.intensity;
    ctx.lineWidth = r.lineWidth + 2 * glowEffect.intensity;
  } else {
    ctx.fillStyle = r.fillStyle;
    ctx.strokeStyle = r.strokeStyle;
  }

  ctx.lineWidth = r.lineWidth;

  if (r.isBlack && !isKeyDown) {
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = -5;
    ctx.shadowOffsetY = 5;
  } else if (!isKeyDown) {
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#888';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (r.isBlack) {
    drawRoundRect(
      ctx,
      adjustedRect.x,
      adjustedRect.y,
      adjustedRect.width,
      adjustedRect.height,
      5,
      true,
      true
    );

    // Add soft inset shadow on all four sides for pressed black keys
    if (isKeyDown) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';

      const shadowSize = 8;

      // Top shadow
      const topGradient = ctx.createLinearGradient(
        adjustedRect.x,
        adjustedRect.y,
        adjustedRect.x,
        adjustedRect.y + shadowSize
      );
      topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      topGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = topGradient;
      drawRoundRect(
        ctx,
        adjustedRect.x,
        adjustedRect.y,
        adjustedRect.width,
        shadowSize,
        5,
        true,
        false
      );

      // Left shadow
      const leftGradient = ctx.createLinearGradient(
        adjustedRect.x,
        adjustedRect.y,
        adjustedRect.x + shadowSize,
        adjustedRect.y
      );
      leftGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      leftGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = leftGradient;
      ctx.fillRect(adjustedRect.x, adjustedRect.y, shadowSize, adjustedRect.height);

      // Right shadow
      const rightGradient = ctx.createLinearGradient(
        adjustedRect.x + adjustedRect.width,
        adjustedRect.y,
        adjustedRect.x + adjustedRect.width - shadowSize,
        adjustedRect.y
      );
      rightGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      rightGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = rightGradient;
      ctx.fillRect(
        adjustedRect.x + adjustedRect.width - shadowSize,
        adjustedRect.y,
        shadowSize,
        adjustedRect.height
      );

      // Bottom shadow
      const bottomGradient = ctx.createLinearGradient(
        adjustedRect.x,
        adjustedRect.y + adjustedRect.height,
        adjustedRect.x,
        adjustedRect.y + adjustedRect.height - shadowSize
      );
      bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      bottomGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(
        adjustedRect.x,
        adjustedRect.y + adjustedRect.height - shadowSize,
        adjustedRect.width,
        shadowSize
      );

      ctx.restore();
    }
  } else {
    ctx.fillRect(adjustedRect.x, adjustedRect.y, adjustedRect.width, adjustedRect.height);
    ctx.strokeRect(adjustedRect.x, adjustedRect.y, adjustedRect.width, adjustedRect.height);

    // Add soft inset shadow on all four sides for pressed white keys
    if (isKeyDown) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';

      const shadowSize = 10;

      // Top shadow
      const topGradient = ctx.createLinearGradient(
        adjustedRect.x,
        adjustedRect.y,
        adjustedRect.x,
        adjustedRect.y + shadowSize
      );
      topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      topGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = topGradient;
      ctx.fillRect(adjustedRect.x, adjustedRect.y, adjustedRect.width, shadowSize);

      // Left shadow
      const leftGradient = ctx.createLinearGradient(
        adjustedRect.x,
        adjustedRect.y,
        adjustedRect.x + shadowSize,
        adjustedRect.y
      );
      leftGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      leftGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = leftGradient;
      ctx.fillRect(adjustedRect.x, adjustedRect.y, shadowSize, adjustedRect.height);

      // Right shadow
      const rightGradient = ctx.createLinearGradient(
        adjustedRect.x + adjustedRect.width,
        adjustedRect.y,
        adjustedRect.x + adjustedRect.width - shadowSize,
        adjustedRect.y
      );
      rightGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      rightGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = rightGradient;
      ctx.fillRect(
        adjustedRect.x + adjustedRect.width - shadowSize,
        adjustedRect.y,
        shadowSize,
        adjustedRect.height
      );

      // Bottom shadow
      const bottomGradient = ctx.createLinearGradient(
        adjustedRect.x,
        adjustedRect.y + adjustedRect.height,
        adjustedRect.x,
        adjustedRect.y + adjustedRect.height - shadowSize
      );
      bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
      bottomGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(
        adjustedRect.x,
        adjustedRect.y + adjustedRect.height - shadowSize,
        adjustedRect.width,
        shadowSize
      );

      ctx.restore();
    }
  }

  removeShadow();

  // Skip rendering keyboard text on mobile devices
  if (!isMobile.value) {
    ctx.font = KB_FONT;
    const xOffset = ctx.measureText(r.text || '').width / 2;

    if (r.isBlack) {
      ctx.fillStyle = WHITE;
      const x = adjustedRect.x + adjustedRect.width / 2 - xOffset;
      let y = adjustedRect.y + adjustedRect.height * 0.32;
      ctx.fillText(r.text || '', x, y);
      y += KB_FONT_SIZE * 1.3;
      ctx.fillText('↑', x, y);
    } else {
      ctx.fillStyle = isKeyDown ? WHITE : BLACK;
      const x = adjustedRect.x + adjustedRect.width / 2 - xOffset;
      const y = adjustedRect.y + adjustedRect.height * 0.28;
      ctx.fillText(r.text || '', x, y);

      // Draw note name (A-G) at the bottom of white keys
      const midiKey = r.index + 36;
      const fullNote = midiKeyToNote[midiKey] || '';
      const noteLetter = fullNote.replace(/[0-9#]/g, ''); // Extract just the letter (A-G)

      if (noteLetter) {
        ctx.font = `bold ${KB_FONT_SIZE + 2}px Verdana`;
        ctx.fillStyle = isKeyDown ? WHITE : '#855';
        const noteXOffset = ctx.measureText(noteLetter).width / 2;
        const noteX = adjustedRect.x + adjustedRect.width / 2 - noteXOffset;
        const noteY = adjustedRect.y + adjustedRect.height * 0.95;
        ctx.fillText(noteLetter, noteX, noteY);
      }
    }
  }
};

const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
  removeShadow();
};

const removeShadow = () => {
  if (!ctx) return;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const update = () => {
  if (!ctx || !canvasRef.value) return;

  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);

  engine.updateVolumes(true);

  // Draw background effects first (behind everything)
  backgroundEffects.drawBackgroundEffects();

  // Calculate bubbles based on current playback time
  const bubbles = noteVisualization.calculateBubbles();

  // Check for bubble collisions and trigger effects
  const pianoYVal = canvasHeight.value * 0.73;
  bubbles.forEach((bubble) => {
    if (noteVisualization.checkBubbleCollision(bubble, pianoYVal)) {
      const color = bubble.color;
      const x = bubble.x + bubble.width / 2;

      // Create smoke particles occasionally
      if (Math.random() > 0.7) {
        particleEffects.createSmokeParticles(x, pianoYVal, color);
      }

      // Create electric sparks when hitting
      if (Math.random() > 0.6) {
        particleEffects.createElectricSparks(x, pianoYVal, color, bubble.width);
        backgroundEffects.triggerMusicReaction(color);
      }

      // Add key glow effect
      particleEffects.addKeyGlowEffect(bubble.keyboardRectIndex, color);

      // Create background wave occasionally
      if (Math.random() > 0.7) {
        backgroundEffects.createBackgroundWave(x, pianoYVal - 50, color);
      }
    }
  });

  noteVisualization.drawBubbles(bubbles);

  // Update and draw particles
  if (isPlaying.value) {
    const currentTime = performance.now();

    if (lastFrameTime === 0) {
      lastFrameTime = currentTime;
    }

    // Calculate time delta and apply playback speed
    const deltaMs = (currentTime - lastFrameTime) * playbackSpeed.value;
    lastFrameTime = currentTime;

    // Update all particle effects
    particleEffects.updateSmokeParticles(deltaMs);
    particleEffects.updateSparkParticles(deltaMs);
    particleEffects.updateKeyGlowEffects(deltaMs);
    backgroundEffects.updateBackgroundWaves(deltaMs);
    backgroundEffects.updateFloatingParticles(deltaMs);
    backgroundEffects.updateMusicReactiveEffects(deltaMs);

    // Update playback time
    const previousTime = playbackTime.value;
    playbackTime.value += deltaMs;

    // Play notes that should trigger in this time range
    playNotesInTimeRange(previousTime, playbackTime.value);

    // Stop if we've reached the end
    if (playbackTime.value >= totalDuration.value) {
      pause();
      playbackTime.value = totalDuration.value;
      // Auto-play next song according to play mode
      playNextSong();
    }
  } else {
    lastFrameTime = 0;
    // Still update particles even when paused
    particleEffects.updateSmokeParticles(16);
    particleEffects.updateSparkParticles(16);
    particleEffects.updateKeyGlowEffects(16);
    backgroundEffects.updateBackgroundWaves(16);
    backgroundEffects.updateFloatingParticles(16);
    backgroundEffects.updateMusicReactiveEffects(16);
  }

  // Draw all particles on top
  particleEffects.drawSmokeParticles();
  particleEffects.drawSparkParticles();

  // Cache current keys as a Set for faster lookup
  const currentKeysSet = new Set(engine.getCurrentKeys());

  keyboardRects.value.forEach((r) => {
    if (!r.isBlack) drawKey(r, currentKeysSet);
  });

  keyboardRects.value.forEach((r) => {
    if (r.isBlack) drawKey(r, currentKeysSet);
  });

  animationFrameId = requestAnimationFrame(update);
};

const onResize = () => {
  if (!canvasRef.value) return;

  canvasRef.value.width = canvasWidth.value;
  canvasRef.value.height = canvasHeight.value;

  engine.setDimensions(canvasWidth.value, canvasHeight.value);
  keyboardRects.value = engine.createKeyboardRects();

  pianoY.value = canvasHeight.value * 0.73;

  // Cache key dimensions for performance
  cachedWhiteKeyWidth.value = keyboardRects.value[0]?.width || 0;
  cachedBlackKeyWidth.value = keyboardRects.value.find((r) => r.isBlack)?.width || 0;

  calcTotalDuration();

  // Reinitialize floating particles for new screen size
  if (backgroundEffects) {
    backgroundEffects.initFloatingParticles();
  }

  // Reinitialize and reposition wave canvas
  if (waveAnimation && waveCanvasRef.value) {
    repositionWave(pianoY.value);
  }

  // Bubbles will be recalculated automatically in the next frame
};

const handleVisibilityChange = () => {
  // Pause playback when tab/window loses focus
  if (document.hidden && isPlaying.value) {
    pause();
  }
};

onMounted(async () => {
  if (!canvasRef.value) return;

  ctx = canvasRef.value.getContext('2d');
  engine = new PianoEngine();

  await engine.initSounds();

  // Initialize sheet list (metadata only, no MIDI loading yet)
  reloadSheets();
  sheetKeys.value = getSheetNames();

  // Initialize composables after ctx is set
  particleEffects = useParticleEffects(ref(ctx));
  backgroundEffects = useBackgroundEffects(ref(ctx), canvasWidth, canvasHeight);
  noteVisualization = useNoteVisualization(
    ref(ctx),
    midiNotes,
    keyboardRects,
    playbackTime,
    canvasHeight,
    shouldThinBubbles,
    cachedWhiteKeyWidth,
    cachedBlackKeyWidth
  );

  // Initialize keyboard interaction composable
  keyboardInteraction = useKeyboardInteraction(
    engine,
    keyboardRects,
    canvasRef,
    triggerManualPlayEffects,
    NOTE_DURATION_MULTIPLIER
  );

  // Initialize volume
  updateVolume();

  // Load saved play mode from localStorage
  playbackControls.loadSavedSettings();

  onResize();
  loadSavedSelection();
  await initSheet();
  backgroundEffects.initFloatingParticles();
  initWaveCanvas(pianoY.value);
  animateWaves();

  // Setup device detection listeners (includes resize and orientation change)
  setupDeviceListeners();

  // Setup keyboard listeners with proper event handler
  handleKeyDown = (e: KeyboardEvent) => {
    keyboardInteraction.onKeyDown(
      e,
      togglePlayPause,
      () => setTime(playbackTime.value - 10000),
      () => setTime(playbackTime.value + 10000)
    );
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', keyboardInteraction.onKeyUp);
  window.addEventListener('click', handleOutsideClick);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Watch for resize to update canvas dimensions
  const resizeWatcher = () => {
    onResize();
  };
  canvasWidth.value && canvasHeight.value; // Touch refs to create reactive dependency
  window.addEventListener('resize', resizeWatcher);

  update();
});

const handleOutsideClick = (e: MouseEvent) => {
  // Close volume slider when clicking outside
  const target = e.target as HTMLElement;
  if (showVolumeSlider.value && !target.closest('.relative.flex.items-center.gap-2')) {
    showVolumeSlider.value = false;
  }
};

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Stop wave animation
  if (waveAnimation) {
    stopWaveAnimation();
  }

  // Clear all active note timeouts
  activeNoteTimeouts.forEach((timeout) => clearTimeout(timeout));
  activeNoteTimeouts.clear();

  // Cleanup keyboard interaction
  if (keyboardInteraction) {
    keyboardInteraction.cleanup();
  }

  // Cleanup device detection listeners
  cleanupDeviceListeners();

  window.removeEventListener('resize', onResize);
  if (handleKeyDown) {
    window.removeEventListener('keydown', handleKeyDown);
  }
  if (keyboardInteraction) {
    window.removeEventListener('keyup', keyboardInteraction.onKeyUp);
  }
  window.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
/* Sheet Selector with Ellipsis */
.sheet-selector {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: width 0.15s ease-out;
}

.sheet-selector option {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Hidden element for measuring text width */
.measure-text {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
  pointer-events: none;
  left: -9999px;
}

/* Volume Slider Styling */
.volume-slider {
  background: linear-gradient(
    to top,
    #10b981 0%,
    #10b981 var(--volume-fill, 70%),
    #374151 var(--volume-fill, 70%),
    #374151 100%
  );
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 1.8vh;
  height: 1.8vh;
  min-width: 14px;
  min-height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  cursor: pointer;
  box-shadow: 0 0.2vh 0.8vh rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  transform: scale(1.2);
  box-shadow: 0 0.3vh 1.2vh rgba(16, 185, 129, 0.6);
}

.volume-slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.volume-slider::-moz-range-thumb {
  width: 1.8vh;
  height: 1.8vh;
  min-width: 14px;
  min-height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  cursor: pointer;
  border: none;
  box-shadow: 0 0.2vh 0.8vh rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  transform: scale(1.2);
  box-shadow: 0 0.3vh 1.2vh rgba(16, 185, 129, 0.6);
}

@keyframes pulse-subtle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

/* Animated Electric Wave Border */
.wave-border-canvas {
  position: absolute;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 5555;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* Animated Music Icon */
.music-icon-container {
  position: relative;
}

@keyframes music-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-0.1875rem) scale(1.1);
  }
  50% {
    transform: translateY(0) scale(1);
  }
  75% {
    transform: translateY(-0.125rem) scale(1.05);
  }
}

@keyframes music-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 0.1875rem rgba(236, 72, 153, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 0.5rem rgba(236, 72, 153, 0.9))
      drop-shadow(0 0 0.75rem rgba(236, 72, 153, 0.5));
  }
}

.music-icon-animated {
  animation:
    music-bounce 1.5s ease-in-out infinite,
    music-glow 2s ease-in-out infinite;
  display: inline-block;
}

.music-icon-container:hover .music-icon-animated {
  animation:
    music-bounce 0.8s ease-in-out infinite,
    music-glow 1s ease-in-out infinite;
  color: #f472b6;
}
</style>
