import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Particles
    const count = Math.min(80, Math.floor(window.innerWidth / 18));
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      radius: number; opacity: number; hue: number; baseOpacity: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const baseOpacity = Math.random() * 0.25 + 0.05;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.5 + 0.5,
        opacity: baseOpacity,
        baseOpacity,
        hue: Math.random() > 0.6 ? 43 : Math.random() > 0.5 ? 210 : 152,
      });
    }

    // Grid lines (HUD aesthetic)
    const drawGrid = (time: number) => {
      ctx.strokeStyle = 'hsla(220, 15%, 25%, 0.04)';
      ctx.lineWidth = 0.5;
      const spacing = 60;
      const offsetY = (time * 0.008) % spacing;

      for (let y = -spacing + offsetY; y < canvas.height + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    };

    // Scanning line
    const drawScanLine = (time: number) => {
      const y = ((time * 0.03) % (canvas.height + 200)) - 100;
      const gradient = ctx.createLinearGradient(0, y - 40, 0, y + 40);
      gradient.addColorStop(0, 'hsla(40, 80%, 55%, 0)');
      gradient.addColorStop(0.5, 'hsla(40, 80%, 55%, 0.03)');
      gradient.addColorStop(1, 'hsla(40, 80%, 55%, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y - 40, canvas.width, 80);
    };

    let time = 0;
    const draw = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle radial glow
      const glow = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.3, canvas.width * 0.6
      );
      glow.addColorStop(0, 'hsla(40, 80%, 55%, 0.02)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid(time);
      drawScanLine(time);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.06;
            ctx.strokeStyle = `hsla(43, 70%, 50%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles with mouse interaction
      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        const mouseInfluence = Math.max(0, 1 - mouseDist / 200);

        // Particles glow near cursor
        const currentOpacity = p.baseOpacity + mouseInfluence * 0.4;
        const currentRadius = p.radius + mouseInfluence * 2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 55%, ${currentOpacity})`;
        ctx.fill();

        // Glow ring near mouse
        if (mouseInfluence > 0.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${p.hue}, 70%, 55%, ${mouseInfluence * 0.15})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Move with slight mouse repulsion
        p.x += p.vx - (mouseInfluence > 0.3 ? dx * 0.0005 : 0);
        p.y += p.vy - (mouseInfluence > 0.3 ? dy * 0.0005 : 0);

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
};

export default AnimatedBackground;
