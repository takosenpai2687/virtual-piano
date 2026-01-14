import { computed, type Ref, type ComputedRef } from 'vue';
import type { MidiNote, KeyboardRect, Bubble } from '@/types/piano';
import { COLOR_WHEEL, SHADOW_BLUR } from '@/types/piano';

/**
 * Composable for managing falling note visualization (bubbles)
 * Handles rendering and collision detection with keyboard
 */
export function useNoteVisualization(
  ctx: Ref<CanvasRenderingContext2D | null>,
  midiNotes: Ref<MidiNote[]>,
  keyboardRects: Ref<KeyboardRect[]>,
  playbackTime: Ref<number>,
  canvasHeight: Ref<number>,
  shouldThinBubbles: Ref<boolean>,
  cachedWhiteKeyWidth: Ref<number>,
  cachedBlackKeyWidth: Ref<number>
) {
  const cachedBubbleWidth = computed(() => {
    let width = cachedWhiteKeyWidth.value - cachedBlackKeyWidth.value;
    if (shouldThinBubbles.value) {
      width *= 0.5;
    }
    return width;
  });

  const calculateBubbles = (): Bubble[] => {
    const pianoY = canvasHeight.value * 0.73;
    const bubbles: Bubble[] = [];
    const bubbleWidth = cachedBubbleWidth.value;
    const currentTime = playbackTime.value;

    // Calculate visible time window for early exit optimization
    const minVisibleTime = currentTime - canvasHeight.value;
    const maxVisibleTime = currentTime + pianoY;

    for (const note of midiNotes.value) {
      // Early exit if note hasn't started yet (notes are sorted by time)
      if (note.TimeMs > maxVisibleTime) break;

      // Skip notes that have already passed
      if (note.TimeMs + note.DurationMs < minVisibleTime) continue;
      const midiKey = note.Key;
      const keyIndex = midiKey - 36;

      // Find the keyboard rect for this key
      const keyRect = keyboardRects.value[keyIndex];
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
    const bottomY = bubble.y + bubble.height;
    return bottomY >= pianoY - 5 && bottomY <= pianoY + 5;
  };

  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  const darkenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
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
    // Remove shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const drawBubbles = (bubbles: Bubble[]) => {
    if (!ctx.value) return;

    bubbles.forEach((b) => {
      ctx.value!.save();

      // Create beautiful gradient for each bubble
      const gradient = ctx.value!.createLinearGradient(b.x, b.y, b.x, b.y + b.height);

      // Lighter shade at top, main color at bottom
      const mainColor = b.color;
      const lighterColor = lightenColor(mainColor, 30);
      const darkerColor = darkenColor(mainColor, 10);

      gradient.addColorStop(0, lighterColor);
      gradient.addColorStop(0.5, mainColor);
      gradient.addColorStop(1, darkerColor);

      ctx.value!.fillStyle = gradient;
      ctx.value!.shadowColor = mainColor;
      ctx.value!.shadowBlur = SHADOW_BLUR;

      drawRoundRect(ctx.value!, b.x, b.y, b.width, b.height, b.width / 2, true, false);

      ctx.value!.restore();
    });
  };

  return {
    cachedBubbleWidth,
    calculateBubbles,
    checkBubbleCollision,
    drawBubbles
  };
}
