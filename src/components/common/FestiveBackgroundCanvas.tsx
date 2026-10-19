import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  maxAlpha: number;
  pulseSpeed: number;
}

export const FestiveBackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor(width / 20), 55);
    const particles: Particle[] = [];

    const colors = theme === 'dark' 
      ? ['#B89551', '#B9653C', '#E28C5F', '#D4AF37', '#70232B', '#F7F1E7']
      : ['#B9653C', '#B89551', '#70232B', '#D4AF37', '#91333D', '#E28C5F'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.2, // Slow upward festive float
        alpha: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        maxAlpha: Math.random() * 0.5 + 0.4,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle mouse ambient glow orb
      const ambientGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 250);
      if (theme === 'dark') {
        ambientGrad.addColorStop(0, 'rgba(184, 149, 81, 0.08)');
        ambientGrad.addColorStop(1, 'rgba(112, 35, 43, 0)');
      } else {
        ambientGrad.addColorStop(0, 'rgba(185, 101, 60, 0.10)');
        ambientGrad.addColorStop(1, 'rgba(184, 149, 81, 0)');
      }
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // Render drifting festive particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        p.alpha += p.pulseSpeed;
        if (p.alpha > p.maxAlpha || p.alpha < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
    />
  );
};
