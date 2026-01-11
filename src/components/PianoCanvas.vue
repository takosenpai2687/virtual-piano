<template>
  <div class="fixed inset-0 bg-gray-900 overflow-hidden">
    <!-- Canvas for Piano -->
    <canvas
      ref="canvasRef"
      class="absolute w-full h-full z-10"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
      @touchstart="onMouseDown"
      @touchend="onMouseUp"
      @touchmove="onMouseMove"
      @contextmenu.prevent
    />

    <!-- Dynamic Island Control Panel -->
    <div class="fixed top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 z-50 text-white transition-all hover:bg-gray-900/95" style="max-width: 90vw;">
      
      <!-- Upload -->
      <MidiUploader @notesConverted="onNotesConverted" />
      
      <div class="w-px h-8 bg-gray-700 mx-1"></div>

      <!-- Controls -->
      <button @click="seek(-10000)" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-pink-400 transition-all text-gray-300" title="Rewind 10s">
        <i class="fas fa-backward"></i>
      </button>

      <button @click="stop" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-red-400 transition-all text-gray-300" title="Stop">
        <i class="fas fa-stop"></i>
      </button>

      <button 
        @click="togglePlayPause"
        class="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 transition-all active:scale-95 mx-2"
      >
        <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'" class="text-xl"></i>
      </button>

      <button @click="seek(10000)" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-pink-400 transition-all text-gray-300" title="Forward 10s">
        <i class="fas fa-forward"></i>
      </button>

      <div class="w-px h-8 bg-gray-700 mx-1"></div>

      <!-- Speed Control -->
      <button @click="cycleSpeed" class="px-3 h-10 flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-blue-400 transition-all text-gray-300 font-medium text-sm" :title="`Playback Speed: ${playbackSpeed}x`">
        <i class="fas fa-gauge-high mr-1.5"></i>
        {{ playbackSpeed }}x
      </button>

      <div class="w-px h-8 bg-gray-700 mx-1"></div>

      <!-- Sheet Selector -->
      <div class="relative group">
        <select
          v-model="selectedSheetKey"
          @change="onSheetChange"
          class="bg-transparent text-gray-200 text-sm font-medium focus:outline-none cursor-pointer py-2 pr-8 pl-2 appearance-none hover:text-white"
        >
          <option v-for="key in sheetKeys" :key="key" :value="key" class="bg-gray-800 text-white">
            {{ sheets[key].name }}
          </option>
        </select>
        <div class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
           <i class="fas fa-chevron-down text-xs"></i>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div 
      class="fixed w-full h-6 cursor-pointer z-40 group hover:h-8 transition-all"
      :style="{ bottom: '28%' }"
      @click="onProgressBarClick"
      @mousemove="onProgressBarHover"
    >
        <!-- Track -->
        <div class="absolute top-1/2 left-0 w-full h-1 bg-gray-700/50 group-hover:h-2 transition-all transform -translate-y-1/2 backdrop-blur-sm"></div>
        
        <!-- Progress Fill -->
        <div 
          class="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500 group-hover:h-2 transition-[height] transform -translate-y-1/2 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
          :style="{ width: `${progressPercentage}%` }"
        >
            <!-- Throbber/Handle -->
            <div class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity scale-150"></div>
        </div>
    </div>

    <!-- Debug Text -->
    <div
      v-if="debugText && !isPlaying"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 text-7xl font-bold z-0 pointer-events-none select-none tracking-widest whitespace-nowrap"
    >
      {{ debugText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { PianoEngine } from '@/services/pianoEngine';
import { sheets, getSheetNames } from '@/data/sheets';
import MidiUploader from './MidiUploader.vue';

import type { MidiNote, KeyboardRect, Bubble } from '@/types/piano';
import {
  BG_COLOR,
  WHITE,
  BLACK,
  KEYDOWN_COLOR,
  KEYDOWN_SHADOW_COLOR,
  KB_FONT,
  KB_FONT_SIZE,
  SHADOW_BLUR,
  COLOR_WHEEL
} from '@/types/piano';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedSheetKey = ref<string>('unravel');
const isPlaying = ref(false);
const debugText = ref('← OR PRESS SPACE');
const customSheet = ref<{ name: string; notes: MidiNote[] } | null>(null);
const playbackTime = ref(0); // Single source of truth: current time in song (ms)
const totalDuration = ref(1000); // Total song duration in ms
const playbackSpeed = ref(1); // Speed multiplier
const canvasWidth = ref(window.innerWidth);
const canvasHeight = ref(window.innerHeight);
const pianoY = ref(0);

const sheetKeys = getSheetNames();
const currentSheet = computed(() => {
  if (customSheet.value) return customSheet.value;
  return sheets[selectedSheetKey.value];
});

const progressPercentage = computed(() => {
  if (totalDuration.value === 0) return 0;
  return Math.min(100, Math.max(0, (playbackTime.value / totalDuration.value) * 100));
});

let ctx: CanvasRenderingContext2D | null = null;
let engine: PianoEngine;
let keyboardRects: KeyboardRect[] = [];
let midiNotes: MidiNote[] = [];
let lastFrameTime = 0;
let animationFrameId: number;
let isMouseDown = false;
let mousePressedKey: number | null = null;
let activeNoteTimeouts: Map<number, number> = new Map(); // Track active note release timeouts
let smokeParticles: Array<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}> = [];

let sparkParticles: Array<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  brightness: number;
}> = [];

