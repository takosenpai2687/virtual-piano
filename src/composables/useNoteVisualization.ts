import { ref, type Ref } from 'vue';
import type { MidiNote, KeyboardRect, Bubble } from '@/types/piano';
import { COLOR_WHEEL } from '@/types/piano';

/**
 * Composable for managing falling note visualization (bubbles)
 * Handles rendering and collision detection with keyboard
 */
export function useNoteVisualization(
  midiNotes: MidiNote[],
  keyboardRects: KeyboardRect[],
  playbackTime: Ref<number>,
  canvasHeight: Ref<number>,
  shouldThinBubbles: Ref<boolean>,
  cachedWhiteKeyWidth: Ref<number>,
  cachedBlackKeyWidth: Ref<number>
) {
  const cachedBubbleWidth = ref(0);

  const updateBubbleWidth = () => {
    cachedBubbleWidth.value = cachedWhiteKeyWidth.value - cachedBlackKeyWidth.value;
    if (shouldThinBubbles.value) {
      cachedBubbleWidth.value *= 0.5;
    }
  };

  const getBubbles = (): Bubble[] => {
    const pianoY = canvasHeight.value * 0.73;
    const bubbles: Bubble[] = [];
    const bubbleWidth = cachedBubbleWidth.value;
    const currentTime = playbackTime.value;

    // Calculate visible time window for early exit optimization
    const minVisibleTime = currentTime - canvasHeight.value;
    const maxVisibleTime = currentTime + pianoY;

    for (const note of midiNotes) {
      // Early exit if note hasn't started yet (notes are sorted by time)
      if (note.TimeMs > maxVisibleTime) break;
      
      // Skip notes that have already passed
      if (note.TimeMs + note.DurationMs < minVisibleTime) continue;
      
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
      const bottomY = pianoY - (note.TimeMs - playbackTime.value);
      const y = bottomY - height;

      // Skip bubbles that haven't appeared yet (still above screen)
      if (bottomY < 0) continue;

      // Skip bubbles that have already passed the piano line
      if (y > pianoY) continue;

      // Cache color to avoid redundant calculation
      const color = COLOR_WHEEL[midiKey % COLOR_WHEEL.length];

      // Position bubble centered on key
      const x = keyRect.x + keyRect.width / 2 - bubbleWidth / 2;

      bubbles.push({
        x,
        y,
        width: bubbleWidth,
        height,
        color,
        keyboardRectIndex: keyIndex
      });
    }

    return bubbles;
  };

  const checkBubbleCollision = (bubble: Bubble, pianoY: number): boolean => {
    // Check if bubble is touching the keyboard (within 5px tolerance)
    const bottomY = bubble.y + bubble.height;
    return bottomY >= pianoY - 5 && bottomY <= pianoY + 5;
  };

  const drawBubble = (
    ctx: CanvasRenderingContext2D,
    bubble: Bubble,
    shouldThin: boolean
  ) => {
    const { x, y, width, height, color } = bubble;

    // Create gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, adjustColorBrightness(color, -30));

    // Draw bubble body
    ctx.fillStyle = gradient;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    if (shouldThin) {
      // Thin bubble (mobile/narrow view)
      drawRoundedRect(ctx, x, y, width, height, width / 2);
    } else {
      // Normal bubble
      drawRoundedRect(ctx, x, y, width, height, 5);
    }

    ctx.fill();

    // Draw highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const highlightHeight = Math.min(height * 0.3, 20);
    drawRoundedRect(ctx, x + width * 0.1, y + height * 0.05, width * 0.8, highlightHeight, 3);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
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
  };

  const adjustColorBrightness = (color: string, amount: number): string => {
    // Parse hex color
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return {
    cachedBubbleWidth,
    updateBubbleWidth,
    getBubbles,
    checkBubbleCollision,
    drawBubble
  };
}
