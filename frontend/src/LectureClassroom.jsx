import React, { useEffect, useState, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  Award,
  Send,
  GraduationCap
} from 'lucide-react';

const LECTURE_MODULES = [
  {
    id: 1,
    title: "1. The Fundamental Principle: Independence of Motion",
    spoken_text: "Welcome students to our masterclass on 2D Projectile Motion! The golden rule of kinematics is that horizontal and vertical motions are completely independent of each other. Gravity only acts downward along the y-axis, causing vertical deceleration. The horizontal motion experiences zero net force, gliding forward purely by inertia at a constant speed.",
    chalk_heading: "CORE LAW: INDEPENDENCE OF PERPENDICULAR MOTIONS",
    board_notes: [
      "• 2D Projectile Motion = (1D Constant Velocity in X) + (1D Freefall in Y)",
      "• Gravity pulls DOWNWARD only: ax = 0,  ay = -g = -9.8 m/s²",
      "• Newton's 1st Law in X: vx stays constant throughout flight!",
      "• Position Vector: r(t) = x(t)î + y(t)ĵ"
    ],
    latex_formulas: [
      "\\vec{r}(t) = (u\\cos\\theta)t\\,\\hat{i} + \\left((u\\sin\\theta)t - \\frac{1}{2}gt^2\\right)\\hat{j}",
      "v_x(t) = u\\cos\\theta = \\text{constant}, \\quad v_y(t) = u\\sin\\theta - gt"
    ],
    diagram_type: "INDEPENDENCE_DIAGRAM"
  },
  {
    id: 2,
    title: "2. Vector Decomposition & Initial Conditions",
    spoken_text: "When a projectile is launched at speed u and angle theta, we must first break down the launch velocity vector into orthogonal components using trigonometry. The horizontal speed is u times cosine theta, and the initial vertical speed is u times sine theta. Let's write out the right-triangle decomposition on the board.",
    chalk_heading: "INITIAL VELOCITY VECTOR DECOMPOSITION",
    board_notes: [
      "• Launch Velocity Vector: u at angle θ above the ground",
      "• Horizontal Component: ux = u · cos(θ) [Constant]",
      "• Vertical Component: uy0 = u · sin(θ) [Decreases by 9.8 m/s every second]",
      "• Resultant Speed at any time: v(t) = √(vx² + vy(t)²)"
    ],
    latex_formulas: [
      "u_x = u\\cos\\theta, \\quad u_y = u\\sin\\theta",
      "\\tan\\theta = \\frac{u_y}{u_x}, \\quad |\\vec{u}| = \\sqrt{u_x^2 + u_y^2}"
    ],
    diagram_type: "VECTOR_DECOMPOSITION"
  },
  {
    id: 3,
    title: "3. Step-by-Step Problem Solving: Peak Height & Airtime",
    spoken_text: "Let's solve a real physics problem on the board! Consider a soccer ball kicked at 20 meters per second at 30 degrees. Let's find: first, the time to reach the apex; second, the maximum height H max; and third, the total time in the air. Notice that at the peak, vertical velocity vy equals zero.",
    chalk_heading: "WORKED EXAMPLE: u = 20 m/s at θ = 30°",
    board_notes: [
      "• Step 1: ux = 20·cos(30°) = 17.32 m/s,  uy0 = 20·sin(30°) = 10.0 m/s",
      "• Step 2: At Apex, vy = 0  =>  t_apex = uy0 / g = 10.0 / 9.8 = 1.02 s",
      "• Step 3: H_max = uy0² / (2g) = 100 / 19.6 = 5.10 meters",
      "• Step 4: Total Flight Time T = 2 × t_apex = 2.04 seconds"
    ],
    latex_formulas: [
      "t_{\\text{apex}} = \\frac{u\\sin\\theta}{g} = 1.02\\text{ s}, \\quad H_{\\max} = \\frac{u^2\\sin^2\\theta}{2g} = 5.10\\text{ m}",
      "T_{\\text{total}} = \\frac{2u\\sin\\theta}{g} = 2.04\\text{ s}"
    ],
    diagram_type: "PROBLEM_SOLVING"
  },
  {
    id: 4,
    title: "4. Horizontal Range & 45° Angle Optimization",
    spoken_text: "Finally, let's derive the horizontal range R and prove why 45 degrees gives the maximum possible distance! Range is horizontal speed times total time. Using the double-angle identity 2 sine theta cosine theta equals sine 2 theta, we get the famous range formula. Maximum occurs when sine 2 theta equals 1, meaning theta equals 45 degrees.",
    chalk_heading: "HORIZONTAL RANGE DERIVATION & 45° PROOF",
    board_notes: [
      "• Range R = vx × T_total = (u·cos θ) × (2u·sin θ / g)",
      "• Trig Identity: 2·sin θ·cos θ = sin(2θ)",
      "• Range Equation: R = (u² · sin 2θ) / g",
      "• Maximum Range occurs at θ = 45° because sin(90°) = 1",
      "• Complementary angles (e.g. 30° and 60°) land at identical range!"
    ],
    latex_formulas: [
      "R = \\frac{u^2\\sin(2\\theta)}{g} \\implies R_{\\max} = \\frac{u^2}{g} \\quad (\\text{at } \\theta = 45^\\circ)",
      "R(30^\\circ) = R(60^\\circ) = 35.33\\text{ meters}"
    ],
    diagram_type: "RANGE_PROOF"
  }
];

