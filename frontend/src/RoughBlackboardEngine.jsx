import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

export default function RoughBlackboardEngine({
  timelineScript,
  isSpeaking,
  onReplay
}) {
  const canvasRef = useRef(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mathSvgs, setMathSvgs] = useState([]);
  const [liveTelemetry, setLiveTelemetry] = useState({ t: 0, vx: 0, vy: 0 });

  const actionsRef = useRef(timelineScript?.board_actions || []);
  const startTimeRef = useRef(Date.now());
  const animFrameRef = useRef(null);

  useEffect(() => {
    actionsRef.current = timelineScript?.board_actions || [];
    setElapsedMs(0);
    setMathSvgs([]);
    startTimeRef.current = Date.now();
    setIsPlaying(true);
  }, [timelineScript]);

  // Main 60fps Event Scheduler & Rough.js Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rc = rough.canvas(canvas);

    const originX = 175;
    const originY = 245;
    const scale = 5.2;

    const render = () => {
      const now = Date.now();
      const currentElapsed = isPlaying ? now - startTimeRef.current : elapsedMs;
      setElapsedMs(currentElapsed);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Slate Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Execute Timeline Script Actions
      const actions = actionsRef.current;

      // 1. Pillar C: Rough.js Hand-drawn Coordinate Axes (0ms)
      const axesAction = actions.find(a => a.action === 'draw_axes');
      if (axesAction && currentElapsed >= axesAction.timestamp_ms) {
        // Hand-drawn X-Axis (Ground)
        rc.line(originX - 10, originY, canvas.width - 25, originY, {
          stroke: '#64748b',
          strokeWidth: 2,
          roughness: 1.4,
          bowing: 1.2
        });
        // Hand-drawn Y-Axis (Vertical)
        rc.line(originX, originY + 10, originX, 40, {
          stroke: '#64748b',
          strokeWidth: 2,
          roughness: 1.4,
          bowing: 1.2
        });

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(axesAction.params?.y_label || "Y (Height, ay = -g)", originX + 10, 50);
        ctx.fillText(axesAction.params?.x_label || "X (Range, ax = 0)", canvas.width - 150, originY - 10);
      }

      // 2. Pillar B: Dynamic Parabolic Curve & Vector Tracing (1200ms)
      const curveAction = actions.find(a => a.action === 'trace_curve');
      if (curveAction && currentElapsed >= curveAction.timestamp_ms) {
        const v0 = curveAction.params?.v0 || 25;
        const theta = curveAction.params?.angle || 45;
        const g = curveAction.params?.gravity || 9.8;
        const rad = (theta * Math.PI) / 180;
        const vx0 = v0 * Math.cos(rad);
        const vy0 = v0 * Math.sin(rad);
        const totalT = (2 * vy0) / g;
        const duration = curveAction.params?.duration_ms || 3000;

        const progress = Math.min(1, (currentElapsed - curveAction.timestamp_ms) / duration);
        const curT = progress * totalT;

        // Traced Parabolic Path with Rough.js aesthetics
        const pathPoints = [];
        for (let st = 0; st <= curT; st += 0.04) {
          const px = originX + (vx0 * st) * scale;
          const py = originY - (vy0 * st - 0.5 * g * st * st) * scale;
          pathPoints.push([px, py]);
        }

        if (pathPoints.length > 1) {
          rc.curve(pathPoints, {
            stroke: '#38bdf8',
            strokeWidth: 3.2,
            roughness: 0.8
          });
        }

        // Particle Core
        const curX = originX + (vx0 * curT) * scale;
        const curY = originY - (vy0 * curT - 0.5 * g * curT * curT) * scale;
        const curVy = vy0 - g * curT;

        rc.circle(curX, curY, 10, {
          fill: '#ffffff',
          fillStyle: 'solid',
          stroke: '#38bdf8',
          strokeWidth: 2
        });

        // 3. Live Hand-drawn Vectors (vx constant, vy changing, resultant v)
        drawRoughVector(rc, curX, curY, curX + vx0 * 1.5, curY, '#38bdf8', `vx: ${vx0.toFixed(1)}`);
        drawRoughVector(rc, curX, curY, curX, curY - curVy * 1.5, '#34d399', `vy: ${curVy.toFixed(1)}`);
        drawRoughVector(rc, curX, curY, curX + vx0 * 1.5, curY - curVy * 1.5, '#fbbf24', 'v');

        setLiveTelemetry({ t: curT.toFixed(2), vx: vx0.toFixed(1), vy: curVy.toFixed(1) });
      }

      // 4. Downward Gravity Acceleration Vector (-g at apex)
      const vectorAction = actions.find(a => a.action === 'draw_vector');
      if (vectorAction && currentElapsed >= vectorAction.timestamp_ms) {
        const apexX = originX + 140;
        const apexY = originY - 110;
        drawRoughVector(rc, apexX, apexY, apexX, apexY + 45, '#f43f5e', 'ay = -g (Gravity)', 2.5);
      }

      // 5. Pillar A: Stroke-by-Stroke Math Writing Actions (2800ms)
      const mathActions = actions.filter(a => a.action === 'write_equation' && currentElapsed >= a.timestamp_ms);
      setMathSvgs(mathActions);

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, timelineScript]);

  const drawRoughVector = (rc, x1, y1, x2, y2, color, label, strokeWidth = 2.2) => {
    rc.line(x1, y1, x2, y2, {
      stroke: color,
      strokeWidth: strokeWidth,
      roughness: 1.2
    });

    const headlen = 7;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    rc.line(x2, y2, x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6), {
      stroke: color,
      strokeWidth: strokeWidth,
      roughness: 1.2
    });
    rc.line(x2, y2, x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6), {
      stroke: color,
      strokeWidth: strokeWidth,
      roughness: 1.2
    });
  };

  const handleRestart = () => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    setIsPlaying(true);
    if (onReplay) onReplay();
  };

  return (
    <div className="rough-blackboard-container">
      {/* Blackboard Top Bar */}
      <div className="rough-board-header">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          <span className="rough-board-title">Rough.js Hand-Drawn Animated Blackboard</span>
        </div>

        <div className="rough-board-controls">
          <span className="timeline-badge">⏱️ {(elapsedMs / 1000).toFixed(1)}s</span>
          <button 
            className="btn-replay"
            onClick={handleRestart}
            title="Replay Lesson Animation"
          >
            <RotateCcw size={13} /> Replay
          </button>
        </div>
      </div>

      {/* Blackboard Canvas Stage with Stroke-by-Stroke SVG Overlay */}
      <div className="rough-canvas-stage">
        <canvas ref={canvasRef} width={760} height={270} className="rough-main-canvas" />

        {/* Pillar A: SVG Stroke-by-Stroke Math Equations */}
        <div className="svg-math-writing-layer">
          {mathSvgs.map((eq, i) => (
            <div 
              key={i} 
              className="svg-math-box animated-chalk-stroke"
              style={{
                top: `${eq.params?.position?.y || 16 + i * 36}px`,
                left: `${eq.params?.position?.x || 190}px`
              }}
            >
              <span className="chalk-math-text">{eq.params?.latex || "v_y = u_y - gt"}</span>
            </div>
          ))}
        </div>

        {/* Telemetry Bar */}
        <div className="rough-telemetry-pill">
          <span>t: {liveTelemetry.t}s</span>
          <span>vx: {liveTelemetry.vx} m/s [const]</span>
          <span>vy: {liveTelemetry.vy} m/s</span>
        </div>
      </div>
    </div>
  );
}
