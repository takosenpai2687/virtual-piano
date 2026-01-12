<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95">
    <div v-if="show" class="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center">
      <div class="text-center" style="padding: 0 2rem;">
        <div class="rotate-phone-icon" style="margin-bottom: 2rem;">
          <i class="fas fa-mobile-screen text-white" style="font-size: 3.75rem;"></i>
        </div>
        <h2 class="font-bold text-white" style="font-size: 1.875rem; margin-bottom: 1rem;">Rotate Your Device</h2>
        <p class="text-gray-300" style="font-size: 1.125rem; margin-bottom: 0.5rem;">Please rotate your phone to landscape mode</p>
        <p class="text-gray-400" style="font-size: 0.875rem;">for the best piano experience</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
}>();
</script>

<style scoped>
.rotate-phone-icon {
  animation: rotatePhone 2s ease-in-out infinite;
}

@keyframes rotatePhone {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-90deg) scale(1.1);
  }
  50% {
    transform: rotate(-90deg) scale(1.1);
  }
  75% {
    transform: rotate(-90deg) scale(1.1);
  }
}
</style>
