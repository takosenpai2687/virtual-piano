import { ref, computed, type Ref } from 'vue';
import type { MidiNote } from '@/types/piano';

export type PlayMode = 'single' | 'list' | 'random';

/**
 * Composable for managing playback state and controls
 * Handles play/pause, speed, volume, seeking, and play modes
 */
export function usePlaybackControls() {
  // Playback state
  const isPlaying = ref(false);
  const playbackTime = ref(0); // Current time in song (ms)
  const totalDuration = ref(1000); // Total song duration in ms
  const playbackSpeed = ref(1); // Speed multiplier
  const volume = ref(0.9); // Volume level 0-1
  const playMode = ref<PlayMode>('single'); // Play mode
  const showVolumeSlider = ref(false);

  // Computed properties
  const progressPercentage = computed(() => {
    if (totalDuration.value === 0) return 0;
    return Math.min(100, Math.max(0, (playbackTime.value / totalDuration.value) * 100));
  });

  const volumeIcon = computed(() => {
    if (volume.value === 0) return 'fa-volume-off';
    if (volume.value < 0.33) return 'fa-volume-down';
    if (volume.value < 0.66) return 'fa-volume-down';
    return 'fa-volume-up';
  });

  const playModeIcon = computed(() => {
    switch (playMode.value) {
      case 'single':
        return { type: 'svg', icon: 'single-loop' };
      case 'list':
        return { type: 'fa', icon: 'fa-sync-alt' };
      case 'random':
        return { type: 'fa', icon: 'fa-random' };
      default:
        return { type: 'svg', icon: 'single-loop' };
    }
  });

  const playModeTitle = computed(() => {
    switch (playMode.value) {
      case 'single':
        return '单曲循环 (Single Loop)';
      case 'list':
        return '列表循环 (List Loop)';
      case 'random':
        return '随机 (Random)';
      default:
        return '单曲循环';
    }
  });

  // Control methods
  const play = () => {
    isPlaying.value = true;
  };

  const pause = () => {
    isPlaying.value = false;
  };

  const stop = () => {
    isPlaying.value = false;
    playbackTime.value = 0;
  };

  const togglePlayPause = () => {
    isPlaying.value = !isPlaying.value;
  };

  const seek = (deltaMs: number) => {
    playbackTime.value = Math.max(0, Math.min(totalDuration.value, playbackTime.value + deltaMs));
  };

  const seekTo = (timeMs: number) => {
    playbackTime.value = Math.max(0, Math.min(totalDuration.value, timeMs));
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed.value);
    const nextIndex = (currentIndex + 1) % speeds.length;
    playbackSpeed.value = speeds[nextIndex];
  };

  const cyclePlayMode = () => {
    const modes: PlayMode[] = ['single', 'list', 'random'];
    const currentIndex = modes.indexOf(playMode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    playMode.value = modes[nextIndex];
    // Save to localStorage
    localStorage.setItem('playMode', playMode.value);
  };

  const updateVolume = (newVolume?: number) => {
    if (newVolume !== undefined) {
      volume.value = newVolume;
    }
    // Volume update will be handled by the parent component
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calcTotalDuration = (notes: MidiNote[]) => {
    if (notes.length === 0) {
      totalDuration.value = 1000;
      return;
    }

    const lastNote = notes[notes.length - 1];
    totalDuration.value = lastNote.TimeMs + lastNote.DurationMs + 2000; // Add 2s buffer
  };

  const getNextSheetKey = (sheetKeys: string[], currentKey: string): string | null => {
    if (sheetKeys.length === 0) return null;

    const currentIndex = sheetKeys.indexOf(currentKey);

    if (playMode.value === 'single') {
      return currentKey;
    } else if (playMode.value === 'list') {
      const nextIndex = (currentIndex + 1) % sheetKeys.length;
      return sheetKeys[nextIndex];
    } else if (playMode.value === 'random') {
      if (sheetKeys.length === 1) return sheetKeys[0];
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * sheetKeys.length);
      } while (randomIndex === currentIndex && sheetKeys.length > 1);
      return sheetKeys[randomIndex];
    }

    return null;
  };

  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    try {
      const savedPlayMode = localStorage.getItem('playMode');
      if (savedPlayMode && ['single', 'list', 'random'].includes(savedPlayMode)) {
        playMode.value = savedPlayMode as PlayMode;
      }
    } catch (err) {
      console.error('Failed to load saved settings:', err);
    }
  };

  return {
    // State
    isPlaying,
    playbackTime,
    totalDuration,
    playbackSpeed,
    volume,
    playMode,
    showVolumeSlider,

    // Computed
    progressPercentage,
    volumeIcon,
    playModeIcon,
    playModeTitle,

    // Methods
    play,
    pause,
    stop,
    togglePlayPause,
    seek,
    seekTo,
    cycleSpeed,
    cyclePlayMode,
    updateVolume,
    formatTime,
    calcTotalDuration,
    getNextSheetKey,
    loadSavedSettings
  };
}