let keyGlowEffects: Map<number, { intensity: number; color: string; time: number }> = new Map();

const onSheetChange = () => {
  customSheet.value = null;
  reset();
};

const onNotesConverted = (notes: MidiNote[], fileName: string) => {
  customSheet.value = {
    name: fileName,
    notes: notes
  };
  reset();
};

const cycleSpeed = () => {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const currentIndex = speeds.indexOf(playbackSpeed.value);
  const nextIndex = (currentIndex + 1) % speeds.length;
  playbackSpeed.value = speeds[nextIndex];
};

const calcTotalDuration = () => {
  if (!midiNotes.length) {
    totalDuration.value = 1000;
    return;
  }
  const lastNote = midiNotes[midiNotes.length - 1];
  // Total duration is when last note ends
  totalDuration.value = lastNote.TimeMs + lastNote.DurationMs;
};

const reset = () => {
  isPlaying.value = false;
  playbackTime.value = 0;
  lastFrameTime = 0;
  engine.clearCurrentKeys();
  
  // Clear all active note timeouts
  activeNoteTimeouts.forEach(timeout => clearTimeout(timeout));
  activeNoteTimeouts.clear();
  
  initSheet();
};

const stop = () => {
  pause();
  reset();
};

const initSheet = () => {
  if (!currentSheet.value) return;
  
  midiNotes = engine.preprocessMidiNotes([...currentSheet.value.notes]);
  // Sort notes by time
  midiNotes.sort((a, b) => a.TimeMs - b.TimeMs);
  
  calcTotalDuration();
};

const togglePlayPause = () => {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
};

const play = () => {
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

const seek = (offsetMs: number) => {
  setTime(playbackTime.value + offsetMs);
};

const onProgressBarClick = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  const percentage = Math.max(0, Math.min(1, clickX / width));
  
  const newTime = percentage * totalDuration.value;
  setTime(newTime);
};

const onProgressBarHover = () => {
  // Logic for hover preview can be added here
};

const setTime = (timeMs: number) => {
  // Clamp to valid range
  timeMs = Math.max(0, Math.min(timeMs, totalDuration.value));
  
  // Clear all currently playing notes and their timeouts
  engine.clearCurrentKeys();
  activeNoteTimeouts.forEach(timeout => clearTimeout(timeout));
  activeNoteTimeouts.clear();
  
  // Update playback time immediately
  playbackTime.value = timeMs;
  // Reset frame time so next frame starts fresh
  lastFrameTime = 0;
};

