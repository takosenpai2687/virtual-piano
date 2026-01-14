<template>
  <div
    class="fixed left-1/2 transform -translate-x-1/2 flex items-center justify-center bg-gray-900/80 backdrop-blur-xl rounded-full shadow-2xl border border-gray-700 z-50 text-white transition-all hover:bg-gray-900/95"
    style="top: 1vh; max-width: 98vw; gap: 0.4vh; padding: 0.6vh 1.2vh; flex-wrap: nowrap"
  >
    <!-- Upload -->
    <MidiUploader
      @notesConverted="
        (notes, fileName, autoPlay) => emit('notesConverted', notes, fileName, autoPlay)
      "
      @sheetSaved="emit('sheetSaved')"
    />

    <div class="hidden sm:block bg-gray-700" style="width: 1px; height: 3vh; margin: 0 0.3vh"></div>

    <!-- Stop Button -->
    <button
      @click="emit('stop')"
      class="flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-red-400 transition-all text-gray-300 active:scale-95"
      style="width: 4vh; height: 4vh; min-width: 32px; min-height: 32px"
      title="Stop"
    >
      <i class="fas fa-stop" style="font-size: 1.8vh"></i>
    </button>

    <!-- Previous Song Button -->
    <button
      @click="emit('previousSong')"
      class="flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-pink-400 transition-all text-gray-300 active:scale-95"
      style="width: 4vh; height: 4vh; min-width: 32px; min-height: 32px"
      title="Previous Song"
    >
      <i class="fas fa-step-backward" style="font-size: 1.8vh"></i>
    </button>

    <!-- Play/Pause Button -->
    <button
      @click="emit('togglePlayPause')"
      class="rounded-full bg-gradient-to-br from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 flex items-center justify-center text-white shadow-lg shadow-pink-600/30 transition-all active:scale-95"
      style="width: 5.5vh; height: 5.5vh; min-width: 44px; min-height: 44px; margin: 0 0.5vh"
    >
      <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'" style="font-size: 2.5vh"></i>
    </button>

    <!-- Next Song Button -->
    <button
      @click="emit('nextSong')"
      class="flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-pink-400 transition-all text-gray-300 active:scale-95"
      style="width: 4vh; height: 4vh; min-width: 32px; min-height: 32px"
      title="Next Song"
    >
      <i class="fas fa-step-forward" style="font-size: 1.8vh"></i>
    </button>

    <div class="hidden sm:block bg-gray-700" style="width: 1px; height: 3vh; margin: 0 0.3vh"></div>

    <!-- Speed Control -->
    <button
      @click="emit('cycleSpeed')"
      class="flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-blue-400 transition-all text-gray-300 font-bold active:scale-95"
      style="padding: 0 1vh; height: 4vh; min-height: 32px; font-size: 1.6vh; white-space: nowrap"
      :title="`Playback Speed: ${playbackSpeed}x`"
    >
      <i class="fas fa-gauge-high" style="margin-right: 0.5vh"></i>
      {{ playbackSpeed }}x
    </button>

    <div class="hidden sm:block bg-gray-700" style="width: 1px; height: 3vh; margin: 0 0.3vh"></div>

    <!-- Volume Control -->
    <div class="relative flex items-center" style="gap: 0.5vh">
      <button
        @click="showVolumeSlider = !showVolumeSlider"
        class="flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-green-400 transition-all text-gray-300 relative group active:scale-95"
        style="width: 4vh; height: 4vh; min-width: 32px; min-height: 32px"
        :title="`Volume: ${Math.round(volume * 100)}%`"
      >
        <i
          :class="['fas', volumeIcon, 'transition-all', volume > 0 ? 'animate-pulse-subtle' : '']"
          style="font-size: 1.8vh"
        ></i>
      </button>

      <!-- Volume Slider Popup -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div
          v-if="showVolumeSlider"
          class="absolute left-1/2 transform -translate-x-1/2 bg-gray-800/95 backdrop-blur-xl border border-gray-600 rounded-xl shadow-2xl z-50"
          style="top: 5vh; padding: 1vh"
        >
          <div class="flex flex-col items-center" style="gap: 0.5vh; width: 3.5vh; min-width: 32px">
            <span class="text-gray-400 font-bold" style="font-size: 1.4vh"
              >{{ Math.round(volume * 100) }}%</span
            >
            <input
              type="range"
              :value="volume"
              @input="emit('updateVolume', ($event.target as HTMLInputElement).valueAsNumber)"
              min="0"
              max="1"
              step="0.01"
              class="volume-slider appearance-none bg-gray-700 rounded-full cursor-pointer"
              style="height: 12vh; width: 0.6vh; writing-mode: vertical-lr; direction: rtl"
              :style="{ '--volume-fill': volume * 100 + '%' }"
            />
            <button
              @click="emit('updateVolume', volume > 0 ? 0 : 0.7)"
              class="text-gray-400 hover:text-white transition-colors"
              style="font-size: 1.4vh"
            >
              <i :class="['fas', volume > 0 ? 'fa-volume-off' : 'fa-volume-up']"></i>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div class="hidden sm:block bg-gray-700" style="width: 1px; height: 3vh; margin: 0 0.3vh"></div>

    <!-- Sheet Selector -->
    <div class="relative group flex items-center" style="gap: 0.5vh">
      <!-- Animated Music Icon -->
      <div
        class="music-icon-container flex items-center justify-center"
        title="Select a song"
        style="width: 3vh; height: 3vh; min-width: 24px; min-height: 24px"
      >
        <i class="fas fa-music text-pink-400 music-icon-animated" style="font-size: 1.8vh"></i>
      </div>

      <select
        ref="selectRef"
        :value="selectedSheetKey"
        @change="emit('sheetChange', ($event.target as HTMLSelectElement).value)"
        class="sheet-selector bg-transparent text-gray-200 font-bold focus:outline-none cursor-pointer appearance-none hover:text-white active:scale-95 text-xs sm:text-sm md:text-base max-w-[25vw] sm:max-w-[35vw] md:max-w-[40vw] lg:max-w-md xl:max-w-lg 2xl:max-w-xl"
        style="padding: 0.8vh 3vh 0.8vh 0.8vh"
        :style="{ width: selectWidth + 'px' }"
      >
        <option v-for="key in sheetKeys" :key="key" :value="key" class="bg-gray-800 text-white">
          {{ allSheets[key]?.name || key }}
        </option>
      </select>
      <div
        class="absolute top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
        style="right: 0.8vh"
      >
        <i class="fas fa-chevron-down" style="font-size: 1.4vh"></i>
      </div>
      <!-- Hidden span for measuring text width -->
      <span ref="measureRef" class="measure-text font-bold text-xs sm:text-sm md:text-base"></span>

      <!-- Delete Button (only for custom sheets) -->
      <button
        v-if="selectedSheetKey.startsWith('custom_')"
        @click="emit('deleteSheet')"
        class="flex items-center justify-center rounded-full hover:bg-red-600 hover:text-white transition-all text-red-400 active:scale-95"
        style="width: 3.5vh; height: 3.5vh; min-width: 28px; min-height: 28px"
        title="Delete this song"
      >
        <i class="fas fa-trash" style="font-size: 1.6vh"></i>
      </button>
    </div>

    <div class="hidden sm:block bg-gray-700" style="width: 1px; height: 3vh; margin: 0 0.3vh"></div>

    <!-- Play Mode Control -->
    <button
      @click="emit('cyclePlayMode')"
      class="flex items-center justify-center rounded-full hover:bg-gray-700 hover:text-purple-400 transition-all text-gray-300 active:scale-95 relative group"
      style="width: 4vh; height: 4vh; min-width: 32px; min-height: 32px"
      :title="playModeTitle"
    >
      <!-- FontAwesome Icon -->
      <i
        v-if="playModeIcon.type === 'fa'"
        :class="['fas', playModeIcon.icon, 'transition-all duration-300']"
        style="font-size: 1.8vh"
        :style="{ animation: 'playModeIconPulse 2s ease-in-out infinite' }"
      ></i>
      <!-- Custom SVG Icon for Single Loop -->
      <svg
        v-else-if="playModeIcon.type === 'svg' && playModeIcon.icon === 'single-loop'"
        class="transition-all duration-300"
        style="width: 2vh; height: 2vh; min-width: 16px; min-height: 16px"
        :style="{ animation: 'playModeIconPulse 2s ease-in-out infinite' }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-2.636-6.364L21 8.25V2.25h-6l2.879 2.879"></path>
        <text
          x="12"
          y="16"
          text-anchor="middle"
          fill="currentColor"
          font-size="10"
          font-weight="bold"
          stroke="none"
        >
          1
        </text>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import MidiUploader from './MidiUploader.vue';

