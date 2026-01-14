import { ref, type Ref } from 'vue';

/**
 * Composable for animated electric wave border effect
 * Renders a flowing wave animation at the top of the keyboard
 */
export function useWaveAnimation(waveColor: string) {
  const waveCanvasRef = ref<HTMLCanvasElement | null>(null);
  let waveAnimationId: number;

  const initWaveCanvas = (keyboardY: number) => {
    if (!waveCanvasRef.value) return;

    waveCanvasRef.value.width = window.innerWidth;
    waveCanvasRef.value.height = 60;
    // Position wave at keyboard top edge (keyboard is at 73% from top)
    waveCanvasRef.value.style.top = `${keyboardY - 30}px`;
  };

  const animateWaves = () => {
    if (!waveCanvasRef.value) return;

    const waveCtx = waveCanvasRef.value.getContext('2d');
    if (!waveCtx) return;

    const width = waveCanvasRef.value.width;
    const height = waveCanvasRef.value.height;
    const centerY = height / 2;

    let time = 0;

    const drawWave = () => {
      waveCtx.clearRect(0, 0, width, height);

      time += 0.02;

      // Define 3 wave layers: 1 thick stable base wave + 2 complex composite waves
      const waves = [
        { freq: 0.02, amp: 2, phase: time * 0.5, speed: 0.3, color: waveColor, width: 8, glow: 30 }, // Thick stable base wave
        {
          freq: 0.025,
          amp: 3.5,
          phase: time * 1.2,
          speed: 1,
          color: waveColor,
          width: 3,
          glow: 20
        }, // Complex wave 1
        {
          freq: 0.035,
          amp: 2.5,
          phase: time * 0.8,
          speed: -0.7,
          color: waveColor,
          width: 2.5,
          glow: 25
        } // Complex wave 2
      ];

      // Draw each wave layer
      waves.forEach((wave, index) => {
        waveCtx.beginPath();
        waveCtx.strokeStyle = wave.color;
        waveCtx.lineWidth = wave.width;
        waveCtx.shadowColor = wave.color;
        waveCtx.shadowBlur = wave.glow;
        waveCtx.lineCap = 'round';
        waveCtx.lineJoin = 'round';

        for (let x = 0; x <= width; x += 2) {
          // Complex wave function: combine multiple sine waves with different frequencies
          let y = centerY;

          // Primary wave
          y += Math.sin(x * wave.freq + wave.phase + wave.speed * time) * wave.amp;

          // Add harmonics for complexity
          y += Math.sin(x * wave.freq * 2.3 + wave.phase * 1.7) * (wave.amp * 0.3);
          y += Math.sin(x * wave.freq * 3.7 + wave.phase * 0.6) * (wave.amp * 0.2);
          y += Math.sin(x * wave.freq * 5.1 - wave.phase * 1.3) * (wave.amp * 0.15);

          // Add dampening near edges for visual interest
          const edgeFactor = Math.min(x / 100, (width - x) / 100, 1);
          const dampening = Math.pow(edgeFactor, 0.5);
          y = centerY + (y - centerY) * dampening;

          if (x === 0) {
            waveCtx.moveTo(x, y);
          } else {
            waveCtx.lineTo(x, y);
          }
        }

        waveCtx.stroke();

        // Add extra glow layer for the brightest wave
        if (index === 2) {
          waveCtx.shadowBlur = wave.glow * 2;
          waveCtx.globalAlpha = 0.3;
          waveCtx.stroke();
          waveCtx.globalAlpha = 1;
        }
      });

      waveAnimationId = requestAnimationFrame(drawWave);
    };

    drawWave();
  };

  const stopWaveAnimation = () => {
    if (waveAnimationId) {
      cancelAnimationFrame(waveAnimationId);
    }
  };

  const repositionWave = (keyboardY: number) => {
    if (waveCanvasRef.value) {
      waveCanvasRef.value.width = window.innerWidth;
      waveCanvasRef.value.height = 60;
      waveCanvasRef.value.style.top = `${keyboardY - 30}px`;

      // Restart wave animation to adapt to new dimensions
      if (waveAnimationId) {
        cancelAnimationFrame(waveAnimationId);
      }
      animateWaves();
    }
  };

  return {
    waveCanvasRef,
    initWaveCanvas,
    animateWaves,
    stopWaveAnimation,
    repositionWave
  };
}
