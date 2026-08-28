import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Sliders, 
  TrendingUp, 
  Wind,
  Layers,
  Sparkles
} from 'lucide-react';

export default function ManimStyleWhiteboard({
  mathLatex,
  velocity = 25,
  angle = 45,
  gravity = 9.8,
  animationMode = "TRAJECTORY", // "TRAJECTORY" | "VECTOR_DECOMPOSITION" | "VELOCITY_GRAPH" | "DRAG_COMPARISON"
  annotationText = ""
}) {
  const canvasRef = useRef(null);
  const mathRef = useRef(null);

  const [mode, setMode] = useState(animationMode);
  const [v0, setV0] = useState(velocity);
  const [theta, setTheta] = useState(angle);
  const [isRunning, setIsRunning] = useState(true);
  const [simTime, setSimTime] = useState(0);

  useEffect(() => {
    setV0(velocity);
    setTheta(angle);
    setSimTime(0);
    setIsRunning(true);
  }, [velocity, angle, gravity]);

  useEffect(() => {
    if (animationMode) setMode(animationMode);
  }, [animationMode]);

  // Render KaTeX Math
  useEffect(() => {
    if (mathRef.current && mathLatex) {
      try {
        katex.render(mathLatex, mathRef.current, {
          displayMode: true,
          throwOnError: false
        });
      } catch (err) {
        console.error("KaTeX error:", err);
      }
    }
  }, [mathLatex]);

  // Main 60fps Programmatic Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let t = simTime;

    const rad = (theta * Math.PI) / 180;
    const vx0 = v0 * Math.cos(rad);
    const vy0 = v0 * Math.sin(rad);
    const flightTime = (2 * vy0) / gravity;
    const maxHeight = (vy0 * vy0) / (2 * gravity);
    const totalRange = (v0 * v0 * Math.sin(2 * rad)) / gravity;

    const scale = 5.8;
    const originX = 60;
    const originY = canvas.height - 45;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Blueprint Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
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

      // Ground Axis
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(canvas.width, originY);
      ctx.stroke();

      // ==========================================
      // ANIMATION MODE 1: VECTOR DECOMPOSITION
      // ==========================================
      if (mode === "VECTOR_DECOMPOSITION") {
        const vLen = v0 * 3.8;
        const targetX = originX + vLen * Math.cos(rad);
        const targetY = originY - vLen * Math.sin(rad);

        // Angle Arc
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(originX, originY, 40, -rad, 0, false);
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText(`θ = ${theta}°`, originX + 46, originY - 14);

        // Dashed Projection Right Triangle
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(targetX, originY);
        ctx.lineTo(targetX, targetY);
        ctx.lineTo(originX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Horizontal Component (vx)
        drawArrow(ctx, originX, originY, targetX, originY, '#38bdf8', `vx = u·cos(${theta}°) = ${vx0.toFixed(1)} m/s`, 3);

        // Vertical Component (vy)
        drawArrow(ctx, originX, originY, originX, targetY, '#34d399', `vy = u·sin(${theta}°) = ${vy0.toFixed(1)} m/s`, 3);

        // Resultant Vector (u)
        drawArrow(ctx, originX, originY, targetX, targetY, '#f59e0b', `Initial Velocity u = ${v0} m/s`, 4);

        // Pulsing Origin Circle
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(originX, originY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ==========================================
      // ANIMATION MODE 2: TRAJECTORY & VECTOR DYNAMICS
      // ==========================================
      else if (mode === "TRAJECTORY") {
        // Full Theoretical Parabola (Dashed)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let stepT = 0; stepT <= flightTime; stepT += 0.04) {
          const px = originX + (vx0 * stepT) * scale;
          const py = originY - (vy0 * stepT - 0.5 * gravity * stepT * stepT) * scale;
          if (stepT === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Traced Parabolic Arc
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        const curT = Math.min(t, flightTime);
        for (let stepT = 0; stepT <= curT; stepT += 0.02) {
          const px = originX + (vx0 * stepT) * scale;
          const py = originY - (vy0 * stepT - 0.5 * gravity * stepT * stepT) * scale;
          if (stepT === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Projectile Particle
        const posX = originX + (vx0 * curT) * scale;
        const posY = originY - (vy0 * curT - 0.5 * gravity * curT * curT) * scale;
        const curVx = vx0;
        const curVy = vy0 - gravity * curT;

        // Glow
        const glow = ctx.createRadialGradient(posX, posY, 2, posX, posY, 14);
        glow.addColorStop(0, '#38bdf8');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(posX, posY, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(posX, posY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Live Vector Arrows
        const vScale = 1.7;
        drawArrow(ctx, posX, posY, posX + curVx * vScale, posY, '#06b6d4', `vx: ${curVx.toFixed(1)}`);
        drawArrow(ctx, posX, posY, posX, posY - curVy * vScale, '#10b981', `vy: ${curVy.toFixed(1)}`);
        drawArrow(ctx, posX, posY, posX + curVx * vScale, posY - curVy * vScale, '#f59e0b', 'v');

        // Apex Marker
        const apexX = originX + (vx0 * (flightTime / 2)) * scale;
        const apexY = originY - maxHeight * scale;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(apexX, apexY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(`H_max: ${maxHeight.toFixed(1)}m`, apexX - 25, apexY - 8);

        // Range Marker
        const landX = originX + totalRange * scale;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(landX, originY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`Range: ${totalRange.toFixed(1)}m`, landX - 25, originY + 18);
      }

      // ==========================================
      // ANIMATION MODE 3: VELOCITY GRAPH vy(t)
      // ==========================================
      else if (mode === "VELOCITY_GRAPH") {
        const graphOriginY = canvas.height / 2;
        
        // Zero Velocity Axis
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(originX, graphOriginY);
        ctx.lineTo(canvas.width - 40, graphOriginY);
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText("vy = 0 m/s (Apex Peak)", originX + 220, graphOriginY - 8);

        // Plot vy(t) line: vy(t) = vy0 - g*t
        const gScaleX = 75; // px per sec
        const gScaleY = 3.5; // px per m/s

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let stepT = 0; stepT <= flightTime; stepT += 0.05) {
          const gx = originX + stepT * gScaleX;
          const gy = graphOriginY - (vy0 - gravity * stepT) * gScaleY;
          if (stepT === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
        ctx.stroke();

        // Current animated time pointer
        const curT = Math.min(t, flightTime);
        const curX = originX + curT * gScaleX;
        const curVy = vy0 - gravity * curT;
        const curY = graphOriginY - curVy * gScaleY;

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`t=${curT.toFixed(2)}s, vy=${curVy.toFixed(1)}m/s`, curX + 10, curY - 10);
      }

      // ==========================================
      // ANIMATION MODE 4: AIR DRAG COMPARISON
      // ==========================================
      else if (mode === "DRAG_COMPARISON") {
        // Ideal Vacuum Parabola (Cyan)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let stepT = 0; stepT <= flightTime; stepT += 0.04) {
          const px = originX + (vx0 * stepT) * scale;
          const py = originY - (vy0 * stepT - 0.5 * gravity * stepT * stepT) * scale;
          if (stepT === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText("Ideal Vacuum (No Drag)", originX + totalRange * scale - 120, originY - 40);

        // Realistic Air Drag Trajectory (Asymmetric Rose Parabola)
        const dragFactor = 0.035;
        const dragFlightTime = flightTime * 0.88;
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let stepT = 0; stepT <= dragFlightTime; stepT += 0.04) {
          const px = originX + (vx0 * stepT * (1 - dragFactor * stepT)) * scale;
          const py = originY - (vy0 * stepT - 0.5 * (gravity + 1.2) * stepT * stepT) * scale;
          if (stepT === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.fillStyle = '#fb7185';
        ctx.fillText("With Aerodynamic Drag F_drag", originX + 80, originY - 140);
      }

      if (isRunning) {
        t += 0.025;
        if (t > flightTime + 0.6) {
          t = 0;
        }
        setSimTime(t);
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [v0, theta, gravity, isRunning, mode]);

  const drawArrow = (ctx, fromX, fromY, toX, toY, color, label, strokeW = 2.5) => {
    const headlen = 7;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeW;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(ang - Math.PI / 6), toY - headlen * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(ang + Math.PI / 6), toY - headlen * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(label, toX + 6, toY - 4);
  };

  return (
    <div className="manim-whiteboard-container">
      {/* Top Header */}
      <div className="whiteboard-top-nav">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-cyan" />
          <span className="whiteboard-title">Interactive Animation Whiteboard</span>
        </div>

        {/* Animation Mode Selector Buttons */}
        <div className="animation-mode-pills">
          <button 
            className={`mode-btn ${mode === 'VECTOR_DECOMPOSITION' ? 'active' : ''}`}
            onClick={() => setMode('VECTOR_DECOMPOSITION')}
          >
            <Zap size={13} /> Vector Decomposition
          </button>
          <button 
            className={`mode-btn ${mode === 'TRAJECTORY' ? 'active' : ''}`}
            onClick={() => setMode('TRAJECTORY')}
          >
            <Sparkles size={13} /> Trajectory Dynamics
          </button>
          <button 
            className={`mode-btn ${mode === 'VELOCITY_GRAPH' ? 'active' : ''}`}
            onClick={() => setMode('VELOCITY_GRAPH')}
          >
            <TrendingUp size={13} /> Velocity Graph vy(t)
          </button>
          <button 
            className={`mode-btn ${mode === 'DRAG_COMPARISON' ? 'active' : ''}`}
            onClick={() => setMode('DRAG_COMPARISON')}
          >
            <Wind size={13} /> Air Drag Physics
          </button>
        </div>
      </div>

      {/* Main Canvas & KaTeX Body */}
      <div className="whiteboard-main-body">
        
        {/* Dynamic KaTeX Formulation Box */}
        <div className="math-formulation-card">
          <div className="formulation-label">Active Physics Derivation</div>
          <div ref={mathRef} className="katex-dynamic-render"></div>
        </div>

        {/* 60fps Physics Animation Canvas */}
        <div className="animation-canvas-card">
          <canvas ref={canvasRef} width={740} height={260} className="manim-canvas" />

          {/* Interactive Sliders & Pause Controls */}
          <div className="canvas-slider-bar">
            <div className="slider-box">
              <label>Launch Speed (v₀): <span className="chalk-cyan">{v0} m/s</span></label>
              <input 
                type="range" min="10" max="50" value={v0} 
                onChange={(e) => setV0(Number(e.target.value))} 
              />
            </div>
            <div className="slider-box">
              <label>Launch Angle (θ): <span className="chalk-gold">{theta}°</span></label>
              <input 
                type="range" min="15" max="85" value={theta} 
                onChange={(e) => setTheta(Number(e.target.value))} 
              />
            </div>
            <button 
              className="btn-pause-animation"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />} {isRunning ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
