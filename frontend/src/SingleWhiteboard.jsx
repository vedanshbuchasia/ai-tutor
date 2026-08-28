import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Activity, 
  Layers, 
  RotateCcw, 
  Play, 
  Pause, 
  Maximize2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function SingleWhiteboard({ 
  mathLatex, 
  velocity = 25, 
  angle = 45, 
  gravity = 9.8,
  frameToDisplay,
  apiBase,
  annotationText
}) {
  const canvasRef = useRef(null);
  const mathRef = useRef(null);

  const [v0, setV0] = useState(velocity);
  const [theta, setTheta] = useState(angle);
  const [isRunning, setIsRunning] = useState(true);
  const [simTime, setSimTime] = useState(0);
  const [showKeyframeOverlay, setShowKeyframeOverlay] = useState(false);
  const [liveStats, setLiveStats] = useState({ vx: 0, vy: 0, x: 0, y: 0 });

  // Sync with backend whiteboard actions
  useEffect(() => {
    setV0(velocity);
    setTheta(angle);
    setSimTime(0);
    setIsRunning(true);
  }, [velocity, angle, gravity]);

  // Render KaTeX Math
  useEffect(() => {
    if (mathRef.current && mathLatex) {
      try {
        katex.render(mathLatex, mathRef.current, {
          displayMode: true,
          throwOnError: false
        });
      } catch (err) {
        console.error("KaTeX render error:", err);
      }
    }
  }, [mathLatex]);

  // Unified Physics Animation Loop
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

    const scale = 5.6; // pixels per meter
    const originX = 55;
    const originY = canvas.height - 40;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Whiteboard Grid Lines
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

      // Ground Line
      ctx.strokeStyle = '#3b4252';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(canvas.width, originY);
      ctx.stroke();

      // 2. Parabolic Trajectory Outline
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

      // 3. Traced Solid Parabolic Path
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const curT = Math.min(t, flightTime);
      for (let stepT = 0; stepT <= curT; stepT += 0.02) {
        const px = originX + (vx0 * stepT) * scale;
        const py = originY - (vy0 * stepT - 0.5 * gravity * stepT * stepT) * scale;
        if (stepT === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 4. Current Particle
      const posX = originX + (vx0 * curT) * scale;
      const posY = originY - (vy0 * curT - 0.5 * gravity * curT * curT) * scale;
      const curVx = vx0;
      const curVy = vy0 - gravity * curT;

      // Glow halo
      const glow = ctx.createRadialGradient(posX, posY, 2, posX, posY, 12);
      glow.addColorStop(0, '#38bdf8');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(posX, posY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Solid Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(posX, posY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Velocity Vector Arrows (vx, vy, v)
      const vScale = 1.7;
      drawArrow(ctx, posX, posY, posX + curVx * vScale, posY, '#06b6d4', 'vx');
      drawArrow(ctx, posX, posY, posX, posY - curVy * vScale, '#10b981', 'vy');
      drawArrow(ctx, posX, posY, posX + curVx * vScale, posY - curVy * vScale, '#f59e0b', 'v');

      // 6. Max Height Marker
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
      ctx.fillText(`Range: ${totalRange.toFixed(1)}m`, landX - 25, originY + 16);

      setLiveStats({
        vx: curVx.toFixed(1),
        vy: curVy.toFixed(1),
        x: ((posX - originX) / scale).toFixed(1),
        y: Math.max(0, (originY - posY) / scale).toFixed(1)
      });

      if (isRunning) {
        t += 0.025;
        if (t > flightTime + 0.5) {
          t = 0;
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
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.2;

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

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(label, toX + 4, toY - 4);
  };

  return (
    <div className="single-whiteboard-container">
      {/* Top Whiteboard Header */}
      <div className="whiteboard-header">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-cyan" />
          <span className="board-title">Personal Physics Whiteboard</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className={`btn-keyframe-toggle ${showKeyframeOverlay ? 'active' : ''}`}
            onClick={() => setShowKeyframeOverlay(!showKeyframeOverlay)}
          >
            <ImageIcon size={14} /> Lecture Reference ({frameToDisplay})
          </button>
          <span className="live-pill">
            <span className="live-dot"></span> Active Grounding
          </span>
        </div>
      </div>

      {/* Main Whiteboard Surface */}
      <div className="whiteboard-surface">
        
        {/* Section 1: Mathematical Formula Display */}
        <div className="board-math-card">
          <div className="math-label">Active Mathematical Derivation</div>
          <div ref={mathRef} className="board-katex-area"></div>
        </div>

        {/* Section 2: Animated Physics Trajectory Canvas */}
        <div className="canvas-wrapper-card">
          <div className="canvas-telemetry-header">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-cyan" />
              <span>Real-Time Trajectory & Vector Dynamics</span>
            </div>
            <div className="telemetry-values">
              <span>(x: {liveStats.x}m, y: {liveStats.y}m)</span>
              <span>vx: {liveStats.vx} m/s</span>
              <span>vy: {liveStats.vy} m/s</span>
            </div>
          </div>

          <canvas ref={canvasRef} width={740} height={250} className="unified-canvas" />

          {/* Interactive Sliders */}
          <div className="board-controls-row">
            <div className="slider-item">
              <label>Launch Speed (v₀): <span className="chalk-cyan">{v0} m/s</span></label>
              <input 
                type="range" min="10" max="50" value={v0} 
                onChange={(e) => setV0(Number(e.target.value))} 
              />
            </div>
            <div className="slider-item">
              <label>Launch Angle (θ): <span className="chalk-gold">{theta}°</span></label>
              <input 
                type="range" min="15" max="85" value={theta} 
                onChange={(e) => setTheta(Number(e.target.value))} 
              />
            </div>
            <button 
              className="btn-pause-toggle"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause size={14}/> : <Play size={14}/>} {isRunning ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        {/* Section 3: Grounded Lecture Keyframe Overlay (when toggled) */}
        {showKeyframeOverlay && (
          <div className="keyframe-overlay-panel">
            <div className="overlay-header">
              <span>Grounded Lecture Reference Video Frame: {frameToDisplay}</span>
              <button onClick={() => setShowKeyframeOverlay(false)} className="btn-close-overlay">✕</button>
            </div>
            <img 
              src={`${apiBase}/frames/${frameToDisplay}`} 
              alt="Lecture Keyframe" 
              className="keyframe-overlay-img"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80";
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
