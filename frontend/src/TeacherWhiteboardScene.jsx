import React, { useEffect, useState, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

export default function TeacherWhiteboardScene({
  dialogueText = "",
  mathLatex = "",
  isSpeaking = false,
  topicTitle = "Kinematics 2D: Projectile Motion",
  lessonStep = 1
}) {
  const [displayedHandwriting, setDisplayedHandwriting] = useState("");
  const [displayedLatex, setDisplayedLatex] = useState("");
  const [handPos, setHandPos] = useState({ x: 190, y: 140 });
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [boardLines, setBoardLines] = useState([]);
  
  const canvasRef = useRef(null);
  const mathRef = useRef(null);

  // Lip sync animation
  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthOpen(Math.random() > 0.25 ? Math.random() * 0.8 + 0.2 : 0.05);
      }, 130);
    } else {
      setMouthOpen(0.05);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Step-by-step chalk writing animation when dialogue / formula changes
  useEffect(() => {
    setIsWriting(true);
    setDisplayedHandwriting("");
    
    const explanationScript = [
      "1. Decompose Motion:  r(t) = x(t)î + y(t)ĵ",
      "2. Horizontal (ax = 0):  vx = u·cos(θ)  [CONSTANT]",
      "3. Vertical (ay = -g):  vy(t) = u·sin(θ) - gt",
      "4. At Apex Height:  vy = 0  =>  H_max = (u²·sin²θ) / 2g",
      "5. Max Range at 45°:  R = (u²·sin 2θ) / g"
    ];

    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let accumulated = [];

    const typingInterval = setInterval(() => {
      if (currentLineIndex < explanationScript.length) {
        const line = explanationScript[currentLineIndex];
        if (currentCharIndex < line.length) {
          currentCharIndex++;
          // Move teacher's hand to mimic writing
          setHandPos({
            x: 220 + (currentCharIndex * 7) % 320,
            y: 110 + currentLineIndex * 32
          });
        } else {
          accumulated.push(line);
          currentLineIndex++;
          currentCharIndex = 0;
        }
        setBoardLines([...accumulated, line.substring(0, currentCharIndex)]);
      } else {
        setIsWriting(false);
        clearInterval(typingInterval);
      }
    }, 35);

    return () => clearInterval(typingInterval);
  }, [mathLatex, lessonStep]);

  // Render KaTeX Math Header
  useEffect(() => {
    if (mathRef.current && mathLatex) {
      try {
        katex.render(mathLatex, mathRef.current, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [mathLatex]);

  // Draw Chalkboard Diagrams & Trajectory
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let t = 0;
    let animId;

    const renderBoard = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Slate Chalk Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw Ground Coordinate Axis
      const groundY = 240;
      const originX = 180;

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, groundY);
      ctx.lineTo(canvas.width - 30, groundY);
      ctx.stroke();

      // Chalk Y-Axis
      ctx.beginPath();
      ctx.moveTo(originX, 40);
      ctx.lineTo(originX, groundY);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText("Y (Vertical, ay = -g)", originX + 8, 55);
      ctx.fillText("X (Horizontal, ax = 0)", canvas.width - 150, groundY - 8);

      // Animated Parabolic Trajectory
      const v0 = 26;
      const thetaRad = (45 * Math.PI) / 180;
      const g = 9.8;
      const vx0 = v0 * Math.cos(thetaRad);
      const vy0 = v0 * Math.sin(thetaRad);
      const totalT = (2 * vy0) / g;
      const scale = 5.2;

      // Dashed Chalk Parabola Outline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let st = 0; st <= totalT; st += 0.04) {
        const px = originX + (vx0 * st) * scale;
        const py = groundY - (vy0 * st - 0.5 * g * st * st) * scale;
        if (st === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Active Particle & Vector Arrows
      const curT = Math.min(t, totalT);
      const curX = originX + (vx0 * curT) * scale;
      const curY = groundY - (vy0 * curT - 0.5 * g * curT * curT) * scale;
      const curVy = vy0 - g * curT;

      // Solid Path
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let st = 0; st <= curT; st += 0.02) {
        const px = originX + (vx0 * st) * scale;
        const py = groundY - (vy0 * st - 0.5 * g * st * st) * scale;
        if (st === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Particle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw Chalk Vectors (vx: Cyan, vy: Emerald, v: Gold)
      drawChalkArrow(ctx, curX, curY, curX + vx0 * 1.6, curY, '#38bdf8', 'vx');
      drawChalkArrow(ctx, curX, curY, curX, curY - curVy * 1.6, '#34d399', 'vy');
      drawChalkArrow(ctx, curX, curY, curX + vx0 * 1.6, curY - curVy * 1.6, '#fbbf24', 'v');

      t += 0.025;
      if (t > totalT + 0.5) t = 0;

      animId = requestAnimationFrame(renderBoard);
    };

    renderBoard();
    return () => cancelAnimationFrame(animId);
  }, []);

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
    <div className="teacher-whiteboard-scene-container">
      {/* Top Blackboard Wooden Header */}
      <div className="scene-toolbar">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          <span className="scene-title">Professor's Active Chalkboard</span>
        </div>
        <span className="scene-topic-badge">{topicTitle}</span>
      </div>

      {/* Main Classroom Slate Scene */}
      <div className="scene-slate-stage">
        
        {/* Layer 1: Blackboard KaTeX Formula Box */}
        <div className="chalk-math-card">
          <div className="chalk-math-label">DERIVATION FORMULATION</div>
          <div ref={mathRef} className="chalk-katex-view"></div>
        </div>

        {/* Layer 2: Real-time Canvas with Trajectory & Vectors */}
        <div className="scene-canvas-container">
          <canvas ref={canvasRef} width={760} height={260} className="scene-canvas" />

          {/* Layer 3: Live Chalk Handwriting Lines written by Professor */}
          <div className="chalk-handwriting-overlay">
            {boardLines.map((line, idx) => (
              <div key={idx} className="chalk-line-text">
                {line}
              </div>
            ))}
          </div>

          {/* Layer 4: Animated Teacher Avatar standing in the Scene */}
          <div className="in-scene-teacher-avatar">
            <svg viewBox="0 0 160 260" className="teacher-full-body-svg" width="140" height="230">
              <defs>
                <radialGradient id="teacherFace" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#ffdfc4" />
                  <stop offset="100%" stopColor="#f0b288" />
                </radialGradient>
                <linearGradient id="teacherSuit" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Lower Body & Skirt */}
              <polygon points="45,170 115,170 125,250 35,250" fill="#0f172a" />
              {/* Shoes */}
              <ellipse cx="55" cy="255" rx="14" ry="4" fill="#000000" />
              <ellipse cx="105" cy="255" rx="14" ry="4" fill="#000000" />

              {/* Torso & Professor Suit Jacket */}
              <path d="M 38 175 L 42 110 L 62 100 L 98 100 L 118 110 L 122 175 Z" fill="url(#teacherSuit)" />
              <polygon points="70,100 90,100 80,130" fill="#ffffff" />
              <polygon points="78,110 82,110 81,148 79,148" fill="#38bdf8" />

              {/* Left Arm (Resting on side) */}
              <path d="M 42 110 Q 25 140 32 170" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" fill="none" />
              <circle cx="32" cy="170" r="6" fill="#f0b288" />

              {/* Head & Hair */}
              <ellipse cx="80" cy="55" rx="38" ry="42" fill="#3d2314" />
              <ellipse cx="80" cy="60" rx="28" ry="34" fill="url(#teacherFace)" />
              <path d="M 52 48 Q 80 28 108 48 Q 94 42 80 44 Q 66 42 52 48 Z" fill="#3d2314" />

              {/* Glasses */}
              <circle cx="68" cy="58" r="9" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.8" />
              <circle cx="92" cy="58" r="9" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.8" />
              <line x1="77" y1="58" x2="83" y2="58" stroke="#38bdf8" strokeWidth="1.8" />

              {/* Eyes */}
              <circle cx="68" cy="58" r="3.5" fill="#0f172a" />
              <circle cx="92" cy="58" r="3.5" fill="#0f172a" />
              <circle cx="66.5" cy="56.5" r="1.2" fill="#ffffff" />
              <circle cx="90.5" cy="56.5" r="1.2" fill="#ffffff" />

              {/* Nose & Mouth (Animated Lip Sync) */}
              <path d="M 80 58 L 78 67 L 82 67" stroke="#d4916a" strokeWidth="1.5" fill="none" />
              <ellipse 
                cx="80" 
                cy="76" 
                rx={Math.max(3.5, 6 * mouthOpen + 3)} 
                ry={Math.max(1.2, 5 * mouthOpen + 1)} 
                fill="#8b2635" 
                stroke="#c95061" 
                strokeWidth="1"
              />

              {/* Right Arm & Chalk Hand (Gesturing and Writing on Board) */}
              <path 
                d={`M 118 110 Q ${handPos.x * 0.4 + 40} ${handPos.y * 0.4 + 40} 145 95`} 
                stroke="#0f172a" 
                strokeWidth="12" 
                strokeLinecap="round" 
                fill="none" 
              />
              {/* Hand holding White Chalk */}
              <circle cx="145" cy="95" r="6" fill="#f0b288" />
              <rect x="145" y="90" width="8" height="4" fill="#ffffff" rx="1" transform="rotate(-30 145 90)" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