const onMouseDown = (e: MouseEvent | TouchEvent) => {
  if (!ctx || !canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  
  let midiKey: number | null | undefined = null;
  const blackKey = keyboardRects.find(r => r.isBlack && 
    x >= r.x && x <= r.x + r.width && 
    y >= r.y && y <= r.y + r.height
  );
  
  if (blackKey) {
    midiKey = blackKey.index + 36;
  } else {
    midiKey = engine.resolveKeyByMouse(x, y, keyboardRects);
  }
  
  if (!midiKey) return;
  
  isMouseDown = true;
  const currentKeys = engine.getCurrentKeys();
  
  if (currentKeys.length > 0 && currentKeys.includes(midiKey)) {
    engine.playSound(midiKey, 127);
    mousePressedKey = midiKey;
    return;
  }
  
  engine.addCurrentKey(midiKey);
  mousePressedKey = midiKey;
  engine.playSound(midiKey, 127);
};

const onMouseMove = (e: MouseEvent | TouchEvent) => {
  if (!isMouseDown || !canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  
  let midiKey: number | null | undefined = null;
  const blackKey = keyboardRects.find(r => r.isBlack && 
    x >= r.x && x <= r.x + r.width && 
    y >= r.y && y <= r.y + r.height
  );
  
  if (blackKey) {
    midiKey = blackKey.index + 36;
  } else {
    midiKey = engine.resolveKeyByMouse(x, y, keyboardRects);
  }
  
  if (!midiKey) return;
  
  if (mousePressedKey !== null && midiKey && midiKey !== mousePressedKey) {
    engine.removeCurrentKey(mousePressedKey);
    mousePressedKey = midiKey;
    engine.addCurrentKey(midiKey);
    engine.getCurrentKeys().forEach(mk => engine.playSound(mk, 127));
  }
};

const onMouseUp = () => {
  if (mousePressedKey !== null) {
    engine.removeCurrentKey(mousePressedKey);
    mousePressedKey = null;
  }
  isMouseDown = false;
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
    return;
  }
  
  if (e.repeat) return;
  
  const midiKey = engine.resolveKeyByKeyboard(e.key, e.shiftKey);
  if (!midiKey) return;
  
  if (!engine.getCurrentKeys().includes(midiKey)) {
    engine.addCurrentKey(midiKey);
    engine.playSound(midiKey, 127);
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') return;
  
  const midiKeyReleased = engine.resolveKeyByKeyboard(e.key, e.shiftKey);
  if (!midiKeyReleased) return;
  
  engine.removeCurrentKey(midiKeyReleased);
};

const playNotesInTimeRange = (fromTime: number, toTime: number) => {
  // Find and play all notes that should trigger in this time range
  for (const note of midiNotes) {
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
      
      // Calculate how long the note should play
      // If we're past the note start, only play remaining duration
      const timeIntoNote = toTime - noteStartTime;
      const remainingDuration = Math.max(0, note.DurationMs - timeIntoNote);
      
      // Only play if there's duration remaining
      if (remainingDuration > 10) {
        engine.addCurrentKey(midiKey);
        engine.playSound(midiKey, vel);
        
        // Schedule note release
        const adjustedDuration = remainingDuration / playbackSpeed.value;
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
      }
    }
  }
};

const calculateBubbles = (): Bubble[] => {
  if (!canvasRef.value) return [];
  
  const pianoY = canvasRef.value.height * 0.73;
  const bubbles: Bubble[] = [];
  
  const whiteKeyWidth = keyboardRects[0]?.width || 0;
  const blackKeyWidth = keyboardRects.find(r => r.isBlack)?.width || 0;
  const bubbleWidth = whiteKeyWidth - blackKeyWidth;
  
  for (const note of midiNotes) {
    const midiKey = note.Key;
    const keyIndex = midiKey - 36;
    
    // Find the keyboard rect for this key
    const keyRect = keyboardRects[keyIndex];
    if (!keyRect) continue;
    
    // Bubble dimensions (height = duration in pixels)
    const height = note.DurationMs;
    
    // Calculate bubble bottom Y position
    // The BOTTOM of the bubble should reach pianoY exactly at note.TimeMs
    // Bubble moves at 1 pixel per millisecond
    // Bottom position: y + height = pianoY at time = note.TimeMs
    // So: y + height = playbackTime.value - note.TimeMs + pianoY
    // Therefore: y = playbackTime.value - note.TimeMs + pianoY - height
    const bottomY = pianoY - (note.TimeMs - playbackTime.value);
    const y = bottomY - height;
    
    // Skip bubbles that haven't appeared yet (still above screen)
    if (bottomY < 0) continue;
    
    // Skip bubbles that have already passed the piano line
    if (y > pianoY) continue;
    
    // Check if bubble is touching the keyboard and create effects
    if (bottomY >= pianoY - 5 && bottomY <= pianoY + 5) {
      const color = COLOR_WHEEL[midiKey % COLOR_WHEEL.length];
      const x = keyRect.x + keyRect.width / 2 - bubbleWidth / 2;
      
      // Create smoke particles occasionally
      if (Math.random() > 0.7) {
        createSmokeParticles(x + bubbleWidth / 2, pianoY, color);
      }
      
      // Create electric sparks when hitting
      if (Math.random() > 0.6) {
        createElectricSparks(x + bubbleWidth / 2, pianoY, color, bubbleWidth);
      }
      
      // Add key glow effect
      keyGlowEffects.set(keyIndex, { intensity: 1, color: color, time: 0 });
    }
    
    // Position bubble centered on key
    const x = keyRect.x + keyRect.width / 2 - bubbleWidth / 2;
    
    bubbles.push({
      x,
      y,
      width: bubbleWidth,
      height,
      color: COLOR_WHEEL[midiKey % COLOR_WHEEL.length],
      keyboardRectIndex: keyIndex
    });
  }
  
  return bubbles;
};

const createSmokeParticles = (x: number, y: number, color: string) => {
  // Create 2-3 smoke particles
  const count = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < count; i++) {
    smokeParticles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.8 - 0.3,
      life: 1,
      maxLife: Math.random() * 300 + 200,
      size: Math.random() * 8 + 4,
      color: color,
      alpha: 0.6
    });
  }
};