const props = defineProps<{
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  volumeIcon: string;
  selectedSheetKey: string;
  sheetKeys: string[];
  allSheets: Record<string, any>;
  playModeIcon: { type: string; icon: string };
  playModeTitle: string;
}>();

const emit = defineEmits<{
  (e: 'stop'): void;
  (e: 'previousSong'): void;
  (e: 'nextSong'): void;
  (e: 'togglePlayPause'): void;
  (e: 'cycleSpeed'): void;
  (e: 'updateVolume', volume: number): void;
  (e: 'sheetChange', key: string): void;
  (e: 'deleteSheet'): void;
  (e: 'cyclePlayMode'): void;
  (e: 'notesConverted', notes: any[], fileName: string, autoPlay?: boolean): void;
  (e: 'sheetSaved'): void;
}>();

const showVolumeSlider = ref(false);
const selectRef = ref<HTMLSelectElement | null>(null);
const measureRef = ref<HTMLSpanElement | null>(null);
const screenWidth = ref(window.innerWidth);

// Update screen width on resize
onMounted(() => {
  const handleResize = () => {
    screenWidth.value = window.innerWidth;
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
});

const selectWidth = computed(() => {
  if (!measureRef.value) return 120;

  const currentText = props.allSheets[props.selectedSheetKey]?.name || props.selectedSheetKey;
  measureRef.value.textContent = currentText;
  const textWidth = measureRef.value.offsetWidth;

  // Get actual padding from select element if available
  let padding = 16 + 48 + 16; // default fallback
  if (selectRef.value) {
    const computedStyle = window.getComputedStyle(selectRef.value);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);
    padding = paddingLeft + paddingRight;
  }

  const calculatedWidth = textWidth + padding;

  // Responsive max width based on screen size (matching Tailwind breakpoints)
  let maxWidth = screenWidth.value * 0.25; // 25vw for mobile
  if (screenWidth.value >= 1536)
    maxWidth = 576; // 2xl: max-w-xl
  else if (screenWidth.value >= 1280)
    maxWidth = 512; // xl: max-w-lg
  else if (screenWidth.value >= 1024)
    maxWidth = 448; // lg: max-w-md
  else if (screenWidth.value >= 768)
    maxWidth = screenWidth.value * 0.4; // md: 40vw
  else if (screenWidth.value >= 640) maxWidth = screenWidth.value * 0.35; // sm: 35vw

  return Math.max(120, Math.min(maxWidth, calculatedWidth));
});
</script>

<style scoped>
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

.measure-text {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
  pointer-events: none;
  left: -9999px;
}

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
