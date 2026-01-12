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

  const addSmokeParticle = (x: number, y: number, color: string) => {
    const count = 3;
    for (let i = 0; i < count; i++) {
      smokeParticles.value.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 1,
        life: 1,
        maxLife: 1,
        size: Math.random() * 15 + 10,
        color: color,
        alpha: 0.6
      });
    }
  };

  const addSparkParticles = (x: number, y: number, color: string) => {
    const sparkCount = 8;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.3;
      const speed = Math.random() * 3 + 2;
      sparkParticles.value.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 4 + 2,
        color: color,
        alpha: 1,
        brightness: 1
      });
    }
  };

  const updateSmokeParticles = () => {
    smokeParticles.value = smokeParticles.value.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // Gravity
      p.life -= 0.015;
      p.alpha = p.life * 0.6;
      p.size += 0.5; // Expand over time
      return p.life > 0;
    });
  };

  const updateSparkParticles = () => {
    sparkParticles.value = sparkParticles.value.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.vx *= 0.98; // Friction
      p.vy *= 0.98;
      p.life -= 0.04;
      p.alpha = p.life;
      p.brightness = p.life;
      return p.life > 0;
    });
  };

  const updateKeyGlowEffects = (currentTime: number) => {
    keyGlowEffects.value.forEach((effect, key) => {
      const elapsed = currentTime - effect.time;
      effect.intensity = Math.max(0, 1 - elapsed / 500); // Fade over 500ms
      if (effect.intensity <= 0) {
        keyGlowEffects.value.delete(key);
      }
    });
  };

  const addKeyGlowEffect = (keyIndex: number, color: string) => {
    keyGlowEffects.value.set(keyIndex, {
      intensity: 1,
      color: color,
      time: Date.now()
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
    addSmokeParticle,
    addSparkParticles,
    updateSmokeParticles,
    updateSparkParticles,
    updateKeyGlowEffects,
    addKeyGlowEffect,
    drawSmokeParticles,
    drawSparkParticles
  };
}
