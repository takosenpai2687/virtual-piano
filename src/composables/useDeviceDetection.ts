import { ref, computed, onMounted, onUnmounted } from 'vue';
import isMobileJS from 'ismobilejs';

/**
 * Composable for detecting device type and orientation
 * with proper mobile rotation handling
 */
export function useDeviceDetection() {
  const canvasWidth = ref(window.innerWidth);
  const canvasHeight = ref(window.innerHeight);
  
  // Device detection
  const isMobile = computed(() => {
    const mobileCheck = isMobileJS({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints
    });
    
    const minDimension = Math.min(canvasWidth.value, canvasHeight.value);
    
    // If screen is reasonably large (>=850px in smallest dimension), always treat as desktop
    // This ensures MacBook 14" (1440x900) and similar laptops work correctly
    if (minDimension >= 850) {
      return false;
    }
    
    // For smaller screens, trust ismobilejs detection
    // This correctly identifies phones and tablets while excluding small laptops
    return mobileCheck.any;
  });

  const isPortrait = computed(() => canvasHeight.value > canvasWidth.value);
  
  const isLandscape = computed(() => canvasWidth.value >= canvasHeight.value);

  const showRotatePrompt = computed(() => {
    // Show prompt when on mobile device in portrait mode
    return isMobile.value && isPortrait.value;
  });

  const isLandscapeMobile = computed(() => {
    // Detect mobile device in landscape orientation
    return isMobile.value && isLandscape.value;
  });

  const shouldThinBubbles = computed(() => {
    // Only thin bubbles on very narrow screens or mobile in portrait
    // In landscape mode on mobile, use normal bubble width
    return canvasWidth.value < 768 || (isMobile.value && isPortrait.value);
  });

  // Update dimensions
  const updateDimensions = () => {
    canvasWidth.value = window.innerWidth;
    canvasHeight.value = window.innerHeight;
  };

  // Handle resize event
  const handleResize = () => {
    updateDimensions();
  };

  // Handle orientation change specifically (fires on mobile rotation)
  const handleOrientationChange = () => {
    // Small delay to ensure dimensions are updated after rotation
    setTimeout(() => {
      updateDimensions();
    }, 100);
  };

  // Setup event listeners
  const setupListeners = () => {
    window.addEventListener('resize', handleResize);
    // Listen to orientationchange event for better mobile support
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Also listen to screen.orientation.change for modern browsers
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }
  };

  // Cleanup event listeners
  const cleanupListeners = () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleOrientationChange);
    
    if (window.screen?.orientation) {
      window.screen.orientation.removeEventListener('change', handleOrientationChange);
    }
  };

  return {
    canvasWidth,
    canvasHeight,
    isMobile,
    isPortrait,
    isLandscape,
    showRotatePrompt,
    isLandscapeMobile,
    shouldThinBubbles,
    updateDimensions,
    setupListeners,
    cleanupListeners
  };
}
