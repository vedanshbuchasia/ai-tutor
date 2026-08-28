import React, { useEffect, useState, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Sparkles, BookOpen, CheckCircle2, RotateCcw, Play, Pause } from 'lucide-react';

export default function ChalkboardMasterClass({
  lesson,
  isSpeaking,
  onNextQuestion,
  onReplay
}) {
  const canvasRef = useRef(null);
  const mathRefs = useRef({});
  const [simTime, setSimTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [visibleStepCount, setVisibleStepCount] = useState(0);

  // Lip-sync for teacher avatar
  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthOpen(Math.random() > 0.25 ? Math.random() * 0.8 + 0.2 : 0.05);
      }, 120);
    } else {
      setMouthOpen(0.05);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Progressive Step-by-Step Chalk Reveal
  useEffect(() => {
    setVisibleStepCount(0);
    setSimTime(0);
    setIsRunning(true);

    const steps = lesson?.chalk_steps || [];
    let current = 0;
    const stepInterval = setInterval(() => {
      if (current < steps.length) {
        current++;
        setVisibleStepCount(current);
      } else {
        clearInterval(stepInterval);
      }
    }, 1200);

    return () => clearInterval(stepInterval);
  }, [lesson]);

  // KaTeX rendering for chalk steps
  useEffect(() => {
    const steps = lesson?.chalk_steps || [];
    steps.forEach((step, idx) => {
      const el = mathRefs.current[idx];
      if (el && step.latex) {
        try {
          katex.render(step.latex, el, {
            displayMode: true,
            throwOnError: false
          });
        } catch (err) {
          console.error("KaTeX render error:", err);
        }
      }
    });
  }, [lesson, visibleStepCount]);

  // Main 60fps Trajectory Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const v0 = lesson?.diagram?.velocity || 22;
    const angle = lesson?.diagram?.angle || 40;
    const g = lesson?.diagram?.gravity || 9.8;
    const rad = (angle * Math.PI) / 180;

    const vx0 = v0 * Math.cos(rad);
    const vy0 = v0 * Math.sin(rad);
    const flightTime = (2 * vy0) / g;
    const maxHeight = (vy0 * vy0) / (2 * g);
    const totalRange = (v0 * v0 * Math.sin(2 * rad)) / g;

    const scale = 5.6;
    const originX = 180;
    const originY = 210;

    let t = simTime;
    let animId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Chalk Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Hand-Drawn Coordinate Axes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      // Ground X-Axis
      ctx.beginPath();
      ctx.moveTo(originX - 10, originY);
      ctx.lineTo(canvas.width - 20, originY);
      ctx.stroke();
      // Vertical Y-Axis
      ctx.beginPath();
      ctx.moveTo(originX, originY + 10);
      ctx.lineTo(originX, 30);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText("Y (Height)", originX + 8, 42);
      ctx.fillText("X (Range)", canvas.width - 90, originY - 6);

      // Dashed Theoretical Trajectory
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let st = 0; st <= flightTime; st += 0.04) {
        const px = originX + (vx0 * st) * scale;
        const py = originY - (vy0 * st - 0.5 * g * st * st) * scale;
        if (st === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Solid Traced Arc
      const curT = Math.min(t, flightTime);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      for (let st = 0; st <= curT; st += 0.02) {
        const px = originX + (vx0 * st) * scale;
        const py = originY - (vy0 * st - 0.5 * g * st * st) * scale;
        if (st === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Projectile Particle
      const posX = originX + (vx0 * curT) * scale;
      const posY = originY - (vy0 * curT - 0.5 * g * curT * curT) * scale;
      const curVy = vy0 - g * curT;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(posX, posY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Live Vector Arrows
      const vScale = 1.6;
      drawChalkArrow(ctx, posX, posY, posX + vx0 * vScale, posY, '#38bdf8', `vx = ${vx0.toFixed(1)}`);
      drawChalkArrow(ctx, posX, posY, posX, posY - curVy * vScale, '#34d399', `vy = ${curVy.toFixed(1)}`);
      drawChalkArrow(ctx, posX, posY, posX + vx0 * vScale, posY - curVy * vScale, '#fbbf24', 'v');

      // Apex Marker
      const apexX = originX + (vx0 * (flightTime / 2)) * scale;
      const apexY = originY - maxHeight * scale;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(apexX, apexY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`H_max: ${maxHeight.toFixed(1)}m`, apexX - 25, apexY - 8);

      // Range Marker
      const landX = originX + totalRange * scale;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(landX, originY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`R: ${totalRange.toFixed(1)}m`, landX - 20, originY + 16);

      if (isRunning) {
        t += 0.025;
        if (t > flightTime + 0.5) t = 0;
        setSimTime(t);
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [lesson, isRunning]);

  const drawChalkArrow = (ctx, fromX, fromY, toX, toY, color, label) => {
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
    <div className="chalkboard-master-container">
      {/* Blackboard Top Frame Header */}
      <div className="chalkboard-header-bar">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          <span className="master-title">{lesson?.topic_title || "Kinematics MasterClass"}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="btn-replay-chalk" 
            onClick={() => { setVisibleStepCount(0); if (onReplay) onReplay(); }}
          >
            <RotateCcw size={13} /> Replay Lesson
          </button>
          <span className="live-chalk-badge">● Active Chalkboard</span>
        </div>
      </div>

      {/* Main Blackboard Surface */}
      <div className="chalkboard-stage-area">
        
        {/* Upper Stage: Live Trajectory Animation Canvas & Teacher Avatar */}
        <div className="chalk-canvas-row">
          <canvas ref={canvasRef} width={760} height={220} className="chalk-physics-canvas" />

          {/* Teacher Avatar Standing in Front of the Blackboard */}
          <div className="chalk-teacher-avatar">
            <svg viewBox="0 0 160 260" className="teacher-full-body-svg" width="135" height="215">
              <defs>
                <radialGradient id="faceMat" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#ffdfc4" />
                  <stop offset="100%" stopColor="#f0b288" />
                </radialGradient>
                <linearGradient id="suitMat" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Lower Body */}
              <polygon points="45,170 115,170 125,250 35,250" fill="#0f172a" />
              <ellipse cx="55" cy="255" rx="14" ry="4" fill="#000000" />
              <ellipse cx="105" cy="255" rx="14" ry="4" fill="#000000" />

              {/* Suit */}
              <path d="M 38 175 L 42 110 L 62 100 L 98 100 L 118 110 L 122 175 Z" fill="url(#suitMat)" />
              <polygon points="70,100 90,100 80,130" fill="#ffffff" />
              <polygon points="78,110 82,110 81,148 79,148" fill="#38bdf8" />

              {/* Arm Left */}
              <path d="M 42 110 Q 25 140 32 170" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" fill="none" />
              <circle cx="32" cy="170" r="6" fill="#f0b288" />

              {/* Head & Hair */}
              <ellipse cx="80" cy="55" rx="38" ry="42" fill="#3d2314" />
              <ellipse cx="80" cy="60" rx="28" ry="34" fill="url(#faceMat)" />
              <path d="M 52 48 Q 80 28 108 48 Q 94 42 80 44 Q 66 42 52 48 Z" fill="#3d2314" />

              {/* Glasses */}
              <circle cx="68" cy="58" r="9" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.8" />
              <circle cx="92" cy="58" r="9" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.8" />
              <line x1="77" y1="58" x2="83" y2="58" stroke="#38bdf8" strokeWidth="1.8" />

              {/* Eyes */}
              <circle cx="68" cy="58" r="3.5" fill="#0f172a" />
              <circle cx="92" cy="58" r="3.5" fill="#0f172a" />

              {/* Mouth (Lip-sync) */}
              <ellipse 
                cx="80" 
                cy="76" 
                rx={Math.max(3.5, 6 * mouthOpen + 3)} 
                ry={Math.max(1.2, 5 * mouthOpen + 1)} 
                fill="#8b2635" 
                stroke="#c95061" 
                strokeWidth="1"
              />

              {/* Right Arm & Chalk */}
              <path d="M 118 110 Q 135 125 145 95" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" fill="none" />
              <circle cx="145" cy="95" r="6" fill="#f0b288" />
              <rect x="145" y="90" width="8" height="4" fill="#ffffff" rx="1" transform="rotate(-30 145 90)" />
            </svg>
          </div>
        </div>

        {/* Lower Stage: Problem Solving & Step-by-Step Chalk Handwriting */}
        <div className="chalk-problem-solving-area">
          
          {/* Question / Concept Box */}
          {lesson?.problem_statement && (
            <div className="chalk-problem-statement">
              <div className="problem-label">📝 Problem Statement Written on Board</div>
              <p className="problem-text">{lesson.problem_statement}</p>
            </div>
          )}

          {/* Step-by-Step Handwritten Calculations */}
          <div className="chalk-steps-grid">
            {(lesson?.chalk_steps || []).slice(0, visibleStepCount).map((step, idx) => (
              <div key={idx} className="chalk-step-card animate-chalk-in">
                <div className="step-badge">Step {step.step_num}: {step.title}</div>
                <p className="step-explanation">{step.content}</p>
                {step.latex && (
                  <div 
                    ref={el => mathRefs.current[idx] = el}
                    className="step-katex-box"
                  ></div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
