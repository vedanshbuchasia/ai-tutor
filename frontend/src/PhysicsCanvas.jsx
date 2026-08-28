import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Sliders, Activity } from 'lucide-react';

export default function PhysicsCanvas({ velocity = 25, angle = 45, gravity = 9.8 }) {
  const canvasRef = useRef(null);
  const [v0, setV0] = useState(velocity);
  const [theta, setTheta] = useState(angle);
  const [isRunning, setIsRunning] = useState(true);
  const [simTime, setSimTime] = useState(0);

  // Sync props when tutor updates state
  useEffect(() => {
    setV0(velocity);
    setTheta(angle);
    setSimTime(0);
    setIsRunning(true);
  }, [velocity, angle, gravity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let t = simTime;

    const rad = (theta * Math.PI) / 180;
    const vx0 = v0 * Math.cos(rad);
    const vy0 = v0 * Math.sin(rad);
    const totalFlightTime = (2 * vy0) / gravity;
    const maxHeight = (vy0 * vy0) / (2 * gravity);
    const totalRange = (v0 * v0 * Math.sin(2 * rad)) / gravity;

    const scale = 5.5; // pixels per meter
    const originX = 50;
    const originY = canvas.height - 40;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Blackboard Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Ground Line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(canvas.width, originY);
      ctx.stroke();

      // 2. Full Theoretical Parabolic Arc (Dashed)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let stepT = 0; stepT <= totalFlightTime; stepT += 0.05) {
        const px = originX + (vx0 * stepT) * scale;
        const py = originY - (vy0 * stepT - 0.5 * gravity * stepT * stepT) * scale;
        if (stepT === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Animated Path Traced so far
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const currentT = Math.min(t, totalFlightTime);
      for (let stepT = 0; stepT <= currentT; stepT += 0.02) {
        const px = originX + (vx0 * stepT) * scale;
        const py = originY - (vy0 * stepT - 0.5 * gravity * stepT * stepT) * scale;
        if (stepT === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 4. Current Projectile Particle Position
      const currentX = originX + (vx0 * currentT) * scale;
      const currentY = originY - (vy0 * currentT - 0.5 * gravity * currentT * currentT) * scale;
      const currentVx = vx0;
      const currentVy = vy0 - gravity * currentT;

      // Glow effect for projectile
      const gradient = ctx.createRadialGradient(currentX, currentY, 2, currentX, currentY, 12);
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Velocity Vectors
      const vScale = 1.8;
      // Horizontal vx (Constant Cyan)
      drawArrow(ctx, currentX, currentY, currentX + currentVx * vScale, currentY, '#06b6d4', 'vx');
      // Vertical vy (Changing Emerald/Gold)
      drawArrow(ctx, currentX, currentY, currentX, currentY - currentVy * vScale, '#10b981', 'vy');
      // Resultant v vector
      drawArrow(ctx, currentX, currentY, currentX + currentVx * vScale, currentY - currentVy * vScale, '#f59e0b', 'v');

      // 6. Max Height Marker
      const apexX = originX + (vx0 * (totalFlightTime / 2)) * scale;
      const apexY = originY - maxHeight * scale;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(apexX, apexY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '11px sans-serif';
      ctx.fillText(`H_max: ${maxHeight.toFixed(1)}m`, apexX - 25, apexY - 8);

      // Increment simulation time
      if (isRunning) {
        t += 0.025;
        if (t > totalFlightTime + 0.5) {
          t = 0; // Loop seamlessly
        }
        setSimTime(t);
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [v0, theta, gravity, isRunning]);

  const drawArrow = (ctx, fromX, fromY, toX, toY, color, label) => {
    const headlen = 6;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.font = '10px monospace';
    ctx.fillText(label, toX + 4, toY - 4);
  };

  return (
    <div className="physics-canvas-card">
      <div className="canvas-header">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-cyan" />
          <span>Real-time Kinematics Trajectory & Vector Simulation</span>
        </div>
        <div className="sim-stats">
          <span>v₀: {v0} m/s</span>
          <span>θ: {theta}°</span>
          <span>g: {gravity} m/s²</span>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={680} height={260} className="physics-canvas" />
      </div>

      <div className="canvas-controls">
        <div className="control-slider">
          <label>Launch Speed (v₀): {v0} m/s</label>
          <input 
            type="range" min="10" max="50" value={v0} 
            onChange={(e) => setV0(Number(e.target.value))} 
          />
        </div>
        <div className="control-slider">
          <label>Launch Angle (θ): {theta}°</label>
          <input 
            type="range" min="15" max="85" value={theta} 
            onChange={(e) => setTheta(Number(e.target.value))} 
          />
        </div>
        <button 
          className="btn-sim-toggle" 
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}
