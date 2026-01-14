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
 * Includes floating particles, reactive waves, and music-reactive glow
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
    const count = 18; // Increased from 15 (20% more)
    floatingParticles.value = [];
    for (let i = 0; i < count; i++) {
      floatingParticles.value.push({
        x: Math.random() * canvasWidth.value,
        y: Math.random() * canvasHeight.value,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.3 + 0.1,
        baseAlpha: Math.random() * 0.3 + 0.1,
        color: '#8b5cf6', // Purple color from COLOR_WHEEL
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  };

  const updateFloatingParticles = (dt: number) => {
    floatingParticles.value.forEach((particle) => {
      particle.x += particle.vx * dt * 0.05;
      particle.y += particle.vy * dt * 0.05;

      // Wrap around screen
      if (particle.x < 0) particle.x = canvasWidth.value;
      if (particle.x > canvasWidth.value) particle.x = 0;
      if (particle.y < 0) particle.y = canvasHeight.value;
      if (particle.y > canvasHeight.value) particle.y = 0;

      // Gentle pulsing effect
      particle.pulsePhase += dt * 0.003;
      particle.alpha = particle.baseAlpha * (0.7 + 0.3 * Math.sin(particle.pulsePhase));

      // React to music
      if (musicReactiveGlow.value.intensity > 0) {
        particle.alpha = Math.min(1, particle.alpha + musicReactiveGlow.value.intensity * 0.4);
        particle.size = Math.min(6, particle.size * (1 + musicReactiveGlow.value.intensity * 0.3));
      }
    });
  };

  const drawFloatingParticles = () => {
    if (!ctx.value || floatingParticles.value.length === 0) return;

    ctx.value.save();
    floatingParticles.value.forEach((particle) => {
      ctx.value!.globalAlpha = particle.alpha;
      ctx.value!.fillStyle = particle.color;
      ctx.value!.shadowColor = particle.color;
      ctx.value!.shadowBlur = 8;
      ctx.value!.beginPath();
      ctx.value!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.value!.fill();
    });
    ctx.value.restore();
  };

  const createBackgroundWave = (x: number, y: number, color: string) => {
    backgroundWaves.value.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: Math.random() * 200 + 150,
      alpha: 0.3,
      color: color,
      speed: Math.random() * 2 + 1
    });
  };

  const updateBackgroundWaves = (dt: number) => {
    backgroundWaves.value = backgroundWaves.value.filter((wave) => {
      wave.radius += wave.speed * dt * 0.1;
      wave.alpha = Math.max(0, 0.3 * (1 - wave.radius / wave.maxRadius));
      return wave.radius < wave.maxRadius;
    });
  };

  const drawBackgroundWaves = () => {
    if (!ctx.value || backgroundWaves.value.length === 0) return;

    ctx.value.save();
    ctx.value.lineWidth = 2;
    backgroundWaves.value.forEach((wave) => {
      ctx.value!.globalAlpha = wave.alpha;
      ctx.value!.strokeStyle = wave.color;
      ctx.value!.shadowColor = wave.color;
      ctx.value!.shadowBlur = 15;
      ctx.value!.beginPath();
      ctx.value!.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.value!.stroke();
    });
    ctx.value.restore();
  };

  const updateMusicReactiveEffects = (dt: number) => {
    // Decay reactive glow
    musicReactiveGlow.value.intensity = Math.max(0, musicReactiveGlow.value.intensity - dt * 0.005);

    // Reset particle sizes
    floatingParticles.value.forEach((particle) => {
      if (particle.size > 4) {
        particle.size = Math.max(1, particle.size * 0.98);
      }
    });
  };

  const triggerMusicReaction = (color: string) => {
    musicReactiveGlow.value.intensity = Math.min(1, musicReactiveGlow.value.intensity + 0.6);
    musicReactiveGlow.value.color = color;
    lastNoteTime = performance.now();
  };

  const drawMusicReactiveGlow = () => {
    if (!ctx.value || musicReactiveGlow.value.intensity <= 0.1) return;

    const centerX = canvasWidth.value / 2;
    const centerY = canvasHeight.value * 0.4;
    const gradient = ctx.value.createRadialGradient(centerX, centerY, 0, centerX, centerY, 600);

    const alpha0 = (musicReactiveGlow.value.intensity * 40) | 0;
    const alpha1 = (musicReactiveGlow.value.intensity * 20) | 0;
    gradient.addColorStop(
      0,
      `${musicReactiveGlow.value.color}${alpha0.toString(16).padStart(2, '0')}`
    );
    gradient.addColorStop(
      0.5,
      `${musicReactiveGlow.value.color}${alpha1.toString(16).padStart(2, '0')}`
    );
    gradient.addColorStop(1, 'transparent');

    ctx.value.save();
    ctx.value.fillStyle = gradient;
    ctx.value.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
    ctx.value.restore();
  };

  const drawBackgroundEffects = () => {
    if (!ctx.value) return;

    // Draw floating particles
    drawFloatingParticles();

    // Draw background waves
    drawBackgroundWaves();

    // Draw subtle background gradient that reacts to music
    drawMusicReactiveGlow();
  };

  return {
    floatingParticles,
    backgroundWaves,
    musicReactiveGlow,
    initFloatingParticles,
    updateFloatingParticles,
    drawFloatingParticles,
    createBackgroundWave,
    updateBackgroundWaves,
    drawBackgroundWaves,
    updateMusicReactiveEffects,
    triggerMusicReaction,
    drawMusicReactiveGlow,
    drawBackgroundEffects
  };
}