const createElectricSparks = (x: number, y: number, color: string, width: number) => {
  // Create 8-12 electric spark particles
  const count = Math.floor(Math.random() * 5) + 8;
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI) - Math.PI / 2; // Upward hemisphere
    const speed = Math.random() * 1.5 + 0.5;
    sparkParticles.push({
      x: x + (Math.random() - 0.5) * width,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: Math.random() * 200 + 150,
      size: Math.random() * 3 + 2,
      color: color,
      alpha: 1,
      brightness: Math.random() * 0.5 + 0.5
    });
  }
};

const updateSmokeParticles = (dt: number) => {
  smokeParticles = smokeParticles.filter(p => {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.001 * dt; // slight gravity
    p.alpha = Math.max(0, 0.6 * (1 - p.life / p.maxLife));
    p.size += 0.02 * dt; // grow slightly
    return p.life < p.maxLife;
  });
};

const updateSparkParticles = (dt: number) => {
  sparkParticles = sparkParticles.filter(p => {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.003 * dt; // gravity
    p.vx *= 0.98; // air resistance
    p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
    return p.life < p.maxLife;
  });
};

const updateKeyGlowEffects = (dt: number) => {
  keyGlowEffects.forEach((effect, key) => {
    effect.time += dt;
    effect.intensity = Math.max(0, 1 - (effect.time / 300)); // Fade over 300ms
    if (effect.intensity <= 0) {
      keyGlowEffects.delete(key);
    }
  });
};

const drawSmokeParticles = () => {
  if (!ctx) return;
  
  smokeParticles.forEach(p => {
    ctx!.save();
    ctx!.globalAlpha = p.alpha;
    ctx!.fillStyle = p.color;
    ctx!.shadowColor = p.color;
    ctx!.shadowBlur = 15;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();
  });
};

const drawSparkParticles = () => {
  if (!ctx) return;
  
  sparkParticles.forEach(p => {
    ctx!.save();
    ctx!.globalAlpha = p.alpha;
    
    // Draw bright core
    ctx!.fillStyle = '#ffffff';
    ctx!.shadowColor = p.color;
    ctx!.shadowBlur = 20 * p.brightness;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    ctx!.fill();
    
    // Draw colored glow
    ctx!.fillStyle = p.color;
    ctx!.shadowBlur = 15 * p.brightness;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx!.fill();
    
    ctx!.restore();
  });
};

