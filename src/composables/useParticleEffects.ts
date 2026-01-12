import { ref, type Ref } from 'vue';

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  brightness: number;
}

export interface KeyGlowEffect {
  intensity: number;
  color: string;
  time: number;
}

/**
 * Composable for managing particle effects on key press
 * Includes smoke, sparks, and key glow effects
 */
export function useParticleEffects(ctx: Ref<CanvasRenderingContext2D | null>) {
  const smokeParticles = ref<SmokeParticle[]>([]);
  const sparkParticles = ref<SparkParticle[]>([]);
  const keyGlowEffects = ref<Map<number, KeyGlowEffect>>(new Map());

  const createSmokeParticles = (x: number, y: number, color: string) => {
    // Create 2-3 smoke particles
    const count = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < count; i++) {
      smokeParticles.value.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.8 - 0.3,
        life: 1,
        maxLife: Math.random() * 300 + 200,
        size: Math.random() * 8 + 4,
        color: color,
        alpha: 0.6
      });
    }
  };

  const createElectricSparks = (x: number, y: number, color: string, width: number) => {
    // Create 8-12 electric spark particles
    const count = Math.floor(Math.random() * 5) + 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI / 2; // Upward hemisphere
      const speed = Math.random() * 1.5 + 0.5;
      sparkParticles.value.push({
        x: x + (Math.random() - 0.5) * width,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 200 + 150,
        size: Math.random() * 3 + 2,
        color: color,
        alpha: 1,
        brightness: Math.random() * 0.5 + 0.5
      });
    }
  };

  const updateSmokeParticles = (dt: number) => {
    smokeParticles.value = smokeParticles.value.filter(p => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.001 * dt; // slight gravity
      p.alpha = Math.max(0, 0.6 * (1 - p.life / p.maxLife));
      p.size += 0.02 * dt; // grow slightly
      return p.life < p.maxLife;
    });
  };

  const updateSparkParticles = (dt: number) => {
    sparkParticles.value = sparkParticles.value.filter(p => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.003 * dt; // gravity
      p.vx *= 0.98; // air resistance
      p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
      return p.life < p.maxLife;
    });
  };

  const updateKeyGlowEffects = (dt: number) => {
    keyGlowEffects.value.forEach((effect, key) => {
      effect.time += dt;
      effect.intensity = Math.max(0, 1 - (effect.time / 300)); // Fade over 300ms
      if (effect.intensity <= 0) {
        keyGlowEffects.value.delete(key);
      }
    });
  };

  const addKeyGlowEffect = (keyIndex: number, color: string) => {
    keyGlowEffects.value.set(keyIndex, {
      intensity: 1,
      color: color,
      time: 0
    });
  };

  const drawSmokeParticles = () => {
    if (!ctx.value || smokeParticles.value.length === 0) return;

    ctx.value.save();
    smokeParticles.value.forEach(p => {
      ctx.value!.globalAlpha = p.alpha;
      ctx.value!.fillStyle = p.color;
      ctx.value!.shadowColor = p.color;
      ctx.value!.shadowBlur = 15;
      ctx.value!.beginPath();
      ctx.value!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.value!.fill();
    });
    ctx.value.restore();
  };

  const drawSparkParticles = () => {
    if (!ctx.value || sparkParticles.value.length === 0) return;

    ctx.value.save();
    sparkParticles.value.forEach(p => {
      ctx.value!.globalAlpha = p.alpha;

      // Draw bright core
      ctx.value!.fillStyle = '#ffffff';
      ctx.value!.shadowColor = p.color;
      ctx.value!.shadowBlur = 20 * p.brightness;
      ctx.value!.beginPath();
      ctx.value!.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.value!.fill();

      // Draw colored glow
      ctx.value!.fillStyle = p.color;
      ctx.value!.shadowBlur = 15 * p.brightness;
      ctx.value!.beginPath();
      ctx.value!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.value!.fill();
    });
    ctx.value.restore();
  };

  return {
    smokeParticles,
    sparkParticles,
    keyGlowEffects,
    createSmokeParticles,
    createElectricSparks,
    updateSmokeParticles,
    updateSparkParticles,
    updateKeyGlowEffects,
    addKeyGlowEffect,
    drawSmokeParticles,
    drawSparkParticles
  };
}
