import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Send,
  HelpCircle,
  Clock
} from 'lucide-react';

const FULL_LECTURE_SECTIONS = [
  {
    id: 1,
    title: "1. Introduction to 2D Kinematics & The Core Physical Model",
    audio: "Welcome to our comprehensive masterclass on 2D Projectile Kinematics! In this class, we will learn the complete physics of projectile motion from absolute scratch. A projectile is defined as any body in free flight where the only acting force is downward Earth gravity. There is no engine, no rocket thruster, and no wings. Whether a basketball, a stone, or a cannonball, every projectile follows the exact same universal laws of classical mechanics.",
    notes: [
      "• Definition: An object in flight under the sole influence of gravity (F_net = -mg ĵ).",
      "• Coordinate Frame: Horizontal X-axis (ground distance) and Vertical Y-axis (altitude).",
      "• The Golden Law: Motion along the horizontal and vertical axes are completely independent and decoupled."
    ],
    latex: [
      "\\vec{F}_{\\text{net}} = \\vec{F}_g = -mg\\,\\hat{j} \\implies \\vec{a} = 0\\,\\hat{i} - g\\,\\hat{j}",
      "a_x = 0, \\quad a_y = -g = -9.8\\text{ m/s}^2"
    ],
    diagram: "AXES_SETUP"
  },
  {
    id: 2,
    title: "2. The Independence of Perpendicular Motions (Bullet Drop Paradox)",
    audio: "The most important physical principle in 2D kinematics is the Independence of Perpendicular Motions. Consider this thought experiment: if you drop a ball vertically while simultaneously firing another ball horizontally at 500 meters per second from the same height, both balls hit the floor at the exact same millisecond! Why? Because gravity pulls strictly downwards along the vertical y-axis. It has zero horizontal component, meaning the horizontal speed has zero power to delay the fall.",
    notes: [
      "• Decoupling: We analyze 2D motion as two separate 1D problems occurring simultaneously.",
      "• Horizontal: Moves purely by inertia with constant speed (ax = 0).",
      "• Vertical: Moves under constant gravitational acceleration (ay = -9.8 m/s²)."
    ],
    latex: [
      "\\vec{r}(t) = x(t)\\,\\hat{i} + y(t)\\,\\hat{j} = (v_x t)\\,\\hat{i} + \\left(v_{y0}t - \\frac{1}{2}gt^2\\right)\\hat{j}"
    ],
    diagram: "INDEPENDENCE"
  },
  {
    id: 3,
    title: "3. Launch Geometry & Vector Decomposition",
    audio: "When an object is launched with initial speed u at an elevation angle theta above the ground, its initial velocity vector points diagonally into the air. We must decompose this vector into horizontal and vertical components using right-triangle trigonometry. The horizontal speed ux is u cosine theta, and the initial vertical speed uy is u sine theta.",
    notes: [
      "• Horizontal Component: ux = u · cos(θ) [Governs horizontal ground coverage].",
      "• Vertical Component: uy0 = u · sin(θ) [Governs height climbed and total airtime].",
      "• Speed Magnitude at any instant: |v| = √(vx² + vy²)."
    ],
    latex: [
      "u_x = u\\cos\\theta, \\quad u_{y0} = u\\sin\\theta",
      "|\\vec{u}| = \\sqrt{u_x^2 + u_{y0}^2}, \\quad \\theta = \\arctan\\left(\\frac{u_{y0}}{u_x}\\right)"
    ],
    diagram: "VECTOR_DECOMPOSITION"
  },
  {
    id: 4,
    title: "4. The 1D Horizontal Dimension (Inertial Coasting)",
    audio: "Looking at the horizontal direction: by Newton's First Law, an object in motion remains in motion at constant velocity unless acted upon by a net force. In ideal projectile motion with no air resistance, horizontal acceleration ax is exactly zero. Thus, the horizontal velocity vx never speeds up or slows down—it remains constant from launch to landing, and ground distance grows linearly with time.",
    notes: [
      "• Net Horizontal Force: ΣFx = 0  =>  ax = 0 m/s².",
      "• Horizontal Velocity: vx(t) = ux = u · cos(θ) = CONSTANT forever.",
      "• Horizontal Distance: x(t) = (u · cos θ) · t."
    ],
    latex: [
      "a_x = 0 \\implies v_x(t) = u\\cos\\theta = \\text{constant}",
      "x(t) = (u\\cos\\theta) \\cdot t"
    ],
    diagram: "HORIZONTAL_AXIS"
  },
  {
    id: 5,
    title: "5. The 1D Vertical Dimension (Gravitational Combat)",
    audio: "In contrast, the vertical direction is in continuous combat with Earth's gravity. As the projectile rises, gravity pulls downward at 9.8 meters per second squared, draining its vertical speed until it momentarily reaches zero at the peak. Then gravity accelerates it back downward toward the ground.",
    notes: [
      "• Vertical Acceleration: ay = -g = -9.8 m/s² (always points downward).",
      "• Vertical Velocity: vy(t) = uy0 - g·t = (u · sin θ) - g·t.",
      "• Vertical Altitude: y(t) = (u · sin θ)·t - ½·g·t²."
    ],
    latex: [
      "a_y = -g = -9.8\\text{ m/s}^2",
      "v_y(t) = u\\sin\\theta - gt, \\quad y(t) = (u\\sin\\theta)t - \\frac{1}{2}gt^2",
      "v_y^2 = (u\\sin\\theta)^2 - 2gy"
    ],
    diagram: "VERTICAL_AXIS"
  },
  {
    id: 6,
    title: "6. Apex Peak: Maximum Height & Time to Top",
    audio: "Let's derive the maximum height H max and time to reach the top. At the exact apex of flight, the projectile stops ascending, meaning vertical velocity vy equals zero. Setting vy to zero gives the time to apex as u sine theta over g. Substituting this time into the vertical displacement equation yields maximum height equals u squared sine squared theta over 2g.",
    notes: [
      "• Apex Condition: vy = 0 at peak height (horizontal speed vx is still active!).",
      "• Time to Peak: t_apex = (u · sin θ) / g.",
      "• Maximum Height: H_max = (u² · sin²θ) / (2g)."
    ],
    latex: [
      "v_y = 0 \\implies 0 = u\\sin\\theta - gt_{\\text{apex}} \\implies t_{\\text{apex}} = \\frac{u\\sin\\theta}{g}",
      "H_{\\max} = \\frac{(u\\sin\\theta)^2}{2g} = \\frac{u^2\\sin^2\\theta}{2g}"
    ],
    diagram: "TRAJECTORY_ANNOTATED"
  },
  {
    id: 7,
    title: "7. Total Flight Time, Horizontal Range & 45° Optimization Proof",
    audio: "Because vacuum trajectory is symmetrical, total flight time T is exactly double the time to apex. The horizontal range R is horizontal speed times total airtime. Using the trigonometric identity 2 sine theta cosine theta equals sine 2 theta, we get range equals u squared sine 2 theta over g. Because sine 2 theta reaches its maximum value of 1 at 90 degrees, 45 degrees yields the absolute maximum range!",
    notes: [
      "• Total Airtime: T_total = 2 · t_apex = (2u · sin θ) / g.",
      "• Range Derivation: R = vx · T_total = (u · cos θ) · [(2u · sin θ)/g] = (u² · sin 2θ) / g.",
      "• 45° Proof: sin(2θ) is maximized at 2θ = 90°  =>  θ = 45° (R_max = u²/g).",
      "• Complementary Symmetry: Any two angles that sum to 90° (e.g. 30° & 60°) land at identical range!"
    ],
    latex: [
      "T_{\\text{total}} = \\frac{2u\\sin\\theta}{g}, \\quad R = \\frac{u^2\\sin(2\\theta)}{g}",
      "R_{\\max} = \\frac{u^2}{g} \\quad (\\text{at } \\theta = 45^\\circ)",
      "R(\\theta) = R(90^\\circ - \\theta)"
    ],
    diagram: "TRAJECTORY_ANNOTATED"
  },
  {
    id: 8,
    title: "8. The Trajectory Equation (Why Paths are Pure Parabolas)",
    audio: "Why is the path of a projectile a parabola? We can prove it mathematically by eliminating time t. From the horizontal motion, t equals x over u cosine theta. When we substitute this into the vertical equation, we get y as a quadratic function of x: y equals tan theta times x minus g over 2 u squared cosine squared theta times x squared. This is the exact equation of a parabola!",
    notes: [
      "• Eliminate Time (t): t = x / (u · cos θ).",
      "• Substitute into y(t): y = (u · sin θ)·[x/(u · cos θ)] - ½·g·[x/(u · cos θ)]².",
      "• Trajectory Equation: y(x) = (tan θ)·x - [g / (2u²·cos²θ)]·x².",
      "• Quadratic Form: y = Ax - Bx² (A pure parabola opening downwards)."
    ],
    latex: [
      "t = \\frac{x}{u\\cos\\theta} \\implies y(x) = (\\tan\\theta)x - \\frac{g}{2u^2\\cos^2\\theta}x^2",
      "y(x) = Ax - Bx^2 \\quad \\text{[Parabolic Path]}"
    ],
    diagram: "TRAJECTORY_ANNOTATED"
  },
  {
    id: 9,
    title: "9. Worked Practice Problem: Complete Step-by-Step Calculation",
    audio: "Let's put everything together with a full numerical problem! A soccer ball is kicked from ground level at speed u = 20 meters per second at an angle of 30 degrees. Let's calculate: initial components, apex time, maximum height, total flight time, and total range.",
    notes: [
      "• Given: u = 20 m/s, θ = 30°, g = 9.8 m/s².",
      "• Step 1: ux = 20·cos(30°) = 17.32 m/s,  uy0 = 20·sin(30°) = 10.0 m/s.",
      "• Step 2: t_apex = 10.0 / 9.8 = 1.02 seconds.",
      "• Step 3: H_max = (10.0)² / (2 × 9.8) = 100 / 19.6 = 5.10 meters.",
      "• Step 4: T_total = 2 × 1.02 = 2.04 seconds.",
      "• Step 5: Range R = 17.32 m/s × 2.04 s = 35.33 meters."
    ],
    latex: [
      "u_x = 17.32\\text{ m/s}, \\quad u_{y0} = 10.0\\text{ m/s}",
      "t_{\\text{apex}} = 1.02\\text{ s}, \\quad H_{\\max} = 5.10\\text{ m}, \\quad T_{\\text{total}} = 2.04\\text{ s}, \\quad R = 35.33\\text{ m}"
    ],
    diagram: "TRAJECTORY_ANNOTATED"
  }
];

