import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Activity, 
  Layers, 
  Wind, 
  Globe, 
  Zap, 
  Maximize2, 
  RotateCcw, 
  Play, 
  Pause,
  Image as ImageIcon,
  Sparkles,
  BookOpen
} from 'lucide-react';

const GRAVITY_PRESETS = [
  { name: 'Earth', g: 9.8, icon: '🌍' },
  { name: 'Moon', g: 1.62, icon: '🌑' },
  { name: 'Mars', g: 3.72, icon: '🪐' },
  { name: 'Jupiter', g: 24.79, icon: '⭐' }
];

export default function ClassroomBlackboard({ 
  activeTab, 
  setActiveTab, 
  mathLatex, 
  frameToDisplay, 
  apiBase,
  lectureTopic,
  derivationSteps = []
}) {
  const canvasRef = useRef(null);
  const mathRef = useRef(null);

  // Simulation State
  const [velocity, setVelocity] = useState(28);
  const [angle, setAngle] = useState(45);
  const [gravity, setGravity] = useState(9.8);
  const [planet, setPlanet] = useState('Earth');
  const [wind, setWind] = useState(0); // -10 to +10 m/s
  const [airDrag, setAirDrag] = useState(false);
  const [compareAngle, setCompareAngle] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [simTime, setSimTime] = useState(0);
  const [liveStats, setLiveStats] = useState({ vx: 0, vy: 0, x: 0, y: 0, ke: 0, pe: 0 });

  // Render KaTeX Chalk Equations
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

  // Main Interactive Physics Laboratory Engine (HTML5 Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'lab') return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let t = simTime;

    const rad1 = (angle * Math.PI) / 180;
    const vx0_1 = velocity * Math.cos(rad1);
    const vy0_1 = velocity * Math.sin(rad1);

    // Complementary angle (for dual projectile demonstration)
    const compAngle = 90 - angle;
    const rad2 = (compAngle * Math.PI) / 180;
    const vx0_2 = velocity * Math.cos(rad2);
    const vy0_2 = velocity * Math.sin(rad2);

    const flightTime1 = (2 * vy0_1) / gravity;
    const maxHeight1 = (vy0_1 * vy0_1) / (2 * gravity);
    const range1 = (velocity * velocity * Math.sin(2 * rad1)) / gravity;

    const scale = 5.2; // pixels per meter
    const originX = 60;
    const originY = canvas.height - 45;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Authentic Slate Chalk Grid
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

      // Chalk Ground Line & Coordinate Axes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(canvas.width, originY);
      ctx.stroke();

      // Chalk Y-Axis
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(originX, 10);
      ctx.lineTo(originX, originY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Trajectory Arc 1 (Main Parabola)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let stepT = 0; stepT <= flightTime1; stepT += 0.04) {
        const px = originX + (vx0_1 * stepT + 0.5 * (wind * 0.1) * stepT * stepT) * scale;
        const py = originY - (vy0_1 * stepT - 0.5 * gravity * stepT * stepT) * scale;
        if (stepT === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Optional Dual Complementary Trajectory Arc
      if (compareAngle) {
        const flightTime2 = (2 * vy0_2) / gravity;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let stepT = 0; stepT <= flightTime2; stepT += 0.04) {
          const px = originX + (vx0_2 * stepT) * scale;
          const py = originY - (vy0_2 * stepT - 0.5 * gravity * stepT * stepT) * scale;
          if (stepT === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Trace Active Trajectory Path
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      const curT = Math.min(t, flightTime1);
      for (let stepT = 0; stepT <= curT; stepT += 0.02) {
        const px = originX + (vx0_1 * stepT + 0.5 * (wind * 0.1) * stepT * stepT) * scale;
        const py = originY - (vy0_1 * stepT - 0.5 * gravity * stepT * stepT) * scale;
        if (stepT === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 5. Active Projectile Particle
      const posX = originX + (vx0_1 * curT + 0.5 * (wind * 0.1) * curT * curT) * scale;
      const posY = originY - (vy0_1 * curT - 0.5 * gravity * curT * curT) * scale;
      const curVx = vx0_1 + (wind * 0.1) * curT;
      const curVy = vy0_1 - gravity * curT;

      // Glow halo
      const glow = ctx.createRadialGradient(posX, posY, 2, posX, posY, 14);
      glow.addColorStop(0, '#38bdf8');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(posX, posY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(posX, posY, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // 6. Draw Live Velocity Vector Arrows (vx, vy, v)
      const vScale = 1.6;
      drawArrow(ctx, posX, posY, posX + curVx * vScale, posY, '#06b6d4', `vx: ${curVx.toFixed(1)}`);
      drawArrow(ctx, posX, posY, posX, posY - curVy * vScale, '#10b981', `vy: ${curVy.toFixed(1)}`);
      drawArrow(ctx, posX, posY, posX + curVx * vScale, posY - curVy * vScale, '#f59e0b', 'v');

      // 7. Apex Marker & Labels
      const apexX = originX + (vx0_1 * (flightTime1 / 2)) * scale;
      const apexY = originY - maxHeight1 * scale;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(apexX, apexY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`H_max: ${maxHeight1.toFixed(1)}m`, apexX - 28, apexY - 8);

      // Range Marker
      const landX = originX + range1 * scale;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(landX, originY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`Range: ${range1.toFixed(1)}m`, landX - 25, originY + 18);

      // Update Live Telemetry Stats
      const mass = 2.0; // kg
      const currentSpeed = Math.sqrt(curVx * curVx + curVy * curVy);
      const currentH = Math.max(0, (originY - posY) / scale);
      setLiveStats({
        vx: curVx.toFixed(1),
        vy: curVy.toFixed(1),
        x: ((posX - originX) / scale).toFixed(1),
        y: currentH.toFixed(1),
        ke: (0.5 * mass * currentSpeed * currentSpeed).toFixed(1),
        pe: (mass * gravity * currentH).toFixed(1)
      });

      if (isRunning) {
        t += 0.025;
        if (t > flightTime1 + 0.6) {
          t = 0;
        }
        setSimTime(t);
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [velocity, angle, gravity, wind, compareAngle, isRunning, activeTab]);

  const drawArrow = (ctx, fromX, fromY, toX, toY, color, label) => {
    const headlen = 6;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

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
    <div className="classroom-blackboard-container">
      {/* Blackboard Wooden Header */}
      <div className="board-toolbar">
        <div className="board-tabs">
          <button 
            className={`board-tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
            onClick={() => setActiveTab('theory')}
          >
            <BookOpen size={15} /> Board A: Theory & Derivations
          </button>
          <button 
            className={`board-tab-btn ${activeTab === 'lab' ? 'active' : ''}`}
            onClick={() => setActiveTab('lab')}
          >
            <Activity size={15} /> Board B: Interactive Physics Sandbox
          </button>
          <button 
            className={`board-tab-btn ${activeTab === 'diagram' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagram')}
          >
            <ImageIcon size={15} /> Board C: Lecture Keyframe Reel
          </button>
        </div>

        <div className="board-topic-badge">
          <Sparkles size={14} className="text-gold" />
          <span>{lectureTopic || "2D Kinematics & Projectiles"}</span>
        </div>
      </div>

      {/* Main Slate Chalkboard Body */}
      <div className="slate-board">
        
        {/* Active Tab 1: Theory & Mathematical Derivations */}
        {activeTab === 'theory' && (
          <div className="theory-board-view">
            <div className="chalk-card">
              <div className="chalk-heading">Active Mathematical Formulation</div>
              <div ref={mathRef} className="chalk-katex-area"></div>
            </div>

            <div className="derivations-container">
              <div className="chalk-heading">Step-by-Step Physics Breakdown</div>
              <div className="derivation-grid">
                <div className="step-card">
                  <div className="step-badge">1. Horizontal Axis (ax = 0)</div>
                  <p className="chalk-handwritten">
                    No net horizontal force acts on the mass. Acceleration <span className="chalk-cyan">a_x = 0</span> implies velocity <span className="chalk-cyan">v_x = u·cos(θ)</span> remains completely constant.
                  </p>
                </div>
                <div className="step-card">
                  <div className="step-badge">2. Vertical Axis (ay = -g)</div>
                  <p className="chalk-handwritten">
                    Gravity exerts a constant downward force <span className="chalk-green">F_y = -mg</span>. Vertical velocity decelerates until <span className="chalk-gold">v_y = 0</span> at the apex height.
                  </p>
                </div>
                <div className="step-card">
                  <div className="step-badge">3. Parametric Trajectory Equation</div>
                  <p className="chalk-handwritten">
                    Eliminating time t yields the canonical parabola equation: <br/>
                    <span className="chalk-cyan">y(x) = x·tan(θ) - [g / (2u²·cos²θ)]·x²</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tab 2: Interactive Laboratory Simulator */}
        {activeTab === 'lab' && (
          <div className="lab-board-view">
            {/* Real-time Canvas */}
            <div className="canvas-frame">
              <canvas ref={canvasRef} width={760} height={270} className="physics-canvas" />
            </div>

            {/* Live Energy & Kinematics Telemetry Bar */}
            <div className="telemetry-bar">
              <div className="telem-item">
                <span className="telem-label">Position (x, y)</span>
                <span className="telem-val">({liveStats.x}m, {liveStats.y}m)</span>
              </div>
              <div className="telem-item">
                <span className="telem-label">Velocity (vx, vy)</span>
                <span className="telem-val">({liveStats.vx}, {liveStats.vy}) m/s</span>
              </div>
              <div className="telem-item">
                <span className="telem-label">Kinetic Energy</span>
                <div className="energy-meter">
                  <div className="meter-fill ke" style={{ width: `${Math.min(100, liveStats.ke / 8)}%` }}></div>
                </div>
                <span className="telem-val">{liveStats.ke} J</span>
              </div>
              <div className="telem-item">
                <span className="telem-label">Potential Energy</span>
                <div className="energy-meter">
                  <div className="meter-fill pe" style={{ width: `${Math.min(100, liveStats.pe / 8)}%` }}></div>
                </div>
                <span className="telem-val">{liveStats.pe} J</span>
              </div>
            </div>

            {/* Interactive Physics Controls */}
            <div className="sandbox-controls">
              <div className="ctrl-group">
                <label>Launch Velocity (v₀): <span className="chalk-cyan">{velocity} m/s</span></label>
                <input 
                  type="range" min="10" max="60" value={velocity} 
                  onChange={(e) => setVelocity(Number(e.target.value))} 
                />
              </div>

              <div className="ctrl-group">
                <label>Launch Angle (θ): <span className="chalk-gold">{angle}°</span></label>
                <input 
                  type="range" min="15" max="85" value={angle} 
                  onChange={(e) => setAngle(Number(e.target.value))} 
                />
              </div>

              {/* Planetary Gravity Picker */}
              <div className="ctrl-group">
                <label>Gravitational Field: <span className="chalk-green">{planet} ({gravity} m/s²)</span></label>
                <div className="planet-pills">
                  {GRAVITY_PRESETS.map(p => (
                    <button 
                      key={p.name}
                      className={`pill-btn ${planet === p.name ? 'active' : ''}`}
                      onClick={() => { setPlanet(p.name); setGravity(p.g); }}
                    >
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ctrl-actions">
                <button 
                  className={`btn-action ${compareAngle ? 'active' : ''}`}
                  onClick={() => setCompareAngle(!compareAngle)}
                  title="Compare with complementary angle 90° - θ"
                >
                  Dual Angle ({90 - angle}°)
                </button>
                <button 
                  className="btn-action play-btn"
                  onClick={() => setIsRunning(!isRunning)}
                >
                  {isRunning ? <Pause size={14}/> : <Play size={14}/>} {isRunning ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Tab 3: Lecture Keyframe Reel */}
        {activeTab === 'diagram' && (
          <div className="diagram-board-view">
            <div className="diagram-container">
              <img 
                src={`${apiBase}/frames/${frameToDisplay}`} 
                alt="Lecture Grounded Keyframe"
                className="lecture-keyframe-img"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80";
                }}
              />
              <div className="diagram-caption">
                <span>Grounded Lecture Keyframe: {frameToDisplay}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
