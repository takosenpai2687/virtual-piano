<template>
  <div class="fixed w-full cursor-pointer z-40 group transition-all" 
    style="height: 2rem; bottom: 28%;"
    @click="handleClick" @mousemove="handleHover" @mouseleave="handleLeave">
    <!-- Track -->
    <div
      class="absolute top-1/2 left-0 w-full bg-gray-700/50 transition-all transform -translate-y-1/2 backdrop-blur-sm"
      style="height: 0.25rem;">
    </div>

    <!-- Progress Fill -->
    <div
      class="absolute top-1/2 left-0 bg-gradient-to-r from-pink-500 to-purple-500 transition-[height] transform -translate-y-1/2"
      style="height: 0.25rem; box-shadow: 0 0 0.625rem rgba(236, 72, 153, 0.5);"
      :style="{ width: `${progressPercentage}%` }">
      <!-- Throbber/Handle with Glow -->
      <div
        class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-white rounded-full opacity-100 transition-all scale-100 group-hover:scale-150"
        style="width: 1rem; height: 1rem; box-shadow: 0 0 0.5rem 0.125rem rgba(236, 72, 153, 0.6), 0 0 1rem 0.25rem rgba(236, 72, 153, 0.4), 0 0 1.5rem 0.375rem rgba(236, 72, 153, 0.2), 0 0 2rem 0.5rem rgba(236, 72, 153, 0.1);">
      </div>
    </div>

    <!-- Timestamp Display (Current / Total) -->
    <div
      class="absolute top-0 transform -translate-y-full bg-gray-900/90 backdrop-blur-md rounded-full text-white font-mono shadow-lg border border-gray-700"
      style="right: 1rem; margin-bottom: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.875rem;">
      {{ formatTime(playbackTime) }} / {{ formatTime(totalDuration) }}
    </div>

    <!-- Hover Tooltip -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 scale-90 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-1">
      <div
        v-if="hoverTime !== null"
        class="absolute bottom-full bg-gray-900/95 backdrop-blur-md rounded-lg text-white font-mono shadow-xl border border-pink-500/50 pointer-events-none"
        style="margin-bottom: 0.5rem; padding: 0.375rem 0.625rem; font-size: 0.75rem;"
        :style="{ left: `${hoverX}px`, transform: 'translateX(-50%)' }">
        {{ formatTime(hoverTime) }}
        <!-- Arrow -->
        <div class="absolute top-full left-1/2 transform -translate-x-1/2" style="margin-top: -1px;">
          <div class="w-0 h-0 border-transparent border-t-pink-500/50" style="border-left-width: 0.25rem; border-right-width: 0.25rem; border-top-width: 0.25rem;"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  progressPercentage: number;
  playbackTime: number;
  totalDuration: number;
  formatTime: (ms: number) => string;
}>();

const emit = defineEmits<{
  (e: 'seek', time: number): void;
}>();

const hoverTime = ref<number | null>(null);
const hoverX = ref(0);

const handleClick = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = x / rect.width;
  const time = percentage * props.totalDuration;
  emit('seek', time);
};

const handleHover = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = x / rect.width;
  hoverTime.value = percentage * props.totalDuration;
  hoverX.value = x;
};

const handleLeave = () => {
  hoverTime.value = null;
};
</script>
