import React, { useEffect, useRef, useState } from "react";

export const ScrollHelmetBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Mouse move listener for interactive 3D Parallax tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mousePos.current.targetX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      mousePos.current.targetY = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize 60 floating neon particles
    const particles = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2.5 + 0.8,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: -Math.random() * 0.8 - 0.2,
      alpha: Math.random() * 0.7 + 0.3,
      color: Math.random() > 0.4 ? "#ff3b00" : Math.random() > 0.5 ? "#a855f7" : "#38bdf8",
    }));

    let time = 0;
    let scanLineY = 0;

    const render = () => {
      time += 0.018;
      const w = canvas.width;
      const h = canvas.height;

      // Smooth mouse interpolation (ease-out)
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      ctx.clearRect(0, 0, w, h);

      const p = scrollProgress;

      // --- 1. DRAW FLOATING NEON PARTICLES FIELD ---
      particles.forEach((pt) => {
        pt.y += pt.speedY * (1 + p * 1.5);
        pt.x += pt.speedX + Math.sin(time + pt.y * 0.01) * 0.3;

        if (pt.y < -10) {
          pt.y = h + 10;
          pt.x = Math.random() * w;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = pt.alpha * (0.4 + Math.sin(time * 2 + pt.x) * 0.3);
        ctx.fill();
        ctx.restore();
      });

      // --- 2. VERTICAL SCANNING LASER BEAM ---
      scanLineY = (scanLineY + 2.5) % (h + 100);
      ctx.save();
      const scanGrad = ctx.createLinearGradient(0, scanLineY - 20, 0, scanLineY + 20);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(123, 63, 255, 0.15)");
      scanGrad.addColorStop(0.8, "rgba(255, 59, 0, 0.25)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanLineY - 20, w, 40);

      ctx.strokeStyle = "rgba(255, 59, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "#ff3b00";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(w, scanLineY);
      ctx.stroke();
      ctx.restore();

      // --- 3. HELMET 3D CALCULATION & PARALLAX ---
      const yaw = -75 + p * 75 + mousePos.current.x * 8; // degrees
      const pitch = Math.sin(p * Math.PI) * 12 + mousePos.current.y * 6;
      const scale = 1.05 + Math.sin(p * Math.PI * 0.85) * 0.28;

      const floatY = Math.sin(time * 1.6) * 10;

      ctx.save();
      const centerX = w > 1024 ? w * 0.72 : w * 0.5;
      const centerY = h * 0.46 + floatY;

      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      const radYaw = (yaw * Math.PI) / 180;
      const radPitch = (pitch * Math.PI) / 180;

      // --- 4. HOLOGRAPHIC ORBITAL RINGS ---
      ctx.save();
      ctx.rotate(time * 0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 190, 190, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(123, 63, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 12]);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, 220, 220, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([20, 40]);
      ctx.stroke();
      ctx.restore();

      // Shadow Floor
      const shadowGrad = ctx.createRadialGradient(0, 175, 10, 0, 175, 230);
      shadowGrad.addColorStop(0, "rgba(123, 63, 255, 0.3)");
      shadowGrad.addColorStop(0.5, "rgba(255, 59, 0, 0.18)");
      shadowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 175, 220, 50, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- 5. HELMET BODY RENDERING ---
      ctx.save();
      ctx.rotate(radPitch * 0.35);

      // Matte Shell Path
      ctx.beginPath();
      ctx.moveTo(-125 * Math.cos(radYaw), -135);
      ctx.bezierCurveTo(
        -165 * Math.cos(radYaw - 0.2),
        -65,
        -155 * Math.cos(radYaw),
        85,
        -85 * Math.cos(radYaw),
        135,
      );
      ctx.bezierCurveTo(0, 155, 85 * Math.cos(radYaw), 135, 155 * Math.cos(radYaw), 85);
      ctx.bezierCurveTo(165 * Math.cos(radYaw + 0.2), -65, 125 * Math.cos(radYaw), -135, 0, -155);
      ctx.closePath();

      const shellGrad = ctx.createLinearGradient(-120, -120, 120, 120);
      shellGrad.addColorStop(0, "#ffffff");
      shellGrad.addColorStop(0.35, "#cbd5e1");
      shellGrad.addColorStop(0.75, "#475569");
      shellGrad.addColorStop(1, "#090714");

      ctx.fillStyle = shellGrad;
      ctx.globalAlpha = 0.5 + p * 0.15;
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Jaw Vents
      ctx.beginPath();
      ctx.moveTo(-75 * Math.cos(radYaw), 65);
      ctx.lineTo(-45 * Math.cos(radYaw), 125);
      ctx.lineTo(45 * Math.cos(radYaw), 125);
      ctx.lineTo(75 * Math.cos(radYaw), 65);
      ctx.closePath();
      ctx.fillStyle = "#05030a";
      ctx.globalAlpha = 0.8;
      ctx.fill();

      // --- VISOR GLASS ---
      ctx.beginPath();
      ctx.moveTo(-115 * Math.cos(radYaw), -42);
      ctx.bezierCurveTo(
        -105 * Math.cos(radYaw),
        -85,
        105 * Math.cos(radYaw),
        -85,
        115 * Math.cos(radYaw),
        -42,
      );
      ctx.bezierCurveTo(
        125 * Math.cos(radYaw),
        22,
        -125 * Math.cos(radYaw),
        22,
        -115 * Math.cos(radYaw),
        -42,
      );
      ctx.closePath();

      const visorGrad = ctx.createLinearGradient(0, -65, 0, 35);
      visorGrad.addColorStop(0, "rgba(10, 8, 25, 0.98)");
      visorGrad.addColorStop(0.5, "rgba(40, 20, 85, 0.92)");
      visorGrad.addColorStop(1, "rgba(5, 3, 12, 0.98)");

      ctx.fillStyle = visorGrad;
      ctx.globalAlpha = 0.92;
      ctx.fill();

      // --- ICONIC VIRAL NEON ORANGE/RED LIGHTING STRIP ---
      ctx.save();
      ctx.shadowColor = "#ff3b00";
      ctx.shadowBlur = 30 + Math.sin(time * 3.5) * 8;

      ctx.beginPath();
      // Visor Top Light Strip
      ctx.moveTo(-110 * Math.cos(radYaw), -38);
      ctx.bezierCurveTo(
        -85 * Math.cos(radYaw),
        -68,
        85 * Math.cos(radYaw),
        -68,
        110 * Math.cos(radYaw),
        -38,
      );

      // Chin Bottom Light Strip
      ctx.moveTo(-135 * Math.cos(radYaw), 32);
      ctx.bezierCurveTo(
        -85 * Math.cos(radYaw),
        88,
        85 * Math.cos(radYaw),
        88,
        135 * Math.cos(radYaw),
        32,
      );

      ctx.strokeStyle = "#ff3b00";
      ctx.lineWidth = 5.5;
      ctx.lineCap = "round";
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      // Hot White Core
      ctx.strokeStyle = "#fffaf0";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // Glowing Vertices (Corner lens flares)
      const flarePoints = [
        { x: -110 * Math.cos(radYaw), y: -38 },
        { x: 110 * Math.cos(radYaw), y: -38 },
        { x: -135 * Math.cos(radYaw), y: 32 },
        { x: 135 * Math.cos(radYaw), y: 32 },
      ];

      flarePoints.forEach((fp) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ff3b00";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.restore();
      });

      // Hinge Pivot Disc
      ctx.save();
      const discX = -130 * Math.cos(radYaw);
      const discY = -12;
      ctx.beginPath();
      ctx.arc(discX, discY, 17, 0, Math.PI * 2);
      ctx.fillStyle = "#334155";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(discX, discY, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.restore();

      ctx.restore();
      ctx.restore();

      // --- 6. VIRAL CYBER HUD & METRICS OVERLAY ---
      ctx.save();
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(168, 85, 247, 0.7)";

      if (w > 768) {
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 6;

        ctx.fillText(`⚡ HELMET_SCROLL: ${(p * 100).toFixed(0)}%`, 35, h - 50);
        ctx.fillText(`📐 YAW_ROTATION: ${yaw.toFixed(1)}°`, 35, h - 32);
        ctx.fillText(`🔥 NEON_CORE: ONLINE [ACTIVE]`, 35, h - 14);

        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
        ctx.shadowColor = "#38bdf8";
        ctx.fillText(`SYS: CYBER_SUITE_M1`, w - 35, h - 32);
        ctx.fillText(`FPS: 60 // PARALLAX_SYNC`, w - 35, h - 14);
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [scrollProgress]);

  const canvasOpacity = Math.max(0.08, 0.35 - scrollProgress * 0.8);

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity: canvasOpacity }}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen transition-opacity duration-300"
    />
  );
};