const drawKey = (r: KeyboardRect) => {
  if (!ctx) return;
  
  const isKeyDown = engine.getCurrentKeys().includes(r.index + 36);
  const glowEffect = keyGlowEffects.get(r.index);
  
  if (isKeyDown) {
    ctx.fillStyle = KEYDOWN_COLOR;
    ctx.shadowColor = KEYDOWN_SHADOW_COLOR;
    ctx.shadowBlur = SHADOW_BLUR * 6;
    ctx.strokeStyle = KEYDOWN_COLOR;
    ctx.shadowOffsetY = -80;
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
    drawRoundRect(ctx, r.x, r.y, r.width, r.height, 5, true, true);
  } else {
    ctx.fillRect(r.x, r.y, r.width, r.height);
    ctx.strokeRect(r.x, r.y, r.width, r.height);
  }
  
  removeShadow();
  
  ctx.font = KB_FONT;
  const xOffset = ctx.measureText(r.text || '').width / 2;
  
  if (r.isBlack) {
    ctx.fillStyle = WHITE;
    const x = r.x + r.width / 2 - xOffset;
    let y = r.y + r.height * 0.32;
    ctx.fillText(r.text || '', x, y);
    y += KB_FONT_SIZE * 1.3;
    ctx.fillText('↑', x, y);
  } else {
    ctx.fillStyle = isKeyDown ? WHITE : BLACK;
    const x = r.x + r.width / 2 - xOffset;
    const y = r.y + r.height * 0.28;
    ctx.fillText(r.text || '', x, y);
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

const drawBubbles = (bubbles: Bubble[]) => {
  if (!ctx) return;
  
  bubbles.forEach(b => {
    ctx!.save();
    
    // Create beautiful gradient for each bubble
    const gradient = ctx!.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
    
    // Lighter shade at top, main color at bottom
    const mainColor = b.color;
    const lighterColor = lightenColor(mainColor, 30);
    const darkerColor = darkenColor(mainColor, 10);
    
    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.5, mainColor);
    gradient.addColorStop(1, darkerColor);
    
    ctx!.fillStyle = gradient;
    ctx!.shadowColor = mainColor;
    ctx!.shadowBlur = SHADOW_BLUR;
    
    drawRoundRect(ctx!, b.x, b.y, b.width, b.height, b.width / 2, true, false);
    
    ctx!.restore();
  });
};

// Helper function to lighten a hex color
const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

// Helper function to darken a hex color
const darkenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

const update = () => {
  if (!ctx || !canvasRef.value) return;
  
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  
  engine.updateVolumes(true);
  
  // Calculate bubbles based on current playback time
  const bubbles = calculateBubbles();
  drawBubbles(bubbles);
  
  // Update and draw smoke particles
  if (isPlaying.value) {
    const currentTime = performance.now();
    
    if (lastFrameTime === 0) {
      lastFrameTime = currentTime;
    }
    
    // Calculate time delta and apply playback speed
    const deltaMs = (currentTime - lastFrameTime) * playbackSpeed.value;
    lastFrameTime = currentTime;
    
    // Update all particle effects
    updateSmokeParticles(deltaMs);
    updateSparkParticles(deltaMs);
    updateKeyGlowEffects(deltaMs);
    
    // Update playback time
    const previousTime = playbackTime.value;
    playbackTime.value += deltaMs;
    
    // Play notes that should trigger in this time range
    playNotesInTimeRange(previousTime, playbackTime.value);
    
    // Stop if we've reached the end
    if (playbackTime.value >= totalDuration.value) {
      pause();
      playbackTime.value = totalDuration.value;
    }
  } else {
    lastFrameTime = 0;
    // Still update particles even when paused
    updateSmokeParticles(16);
    updateSparkParticles(16);
    updateKeyGlowEffects(16);
  }
  
  // Draw all particles on top
  drawSmokeParticles();
  drawSparkParticles();
  
  keyboardRects.forEach(r => {
    if (!r.isBlack) drawKey(r);
  });
  
  keyboardRects.forEach(r => {
    if (r.isBlack) drawKey(r);
  });
  
  animationFrameId = requestAnimationFrame(update);
};

const onResize = () => {
  if (!canvasRef.value) return;
  
  canvasRef.value.width = window.innerWidth;
  canvasRef.value.height = window.innerHeight;
  
  canvasWidth.value = window.innerWidth;
  canvasHeight.value = window.innerHeight;
  
  engine.setDimensions(window.innerWidth, window.innerHeight);
  keyboardRects = engine.createKeyboardRects();
  
  pianoY.value = window.innerHeight * 0.73; 
  
  calcTotalDuration();
  
  // Bubbles will be recalculated automatically in the next frame
};

onMounted(async () => {
  if (!canvasRef.value) return;
  
  ctx = canvasRef.value.getContext('2d');
  engine = new PianoEngine();
  
  await engine.initSounds();
  
  onResize();
  initSheet();
  
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  
  update();
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Clear all active note timeouts
  activeNoteTimeouts.forEach(timeout => clearTimeout(timeout));
  activeNoteTimeouts.clear();
  
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
});
</script>