export default function ContinuousMasterClass() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [studentQuestion, setStudentQuestion] = useState('');
  const [qaLog, setQaLog] = useState([]);

  const sectionRefs = useRef({});
  const mathRefs = useRef({});

  // Lip sync animation
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

  // Render KaTeX for all sections
  useEffect(() => {
    FULL_LECTURE_SECTIONS.forEach(sec => {
      sec.latex.forEach((latexStr, i) => {
        const key = `${sec.id}-${i}`;
        const el = mathRefs.current[key];
        if (el) {
          try {
            katex.render(latexStr, el, { displayMode: true, throwOnError: false });
          } catch (e) {
            console.error(e);
          }
        }
      });
    });
  }, []);

  // Continuous Full Lecture Player
  const playSectionSequentially = (index) => {
    if (index >= FULL_LECTURE_SECTIONS.length) {
      setIsPlaying(false);
      return;
    }

    setActiveSectionIdx(index);
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const sec = FULL_LECTURE_SECTIONS[index];
    const utterance = new SpeechSynthesisUtterance(sec.audio);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      // Automatically advance to the next section without stopping!
      setTimeout(() => {
        playSectionSequentially(index + 1);
      }, 1200);
    };
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStartClass = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    } else {
      playSectionSequentially(activeSectionIdx);
    }
  };

  const handleRestart = () => {
    window.speechSynthesis?.cancel();
    playSectionSequentially(0);
  };

  const handleAskDoubt = (e) => {
    e.preventDefault();
    if (!studentQuestion.trim()) return;
    const q = studentQuestion;
    const currentSec = FULL_LECTURE_SECTIONS[activeSectionIdx];
    setQaLog(prev => [...prev, {
      q,
      a: `Prof. Sophia: That is an excellent doubt regarding ${currentSec.title}! Remember: ${currentSec.notes[0]}`
    }]);
    setStudentQuestion('');
  };

  return (
    <div className="continuous-masterclass-container">
      {/* Top Navbar */}
      <header className="masterclass-top-bar">
        <div className="flex items-center gap-3">
          <GraduationCap size={26} className="text-gold" />
          <div>
            <h2 className="bar-title">Kinematics 2D Comprehensive MasterClass</h2>
            <p className="bar-sub">Complete Continuous Lecture • All 9 Sections from Scratch (No Button Pressing Required)</p>
          </div>
        </div>

        {/* Master Audio Lecture Controls */}
        <div className="bar-controls">
          <button className="btn-restart" onClick={handleRestart} title="Restart Full Lecture from Beginning">
            <RotateCcw size={15} /> Restart from Beginning
          </button>

          <button 
            className={`btn-play-full-lecture ${isPlaying ? 'active-playing' : ''}`}
            onClick={handleStartClass}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'Pause MasterClass' : '▶ Play Full Continuous Lecture'}</span>
          </button>
        </div>
      </header>

      {/* Main Classroom Layout */}
      <div className="masterclass-grid-layout">
        
        {/* Left Side: Avatar, Table of Contents & Doubt Box */}
        <aside className="masterclass-sidebar">
          
          {/* Animated Teacher Avatar Card */}
          <div className="teacher-avatar-card">
            <div className="avatar-svg-container">
              <svg viewBox="0 0 160 260" width="100" height="150">
                <defs>
                  <radialGradient id="tSkin" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#ffdfc4" />
                    <stop offset="100%" stopColor="#f0b288" />
                  </radialGradient>
                  <linearGradient id="tCoat" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                <polygon points="45,170 115,170 125,250 35,250" fill="#0f172a" />
                <ellipse cx="55" cy="255" rx="14" ry="4" fill="#000" />
                <ellipse cx="105" cy="255" rx="14" ry="4" fill="#000" />

                <path d="M 38 175 L 42 110 L 62 100 L 98 100 L 118 110 L 122 175 Z" fill="url(#tCoat)" />
                <polygon points="70,100 90,100 80,130" fill="#ffffff" />
                <polygon points="78,110 82,110 81,148 79,148" fill="#38bdf8" />

                <path d="M 42 110 Q 25 140 32 170" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" fill="none" />
                <circle cx="32" cy="170" r="6" fill="#f0b288" />

                <ellipse cx="80" cy="55" rx="38" ry="42" fill="#3d2314" />
                <ellipse cx="80" cy="60" rx="28" ry="34" fill="url(#tSkin)" />
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

            <div className="avatar-meta-info">
              <h3>Prof. Sophia</h3>
              <span className="live-status">{isPlaying ? '🎙️ Lecturing Live...' : '⏸️ MasterClass Paused'}</span>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="toc-card">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-cyan" />
              <span className="toc-title">Course Outline (All 9 Sections)</span>
            </div>
            <div className="toc-list">
              {FULL_LECTURE_SECTIONS.map((sec, idx) => (
                <button 
                  key={sec.id}
                  className={`toc-item ${idx === activeSectionIdx ? 'active' : ''}`}
                  onClick={() => playSectionSequentially(idx)}
                >
                  <span className="sec-index">0{sec.id}</span>
                  <span className="sec-name">{sec.title.replace(/^\d+\.\s*/, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ask Doubt Box */}
          <form className="doubt-box" onSubmit={handleAskDoubt}>
            <input 
              type="text" 
              placeholder="Interrupt professor with any doubt..." 
              value={studentQuestion}
              onChange={(e) => setStudentQuestion(e.target.value)}
            />
            <button type="submit"><Send size={14} /></button>
          </form>

          {qaLog.length > 0 && (
            <div className="qa-stream">
              {qaLog.map((item, i) => (
                <div key={i} className="qa-item">
                  <span className="q-txt">You: {item.q}</span>
                  <span className="a-txt">{item.a}</span>
                </div>
              ))}
            </div>
          )}

        </aside>

        {/* Right Side: The Full Long Continuous Blackboard Surface */}
        <main className="masterclass-blackboard-surface">
          
          {/* Static Diagram Panel 1: Vector Decomposition Static Diagram */}
          <div className="static-diagram-showcase">
            <div className="diagram-header">
              <Sparkles size={14} className="text-gold" />
              <span>Static Chalkboard Physics Diagrams</span>
            </div>

            <div className="diagrams-flex-row">
              {/* Diagram 1: Vector Decomposition Right Triangle */}
              <div className="diagram-card">
                <div className="diagram-title">Figure 1: Initial Velocity Vector Decomposition</div>
                <svg viewBox="0 0 280 140" className="static-diagram-svg">
                  <line x1="30" y1="110" x2="250" y2="110" stroke="#64748b" strokeWidth="2" />
                  <line x1="30" y1="110" x2="30" y2="20" stroke="#64748b" strokeWidth="2" />
                  {/* Right Triangle Dashes */}
                  <line x1="210" y1="110" x2="210" y2="30" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="30" y1="30" x2="210" y2="30" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
                  {/* Resultant Vector u */}
                  <line x1="30" y1="110" x2="210" y2="30" stroke="#fbbf24" strokeWidth="3" markerEnd="url(#goldArrow)" />
                  {/* Vector ux */}
                  <line x1="30" y1="110" x2="210" y2="110" stroke="#38bdf8" strokeWidth="3" />
                  {/* Vector uy */}
                  <line x1="30" y1="110" x2="30" y2="30" stroke="#34d399" strokeWidth="3" />
                  {/* Labels */}
                  <text x="90" y="125" fill="#38bdf8" fontSize="11" fontFamily="JetBrains Mono">ux = u·cos(θ)</text>
                  <text x="35" y="70" fill="#34d399" fontSize="11" fontFamily="JetBrains Mono">uy = u·sin(θ)</text>
                  <text x="110" y="60" fill="#fbbf24" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">Launch Vector u</text>
                  <path d="M 60 110 A 30 30 0 0 0 54 92" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="65" y="102" fill="#fbbf24" fontSize="10">θ</text>
                </svg>
              </div>

              {/* Diagram 2: Static Annotated Parabola with Vectors */}
              <div className="diagram-card">
                <div className="diagram-title">Figure 2: Complete Annotated Parabolic Trajectory</div>
                <svg viewBox="0 0 340 140" className="static-diagram-svg">
                  {/* Ground */}
                  <line x1="20" y1="120" x2="320" y2="120" stroke="#64748b" strokeWidth="2" />
                  {/* Parabolic Arc */}
                  <path d="M 30 120 Q 170 -10 310 120" fill="none" stroke="#38bdf8" strokeWidth="3" />
                  {/* Apex Height Line */}
                  <line x1="170" y1="120" x2="170" y2="25" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="170" cy="25" r="4" fill="#fbbf24" />
                  <text x="178" y="45" fill="#fbbf24" fontSize="10" fontFamily="JetBrains Mono">Apex (vy = 0)</text>
                  <text x="178" y="60" fill="#fbbf24" fontSize="10" fontFamily="JetBrains Mono">H_max = u²sin²θ / 2g</text>
                  {/* Constant vx Arrows */}
                  <line x1="30" y1="120" x2="65" y2="120" stroke="#38bdf8" strokeWidth="2.5" />
                  <line x1="170" y1="25" x2="205" y2="25" stroke="#38bdf8" strokeWidth="2.5" />
                  <text x="210" y="28" fill="#38bdf8" fontSize="10" fontFamily="JetBrains Mono">vx (const)</text>
                  {/* Range Label */}
                  <text x="240" y="135" fill="#38bdf8" fontSize="10" fontFamily="JetBrains Mono">Range R = u²sin(2θ)/g</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Full Long-Form Lecture Blackboard Sections */}
          <div className="lecture-sections-flow">
            {FULL_LECTURE_SECTIONS.map((sec, idx) => (
              <section 
                key={sec.id} 
                ref={el => sectionRefs.current[idx] = el}
                className={`lecture-section-block ${idx === activeSectionIdx ? 'current-active-section' : ''}`}
              >
                <div className="section-header-banner">
                  <span className="section-badge">Section 0{sec.id}</span>
                  <h3 className="section-title">{sec.title}</h3>
                </div>

                {/* Spoken Lecture Paragraph */}
                <div className="spoken-lecture-box">
                  <p>{sec.audio}</p>
                </div>

                {/* KaTeX Equations */}
                <div className="section-katex-container">
                  {sec.latex.map((_, i) => (
                    <div 
                      key={i} 
                      ref={el => mathRefs.current[`${sec.id}-${i}`] = el}
                      className="section-katex-line"
                    ></div>
                  ))}
                </div>

                {/* Chalk Teaching Notes */}
                <div className="section-chalk-notes">
                  {sec.notes.map((note, i) => (
                    <div key={i} className="chalk-note-item">
                      {note}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