export default function LectureClassroom({ onSendMessage }) {
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [visibleNoteIndex, setVisibleNoteIndex] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [doubtLog, setDoubtLog] = useState([]);
  
  const canvasRef = useRef(null);
  const formulaRefs = useRef({});
  const curr = LECTURE_MODULES[currentModuleIdx];

  // Lip-sync
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setMouthOpen(Math.random() > 0.25 ? Math.random() * 0.8 + 0.2 : 0.05);
      }, 120);
    } else {
      setMouthOpen(0.05);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Progressive note writing as teacher speaks
  useEffect(() => {
    setVisibleNoteIndex(0);
    const notes = curr.board_notes || [];
    let idx = 0;

    const timer = setInterval(() => {
      if (idx < notes.length) {
        idx++;
        setVisibleNoteIndex(idx);
      } else {
        clearInterval(timer);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [currentModuleIdx]);

  // Render KaTeX Formulas
  useEffect(() => {
    const formulas = curr.latex_formulas || [];
    formulas.forEach((form, i) => {
      const el = formulaRefs.current[i];
      if (el) {
        try {
          katex.render(form, el, { displayMode: true, throwOnError: false });
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, [currentModuleIdx, visibleNoteIndex]);

  // Speech narration
  const speakCurrentLesson = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(curr.spoken_text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      // Auto-advance to next module after short pause
      if (currentModuleIdx < LECTURE_MODULES.length - 1) {
        setTimeout(() => {
          setCurrentModuleIdx(prev => prev + 1);
        }, 2000);
      }
    };
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartClass = () => {
    setIsPlaying(true);
    speakCurrentLesson();
  };

  const handlePauseClass = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  const handleNextModule = () => {
    window.speechSynthesis?.cancel();
    const next = Math.min(currentModuleIdx + 1, LECTURE_MODULES.length - 1);
    setCurrentModuleIdx(next);
    setIsPlaying(false);
  };

  const handlePrevModule = () => {
    window.speechSynthesis?.cancel();
    const prev = Math.max(currentModuleIdx - 1, 0);
    setCurrentModuleIdx(prev);
    setIsPlaying(false);
  };

  // Draw Dynamic Physics Diagram on Blackboard
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let t = 0;

    const render = () => {
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

      const originX = 180;
      const originY = 190;

      // Coordinate axes
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      // X-Axis
      ctx.beginPath();
      ctx.moveTo(originX - 10, originY);
      ctx.lineTo(canvas.width - 20, originY);
      ctx.stroke();
      // Y-Axis
      ctx.beginPath();
      ctx.moveTo(originX, originY + 10);
      ctx.lineTo(originX, 25);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText("Y (Vertical)", originX + 8, 35);
      ctx.fillText("X (Horizontal)", canvas.width - 90, originY - 6);

      // Parabolic Trajectory
      const v0 = 24;
      const angleRad = (currentModuleIdx === 3 ? 45 : 30) * Math.PI / 180;
      const g = 9.8;
      const vx0 = v0 * Math.cos(angleRad);
      const vy0 = v0 * Math.sin(angleRad);
      const totalT = (2 * vy0) / g;
      const scale = 5.2;

      // Dashed Parabola Outline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let st = 0; st <= totalT; st += 0.04) {
        const px = originX + (vx0 * st) * scale;
        const py = originY - (vy0 * st - 0.5 * g * st * st) * scale;
        if (st === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Particle
      const curT = Math.min(t, totalT);
      const curX = originX + (vx0 * curT) * scale;
      const curY = originY - (vy0 * curT - 0.5 * g * curT * curT) * scale;
      const curVy = vy0 - g * curT;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let st = 0; st <= curT; st += 0.02) {
        const px = originX + (vx0 * st) * scale;
        const py = originY - (vy0 * st - 0.5 * g * st * st) * scale;
        if (st === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Vector arrows
      drawChalkArrow(ctx, curX, curY, curX + vx0 * 1.5, curY, '#38bdf8', 'vx');
      drawChalkArrow(ctx, curX, curY, curX, curY - curVy * 1.5, '#34d399', 'vy');

      t += 0.025;
      if (t > totalT + 0.6) t = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentModuleIdx]);

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

  const handleAskDoubt = (e) => {
    e.preventDefault();
    if (!studentInput.trim()) return;
    const text = studentInput;
    setDoubtLog(prev => [...prev, { q: text, a: `Prof. Sophia: That is an excellent doubt regarding ${curr.title}! Let's review the step on the board: ${curr.board_notes[0]}` }]);
    setStudentInput('');
  };

  return (
    <div className="lecture-classroom-container">
      {/* Top Classroom Control Header */}
      <header className="classroom-top-header">
        <div className="flex items-center gap-3">
          <GraduationCap size={22} className="text-gold" />
          <div>
            <h2 className="header-title">Kinematics 2D MasterClass Lecture</h2>
            <p className="header-subtitle">Module {currentModuleIdx + 1} of {LECTURE_MODULES.length}: {curr.title}</p>
          </div>
        </div>

        {/* Master Lecture Play Controls */}
        <div className="lecture-play-controls">
          <button className="btn-lecture-nav" onClick={handlePrevModule} disabled={currentModuleIdx === 0}>
            <SkipBack size={15} /> Prev Chapter
          </button>
          
          <button 
            className={`btn-main-play ${isPlaying ? 'playing' : ''}`}
            onClick={isPlaying ? handlePauseClass : handleStartClass}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'Pause Lecture' : '▶ Start / Listen to Class'}</span>
          </button>

          <button className="btn-lecture-nav" onClick={handleNextModule} disabled={currentModuleIdx === LECTURE_MODULES.length - 1}>
            Next Chapter <SkipForward size={15} />
          </button>
        </div>
      </header>

      {/* Main Classroom Stage */}
      <div className="classroom-main-stage">
        
        {/* Left Side: Professor Speech Dialogue & Student Doubt Stream */}
        <aside className="classroom-sidebar">
          {/* Active Teacher Speech Bubble */}
          <div className="teacher-live-speech-card">
            <div className="card-header-badge">
              <Sparkles size={14} className="text-cyan" />
              <span>Prof. Sophia (Explaining Live)</span>
            </div>
            <p className="speech-paragraph">{curr.spoken_text}</p>
          </div>

          {/* Chapters Navigation */}
          <div className="chapters-list-card">
            <div className="card-header-badge">
              <BookOpen size={14} className="text-gold" />
              <span>Curriculum Modules</span>
            </div>
            <div className="modules-list">
              {LECTURE_MODULES.map((m, idx) => (
                <button 
                  key={m.id}
                  className={`module-item-btn ${idx === currentModuleIdx ? 'active' : ''}`}
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setCurrentModuleIdx(idx);
                    setIsPlaying(false);
                  }}
                >
                  <span className="mod-num">0{m.id}</span>
                  <span className="mod-title">{m.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Student Doubt Input */}
          <form className="sidebar-doubt-form" onSubmit={handleAskDoubt}>
            <input 
              type="text" 
              placeholder="Interrupt professor with any doubt..." 
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
            />
            <button type="submit" className="btn-send-doubt"><Send size={15} /></button>
          </form>

          {/* Doubt Stream */}
          {doubtLog.length > 0 && (
            <div className="doubt-history-stream">
              {doubtLog.map((d, i) => (
                <div key={i} className="doubt-entry">
                  <span className="doubt-q">You: {d.q}</span>
                  <span className="doubt-a">{d.a}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right Side: The Full Interactive Blackboard Stage */}
        <main className="classroom-blackboard-stage">
          
          {/* Blackboard Top Title Bar */}
          <div className="blackboard-title-row">
            <span className="board-main-heading">{curr.chalk_heading}</span>
            <span className="board-status-pill">{isPlaying ? '🎙️ Lecturing & Writing Live' : '⏸️ Paused (Click Start)'}</span>
          </div>

          {/* Upper Blackboard Canvas with Teacher Standing in Front */}
          <div className="blackboard-canvas-wrapper">
            <canvas ref={canvasRef} width={800} height={200} className="blackboard-canvas" />

            {/* In-Scene Teacher Avatar */}
            <div className="blackboard-teacher-avatar">
              <svg viewBox="0 0 160 260" className="teacher-svg" width="135" height="200">
                <defs>
                  <radialGradient id="teacherSkin" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#ffdfc4" />
                    <stop offset="100%" stopColor="#f0b288" />
                  </radialGradient>
                  <linearGradient id="teacherCoat" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                <polygon points="45,170 115,170 125,250 35,250" fill="#0f172a" />
                <ellipse cx="55" cy="255" rx="14" ry="4" fill="#000" />
                <ellipse cx="105" cy="255" rx="14" ry="4" fill="#000" />

                <path d="M 38 175 L 42 110 L 62 100 L 98 100 L 118 110 L 122 175 Z" fill="url(#teacherCoat)" />
                <polygon points="70,100 90,100 80,130" fill="#ffffff" />
                <polygon points="78,110 82,110 81,148 79,148" fill="#38bdf8" />

                <path d="M 42 110 Q 25 140 32 170" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" fill="none" />
                <circle cx="32" cy="170" r="6" fill="#f0b288" />

                <ellipse cx="80" cy="55" rx="38" ry="42" fill="#3d2314" />
                <ellipse cx="80" cy="60" rx="28" ry="34" fill="url(#teacherSkin)" />
                <path d="M 52 48 Q 80 28 108 48 Q 94 42 80 44 Q 66 42 52 48 Z" fill="#3d2314" />

                <circle cx="68" cy="58" r="9" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.8" />
                <circle cx="92" cy="58" r="9" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.8" />
                <line x1="77" y1="58" x2="83" y2="58" stroke="#38bdf8" strokeWidth="1.8" />

                <circle cx="68" cy="58" r="3.5" fill="#0f172a" />
                <circle cx="92" cy="58" r="3.5" fill="#0f172a" />

                <ellipse 
                  cx="80" 
                  cy="76" 
                  rx={Math.max(3.5, 6 * mouthOpen + 3)} 
                  ry={Math.max(1.2, 5 * mouthOpen + 1)} 
                  fill="#8b2635" 
                  stroke="#c95061" 
                  strokeWidth="1"
                />

                <path d="M 118 110 Q 135 125 145 95" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" fill="none" />
                <circle cx="145" cy="95" r="6" fill="#f0b288" />
                <rect x="145" y="90" width="8" height="4" fill="#ffffff" rx="1" transform="rotate(-30 145 90)" />
              </svg>
            </div>
          </div>

          {/* Lower Blackboard: Mathematical Derivations & Chalk Notes Written Out */}
          <div className="blackboard-notes-area">
            
            {/* KaTeX Formulas Box */}
            <div className="board-formula-box">
              {(curr.latex_formulas || []).map((_, i) => (
                <div key={i} ref={el => formulaRefs.current[i] = el} className="chalk-katex-formula"></div>
              ))}
            </div>

            {/* Step-by-Step Chalk Notes */}
            <div className="chalk-notes-list">
              {(curr.board_notes || []).slice(0, visibleNoteIndex).map((note, i) => (
                <div key={i} className="chalk-note-line animate-chalk-write">
                  {note}
                </div>
              ))}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
