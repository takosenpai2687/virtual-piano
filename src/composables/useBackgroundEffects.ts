import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulsePhase: number;
}

export interface BackgroundWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  speed: number;
}

/**
 * Composable for managing background visual effects
 * Includes floating particles and reactive waves
 */
export function useBackgroundEffects(
  ctx: Ref<CanvasRenderingContext2D | null>,
  canvasWidth: Ref<number>,
  canvasHeight: Ref<number>
) {
  const floatingParticles = ref<FloatingParticle[]>([]);
  const backgroundWaves = ref<BackgroundWave[]>([]);
  const musicReactiveGlow = ref({ intensity: 0, color: '#4f46e5' });
  let lastNoteTime = 0;

  const initFloatingParticles = () => {
    floatingParticles.value = [];
    const particleCount = Math.floor((canvasWidth.value * canvasHeight.value) / 20000); // Adjust density based on screen size

    for (let i = 0; i < particleCount; i++) {
      floatingParticles.value.push({
        x: Math.random() * canvasWidth.value,
        y: Math.random() * canvasHeight.value,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        baseAlpha: Math.random() * 0.5 + 0.2,
        color: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`, // Blue-purple range
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  };

  const updateFloatingParticles = () => {
    floatingParticles.value.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen edges
      if (p.x < 0) p.x = canvasWidth.value;
      if (p.x > canvasWidth.value) p.x = 0;
      if (p.y < 0) p.y = canvasHeight.value;
      if (p.y > canvasHeight.value) p.y = 0;

      // Pulse effect
      p.pulsePhase += 0.02;
      p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.2;
    });
  };

  const drawFloatingParticles = () => {
    if (!ctx.value || floatingParticles.value.length === 0) return;

    ctx.value.save();
    floatingParticles.value.forEach(p => {
      ctx.value!.globalAlpha = p.alpha;
      ctx.value!.fillStyle = p.color;
      ctx.value!.shadowColor = p.color;
      ctx.value!.shadowBlur = 8;
      ctx.value!.beginPath();
      ctx.value!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.value!.fill();
    });
    ctx.value.restore();
  };

  const addBackgroundWave = (x: number, y: number) => {
    const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];
    backgroundWaves.value.push({
      x,
      y,
      radius: 0,
      maxRadius: 150,
      alpha: 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2
    });
  };

  const updateBackgroundWaves = () => {
    backgroundWaves.value = backgroundWaves.value.filter(wave => {
      wave.radius += wave.speed;
      wave.alpha *= 0.97;
      return wave.alpha > 0.01;
    });
  };

  const drawBackgroundWaves = () => {
    if (!ctx.value || backgroundWaves.value.length === 0) return;

    ctx.value.save();
    backgroundWaves.value.forEach(wave => {
      ctx.value!.globalAlpha = wave.alpha;
      ctx.value!.strokeStyle = wave.color;
      ctx.value!.lineWidth = 3;
      ctx.value!.shadowColor = wave.color;
      ctx.value!.shadowBlur = 15;
      ctx.value!.beginPath();
      ctx.value!.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.value!.stroke();
    });
    ctx.value.restore();
  };

  const updateMusicReactiveGlow = (currentTime: number) => {
    const timeSinceLastNote = currentTime - lastNoteTime;
    if (timeSinceLastNote < 100) {
      musicReactiveGlow.value.intensity = 1;
    } else {
      musicReactiveGlow.value.intensity *= 0.95;
    }
  };

  const triggerMusicReaction = (midiKey: number) => {
    lastNoteTime = Date.now();
    const hue = (midiKey * 5) % 360;
    musicReactiveGlow.value.color = `hsl(${hue}, 70%, 50%)`;
    musicReactiveGlow.value.intensity = 1;
  };

  const drawMusicReactiveGlow = () => {
    if (!ctx.value || musicReactiveGlow.value.intensity <= 0.01) return;

    ctx.value.save();
    ctx.value.globalAlpha = musicReactiveGlow.value.intensity * 0.15;
    ctx.value.fillStyle = musicReactiveGlow.value.color;
    ctx.value.shadowColor = musicReactiveGlow.value.color;
    ctx.value.shadowBlur = 100;
    const centerX = canvasWidth.value / 2;
    const centerY = canvasHeight.value * 0.73;
    ctx.value.beginPath();
    ctx.value.arc(centerX, centerY, 200, 0, Math.PI * 2);
    ctx.value.fill();
    ctx.value.restore();
  };

  return {
    floatingParticles,
    backgroundWaves,
    musicReactiveGlow,
    initFloatingParticles,
    updateFloatingParticles,
    drawFloatingParticles,
    addBackgroundWave,
    updateBackgroundWaves,
    drawBackgroundWaves,
    updateMusicReactiveGlow,
    triggerMusicReaction,
    drawMusicReactiveGlow
  };
}
