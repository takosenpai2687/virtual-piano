import { ref, type Ref } from 'vue';
import { PianoEngine, toneAudio } from '@/services/pianoEngine';
import type { KeyboardRect } from '@/types/piano';

/**
 * Composable for handling keyboard, mouse, and touch interactions with the piano
 */
export function useKeyboardInteraction(
  engine: PianoEngine,
  keyboardRects: Ref<KeyboardRect[]>,
  canvasRef: Ref<HTMLCanvasElement | null>,
  onKeyPress: (midiKey: number) => void,
  NOTE_DURATION_MULTIPLIER: number = 1.67
) {
  const isMouseDown = ref(false);
  const mousePressedKey = ref<number | null>(null);
  const manualReleaseTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map();

  const onMouseDown = (e: MouseEvent | TouchEvent) => {
    if (!canvasRef.value) return;

    // Prevent default touch behavior (scrolling, zooming)
    if ('touches' in e) {
      e.preventDefault();
    }

    const rect = canvasRef.value.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let midiKey: number | null | undefined = null;
    const blackKey = keyboardRects.value.find(r => r.isBlack &&
      x >= r.x && x <= r.x + r.width &&
      y >= r.y && y <= r.y + r.height
    );

    if (blackKey) {
      midiKey = blackKey.index + 36;
    } else {
      midiKey = engine.resolveKeyByMouse(x, y, keyboardRects.value);
    }

    if (!midiKey) return;

    isMouseDown.value = true;
    const currentKeys = engine.getCurrentKeys();

    if (currentKeys.length > 0 && currentKeys.includes(midiKey)) {
      engine.playSound(midiKey, 127);
      mousePressedKey.value = midiKey;
      onKeyPress(midiKey);
      return;
    }

    engine.addCurrentKey(midiKey);
    mousePressedKey.value = midiKey;
    engine.playSound(midiKey, 127);
    onKeyPress(midiKey);
  };

  const onMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isMouseDown.value || !canvasRef.value) return;

    // Prevent default touch behavior (scrolling)
    if ('touches' in e) {
      e.preventDefault();
    }

    const rect = canvasRef.value.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let midiKey: number | null | undefined = null;
    const blackKey = keyboardRects.value.find(r => r.isBlack &&
      x >= r.x && x <= r.x + r.width &&
      y >= r.y && y <= r.y + r.height
    );

    if (blackKey) {
      midiKey = blackKey.index + 36;
    } else {
      midiKey = engine.resolveKeyByMouse(x, y, keyboardRects.value);
    }

    if (!midiKey) return;

    if (mousePressedKey.value !== null && midiKey && midiKey !== mousePressedKey.value) {
      // Remove visual immediately for the previous key
      engine.removeCurrentKeyVisual(mousePressedKey.value);
      
      // Schedule delayed audio release for the previous key with sustain
      const releaseDelay = 200;
      const keyToRelease = mousePressedKey.value;
      
      // Clear any existing timeout for this key
      if (manualReleaseTimeouts.has(keyToRelease)) {
        clearTimeout(manualReleaseTimeouts.get(keyToRelease)!);
      }
      
      const timeout = setTimeout(() => {
        toneAudio.releaseNote(keyToRelease);
        manualReleaseTimeouts.delete(keyToRelease);
      }, releaseDelay);
      
      manualReleaseTimeouts.set(keyToRelease, timeout);
      
      // Start new key immediately
      mousePressedKey.value = midiKey;
      engine.addCurrentKey(midiKey);
      engine.getCurrentKeys().forEach(mk => engine.playSound(mk, 127));
      onKeyPress(midiKey);
    }
  };

  const onMouseUp = () => {
    if (mousePressedKey.value !== null) {
      // Remove visual immediately for instant feedback
      engine.removeCurrentKeyVisual(mousePressedKey.value);
      
      // Apply sustain delay for audio only
      const releaseDelay = 300 * NOTE_DURATION_MULTIPLIER;
      
      // Clear any existing timeout for this key
      if (manualReleaseTimeouts.has(mousePressedKey.value)) {
        clearTimeout(manualReleaseTimeouts.get(mousePressedKey.value)!);
      }
      
      const keyToRelease = mousePressedKey.value;
      const timeout = setTimeout(() => {
        toneAudio.releaseNote(keyToRelease);
        manualReleaseTimeouts.delete(keyToRelease);
      }, releaseDelay);
      
      manualReleaseTimeouts.set(mousePressedKey.value, timeout);
      mousePressedKey.value = null;
    }
    isMouseDown.value = false;
  };

  const onKeyDown = (e: KeyboardEvent, onSpacePress: () => void, onArrowLeft: () => void, onArrowRight: () => void) => {
    if (e.code === 'Space') {
      e.preventDefault();
      onSpacePress();
      return;
    }

    // Left arrow key: rewind 10 seconds
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      onArrowLeft();
      return;
    }

    // Right arrow key: forward 10 seconds
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      onArrowRight();
      return;
    }

    if (e.repeat) return;

    const midiKey = engine.resolveKeyByKeyboard(e.key, e.shiftKey);
    if (!midiKey) return;

    if (!engine.getCurrentKeys().includes(midiKey)) {
      engine.addCurrentKey(midiKey);
      engine.playSound(midiKey, 127);
      onKeyPress(midiKey);
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') return;

    const midiKeyReleased = engine.resolveKeyByKeyboard(e.key, e.shiftKey);
    if (!midiKeyReleased) return;

    // Remove visual immediately for instant feedback
    engine.removeCurrentKeyVisual(midiKeyReleased);

    // Apply sustain delay for audio only
    const releaseDelay = 300 * NOTE_DURATION_MULTIPLIER;
    
    // Clear any existing timeout for this key
    if (manualReleaseTimeouts.has(midiKeyReleased)) {
      clearTimeout(manualReleaseTimeouts.get(midiKeyReleased)!);
    }
    
    const timeout = setTimeout(() => {
      toneAudio.releaseNote(midiKeyReleased);
      manualReleaseTimeouts.delete(midiKeyReleased);
    }, releaseDelay);
    
    manualReleaseTimeouts.set(midiKeyReleased, timeout);
  };

  const cleanup = () => {
    manualReleaseTimeouts.forEach(timeout => clearTimeout(timeout));
    manualReleaseTimeouts.clear();
  };

  return {
    isMouseDown,
    mousePressedKey,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown,
    onKeyUp,
    cleanup
  };
}
