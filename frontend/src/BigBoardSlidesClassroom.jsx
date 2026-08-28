import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Sparkles, 
  GraduationCap 
} from 'lucide-react';

const LECTURE_SLIDES = [
  {
    slide_num: 1,
    title: "1. What is a Projectile? The Core Physical Model",
    category: "Foundations from Scratch",
    speech: "Welcome to our Kinematics MasterClass! Let's start from absolute scratch: what is a projectile? A projectile is any object launched into space upon which the only acting force is Earth's downward gravity. We define a 2D Cartesian plane: the horizontal X-axis represents ground distance, and the vertical Y-axis represents altitude. The golden rule is that horizontal and vertical motions are completely independent.",
    chalk_heading: "CORE MODEL: 2D CARTESIAN PLANE & GRAVITY ONLY",
    notes: [
      "• Net Force: Only downward gravity acts on the body (F_net = -mg ĵ).",
      "• Acceleration Vector: ax = 0 m/s² horizontally, ay = -9.8 m/s² vertically.",
      "• Decoupled Motion: What happens in X has zero influence on what happens in Y."
    ],
    latex: [
      "\\vec{F}_{\\text{net}} = -mg\\,\\hat{j} \\implies \\vec{a} = 0\\,\\hat{i} - g\\,\\hat{j}",
      "a_x = 0, \\quad a_y = -9.8\\text{ m/s}^2"
    ],
    diagram_type: "COORDINATE_AXES"
  },
  {
    slide_num: 2,
    title: "2. The Independence of Motion (Bullet Drop Paradox)",
    category: "Physical Intuition",
    speech: "Why are horizontal and vertical motions independent? Consider this thought experiment: if you drop a ball straight down while firing a high-speed bullet horizontally at 500 meters per second from the exact same height, both hit the floor at the exact same millisecond! Because gravity acts purely downward, horizontal velocity has zero ability to delay gravitational free fall.",
    chalk_heading: "THE BULLET DROP THEOREM: ay = -g ACTS EQUALLY ON ALL BODIES",
    notes: [
      "• Gravity pulls purely downward on the Y-axis.",
      "• Horizontal speed moves the bullet downfield by inertia without resisting gravity.",
      "• We analyze 2D projectile motion as two independent 1D problems."
    ],
    latex: [
      "\\vec{r}(t) = x(t)\\,\\hat{i} + y(t)\\,\\hat{j}",
      "x(t) = v_x \\cdot t, \\quad y(t) = v_{y0} \\cdot t - \\frac{1}{2}gt^2"
    ],
    diagram_type: "INDEPENDENCE"
  },
  {
    slide_num: 3,
    title: "3. Launch Geometry & Vector Decomposition",
    category: "Vector Trigonometry",
    speech: "When launched at speed u at an elevation angle theta above the ground, the initial velocity vector u points diagonally into the air. Using right-triangle trigonometry, we decompose u into a horizontal component ux equal to u cosine theta, and an initial vertical component uy0 equal to u sine theta.",
    chalk_heading: "ORTHOGONAL VELOCITY VECTOR DECOMPOSITION",
    notes: [
      "• Horizontal Component: ux = u · cos(θ) [Constant forward speed].",
      "• Vertical Component: uy0 = u · sin(θ) [Determines altitude & airtime].",
      "• Total Speed Magnitude: |v| = √(vx² + vy²)."
    ],
    latex: [
      "u_x = u\\cos\\theta, \\quad u_{y0} = u\\sin\\theta",
      "|\\vec{u}| = \\sqrt{u_x^2 + u_{y0}^2}, \\quad \\tan\\theta = \\frac{u_{y0}}{u_x}"
    ],
    diagram_type: "VECTOR_TRIANGLE"
  },
  {
    slide_num: 4,
    title: "4. The 1D Horizontal Dimension (Inertial Coasting)",
    category: "1D Kinematic Equations",
    speech: "Looking closely at the horizontal dimension: by Newton's First Law, an object in motion remains in motion with constant velocity unless acted upon by a net force. In ideal projectile motion with no air resistance, horizontal acceleration ax is exactly zero. Thus, horizontal velocity vx never speeds up or slows down—it remains constant from launch to landing.",
    chalk_heading: "HORIZONTAL KINEMATICS: ax = 0 => vx = CONSTANT",
    notes: [
      "• Zero Horizontal Force: ΣFx = 0 => ax = 0 m/s².",
      "• Constant Velocity: vx(t) = ux = u · cos(θ) = CONSTANT.",
      "• Linear Displacement: x(t) = (u · cos θ) · t."
    ],
    latex: [
      "a_x = 0 \\implies v_x(t) = u\\cos\\theta = \\text{constant}",
      "x(t) = (u\\cos\\theta) \\cdot t"
    ],
    diagram_type: "HORIZONTAL_AXIS"
  },
  {
    slide_num: 5,
    title: "5. The 1D Vertical Dimension (Gravitational Combat)",
    category: "1D Kinematic Equations",
    speech: "In the vertical direction, the projectile is in continuous combat with Earth's gravity. As it climbs, gravity drains its vertical speed by 9.8 meters per second every second until it reaches zero at the peak. Then gravity accelerates it back downward toward the ground.",
    chalk_heading: "VERTICAL KINEMATICS: ay = -g => CONSTANT DECELERATION",
    notes: [
      "• Downward Acceleration: ay = -g = -9.8 m/s².",
      "• Vertical Velocity: vy(t) = uy0 - gt = (u · sin θ) - gt.",
      "• Vertical Altitude: y(t) = (u · sin θ)·t - ½gt²."
    ],
    latex: [
      "a_y = -g = -9.8\\text{ m/s}^2",
      "v_y(t) = u\\sin\\theta - gt, \\quad y(t) = (u\\sin\\theta)t - \\frac{1}{2}gt^2",
      "v_y^2 = (u\\sin\\theta)^2 - 2gy"
    ],
    diagram_type: "VERTICAL_AXIS"
  },
  {
    slide_num: 6,
    title: "6. Apex Peak: Maximum Height & Time to Top",
    category: "Mathematical Derivations",
    speech: "Let's derive the time to reach the top and the maximum height H max. At the apex, the projectile momentarily stops rising, meaning vertical velocity vy equals zero. Setting vy to zero gives the time to apex as u sine theta over g. Substituting this into the altitude equation yields maximum height equals u squared sine squared theta over 2g.",
    chalk_heading: "APEX DERIVATION: vy = 0 => t_apex = (u·sin θ)/g, H_max = (u²·sin²θ)/2g",
    notes: [
      "• Apex Condition: vy = 0 at maximum altitude (vx is still active!).",
      "• Time to Peak: t_apex = (u · sin θ) / g.",
      "• Maximum Height: H_max = (u² · sin²θ) / (2g)."
    ],
    latex: [
      "v_y = 0 \\implies 0 = u\\sin\\theta - gt_{\\text{apex}} \\implies t_{\\text{apex}} = \\frac{u\\sin\\theta}{g}",
      "H_{\\max} = \\frac{(u\\sin\\theta)^2}{2g} = \\frac{u^2\\sin^2\\theta}{2g}"
    ],
    diagram_type: "TRAJECTORY_PARABOLA"
  },
  {
    slide_num: 7,
    title: "7. Total Flight Time, Horizontal Range & 45° Optimization Proof",
    category: "Mathematical Derivations",
    speech: "Because vacuum trajectory is symmetrical, total flight time T is double the time to apex. Range R is horizontal speed times total airtime. Using the trigonometric identity 2 sine theta cosine theta equals sine 2 theta, we get range equals u squared sine 2 theta over g. Because sine 2 theta reaches its maximum of 1 at 90 degrees, 45 degrees yields maximum range!",
    chalk_heading: "RANGE DERIVATION: R = (u²·sin 2θ)/g => MAXIMIZED AT θ = 45°",
    notes: [
      "• Total Airtime: T_total = 2 · t_apex = (2u · sin θ) / g.",
      "• Range Derivation: R = vx · T_total = (u · cos θ) · [(2u · sin θ)/g] = (u² · sin 2θ) / g.",
      "• 45° Proof: sin(2θ) is maximum at 2θ = 90° => θ = 45° (R_max = u²/g).",
      "• Complementary Symmetry: Any two angles that add to 90° (e.g. 30° & 60°) land at identical range!"
    ],
    latex: [
      "T_{\\text{total}} = \\frac{2u\\sin\\theta}{g}, \\quad R = \\frac{u^2\\sin(2\\theta)}{g}",
      "R_{\\max} = \\frac{u^2}{g} \\quad (\\text{at } \\theta = 45^\\circ)",
      "R(\\theta) = R(90^\\circ - \\theta)"
    ],
    diagram_type: "TRAJECTORY_PARABOLA"
  },
  {
    slide_num: 8,
    title: "8. The Trajectory Equation (Why Paths are Pure Parabolas)",
    category: "Mathematical Derivations",
    speech: "Why does every thrown object trace a parabola? We prove it by eliminating the time parameter t. From horizontal motion, t equals x over u cosine theta. Substituting this into the vertical equation gives y as a quadratic function of x: y equals tan theta times x minus g over 2 u squared cosine squared theta times x squared. This is the exact equation of a parabola!",
    chalk_heading: "THE TRAJECTORY EQUATION: y(x) = (tan θ)x - [g / (2u²·cos²θ)]x²",
    notes: [
      "• Eliminate Time (t): t = x / (u · cos θ).",
      "• Substitute into y(t): y = (u · sin θ)·[x/(u · cos θ)] - ½·g·[x/(u · cos θ)]².",
      "• Trajectory Equation: y(x) = (tan θ)·x - [g / (2u²·cos²θ)]·x².",
      "• Quadratic Form: y = Ax - Bx² (A pure parabola opening downwards)."
    ],
    latex: [
      "t = \\frac{x}{u\\cos\\theta} \\implies y(x) = (\\tan\\theta)x - \\frac{g}{2u^2\\cos^2\\theta}x^2",
      "y(x) = Ax - Bx^2 \\quad \\text{[Pure Parabola]}"
    ],
    diagram_type: "TRAJECTORY_PARABOLA"
  }
];

export default function BigBoardSlidesClassroom() {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);

  const mathRefs = useRef({});
  const currSlide = LECTURE_SLIDES[currentSlideIdx];

  // Lip-sync for teacher avatar
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

  // KaTeX formula rendering
  useEffect(() => {
    (currSlide.latex || []).forEach((latexStr, i) => {
      const el = mathRefs.current[i];
      if (el) {
        try {
          katex.render(latexStr, el, { displayMode: true, throwOnError: false });
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, [currentSlideIdx]);

  // Automatic speech & slide changing pipeline
  const playSlideSequentially = (slideIdx) => {
    if (slideIdx >= LECTURE_SLIDES.length) {
      setIsPlaying(false);
      return;
    }

    setCurrentSlideIdx(slideIdx);

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const slide = LECTURE_SLIDES[slideIdx];
    const utterance = new SpeechSynthesisUtterance(slide.speech);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      // Automatically advance to next slide!
      setTimeout(() => {
        playSlideSequentially(slideIdx + 1);
      }, 1500);
    };
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStartClass = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    } else {
      playSlideSequentially(currentSlideIdx);
    }
  };

  const handleRestart = () => {
    window.speechSynthesis?.cancel();
    playSlideSequentially(0);
  };

  const handleNext = () => {
    window.speechSynthesis?.cancel();
    const next = Math.min(currentSlideIdx + 1, LECTURE_SLIDES.length - 1);
    setCurrentSlideIdx(next);
    setIsPlaying(false);
  };

  const handlePrev = () => {
    window.speechSynthesis?.cancel();
    const prev = Math.max(currentSlideIdx - 1, 0);
    setCurrentSlideIdx(prev);
    setIsPlaying(false);
  };

  // Render Static Physics SVG Diagrams based on slide
  const renderStaticDiagram = (type) => {
    if (type === "VECTOR_TRIANGLE") {
      return (
        <svg viewBox="0 0 340 150" className="static-chalk-diagram">
          <line x1="40" y1="120" x2="280" y2="120" stroke="#64748b" strokeWidth="2" />
          <line x1="40" y1="120" x2="40" y2="30" stroke="#64748b" strokeWidth="2" />
          {/* Dashed Projection */}
          <line x1="240" y1="120" x2="240" y2="40" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="40" y1="40" x2="240" y2="40" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Vector u */}
          <line x1="40" y1="120" x2="240" y2="40" stroke="#fbbf24" strokeWidth="3.5" />
          {/* Vector ux */}
          <line x1="40" y1="120" x2="240" y2="120" stroke="#38bdf8" strokeWidth="3.5" />
          {/* Vector uy */}
          <line x1="40" y1="120" x2="40" y2="40" stroke="#34d399" strokeWidth="3.5" />
          {/* Labels */}
          <text x="110" y="138" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">ux = u·cos(θ) [Constant]</text>
          <text x="45" y="80" fill="#34d399" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">uy = u·sin(θ)</text>
          <text x="130" y="70" fill="#fbbf24" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono">Launch Velocity u</text>
          <path d="M 75 120 A 35 35 0 0 0 68 98" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <text x="82" y="110" fill="#fbbf24" fontSize="12" fontWeight="bold">θ</text>
        </svg>
      );
    }

    if (type === "TRAJECTORY_PARABOLA") {
      return (
        <svg viewBox="0 0 380 150" className="static-chalk-diagram">
          <line x1="30" y1="125" x2="350" y2="125" stroke="#64748b" strokeWidth="2" />
          {/* Parabolic Curve */}
          <path d="M 40 125 Q 190 -10 340 125" fill="none" stroke="#38bdf8" strokeWidth="3.5" />
          {/* Apex Height Line */}
          <line x1="190" y1="125" x2="190" y2="28" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="190" cy="28" r="5" fill="#fbbf24" />
          <text x="198" y="45" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">Apex (vy = 0)</text>
          <text x="198" y="60" fill="#fbbf24" fontSize="11" fontFamily="JetBrains Mono">H_max = u²sin²θ / 2g</text>
          {/* Constant vx vectors */}
          <line x1="40" y1="125" x2="80" y2="125" stroke="#38bdf8" strokeWidth="3" />
          <line x1="190" y1="28" x2="230" y2="28" stroke="#38bdf8" strokeWidth="3" />
          <text x="235" y="32" fill="#38bdf8" fontSize="11" fontFamily="JetBrains Mono">vx (const)</text>
          {/* Range */}
          <text x="260" y="142" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">Range R = u²sin(2θ)/g</text>
        </svg>
      );
    }

    // Default Coordinate Axes Setup
    return (
      <svg viewBox="0 0 320 140" className="static-chalk-diagram">
        <line x1="40" y1="110" x2="290" y2="110" stroke="#64748b" strokeWidth="2" />
        <line x1="40" y1="110" x2="40" y2="20" stroke="#64748b" strokeWidth="2" />
        <text x="50" y="35" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">Y-Axis (Altitude, ay = -9.8 m/s²)</text>
        <text x="170" y="128" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">X-Axis (Distance, ax = 0)</text>
        {/* Gravity vector arrow */}
        <line x1="150" y1="45" x2="150" y2="90" stroke="#f43f5e" strokeWidth="3" />
        <polygon points="146,85 154,85 150,95" fill="#f43f5e" />
        <text x="160" y="70" fill="#f43f5e" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">Gravity g = 9.8 m/s² (Down)</text>
      </svg>
    );
  };

  return (
    <div className="big-board-master-container">
      {/* Top Blackboard Wooden Header Bar */}
      <header className="big-board-header">
        <div className="flex items-center gap-3">
          <GraduationCap size={26} className="text-gold" />
          <div>
            <h1 className="board-main-title">Kinematics 2D MasterClass (Full Automatic Lecture)</h1>
            <p className="board-subtitle">Slide {currentSlideIdx + 1} of {LECTURE_SLIDES.length}: {currSlide.title}</p>
          </div>
        </div>

        {/* Global Class Play / Auto-Advance Controls */}
        <div className="board-header-controls">
          <button className="btn-board-nav" onClick={handlePrev} disabled={currentSlideIdx === 0}>
            <SkipBack size={15} /> Prev Slide
          </button>

          <button className="btn-board-nav" onClick={handleRestart}>
            <RotateCcw size={15} /> Restart
          </button>

          <button 
            className={`btn-master-autoplay ${isPlaying ? 'auto-playing' : ''}`}
            onClick={handleStartClass}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'Pause Lecture' : '▶ Start Automatic Lecture'}</span>
          </button>

          <button className="btn-board-nav" onClick={handleNext} disabled={currentSlideIdx === LECTURE_SLIDES.length - 1}>
            Next Slide <SkipForward size={15} />
          </button>
        </div>
      </header>

      {/* The Single Big Blackboard Stage */}
      <main className="big-blackboard-stage">
        
        {/* Left Side of Blackboard: Animated Teacher Avatar */}
        <div className="big-board-avatar-section">
          <div className="teacher-avatar-frame">
            <svg viewBox="0 0 160 260" width="130" height="200">
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

          <div className="teacher-info-box">
            <h3>Prof. Sophia</h3>
            <span className="speech-status">{isPlaying ? '🎙️ Lecturing Live...' : '⏸️ Paused (Click Start)'}</span>
          </div>
        </div>

        {/* Center/Main Blackboard Area: Current Active Slide */}
        <div className="big-board-slide-content">
          
          {/* Top Banner on Blackboard */}
          <div className="slide-top-banner">
            <span className="slide-number-pill">SLIDE 0{currSlide.slide_num}</span>
            <span className="slide-heading-text">{currSlide.chalk_heading}</span>
          </div>

          {/* Slide Teacher Speech Dialogue Box */}
          <div className="slide-speech-text-card">
            <p className="speech-quote">"{currSlide.speech}"</p>
          </div>

          {/* Middle Row: KaTeX Formulas + Static Physics Diagram */}
          <div className="slide-middle-grid">
            
            {/* KaTeX Formulas Box */}
            <div className="slide-formulas-card">
              <div className="card-label">MATHEMATICAL FORMULATION</div>
              {(currSlide.latex || []).map((_, i) => (
                <div key={i} ref={el => mathRefs.current[i] = el} className="chalk-katex-render"></div>
              ))}
            </div>

            {/* Static Physics Diagram */}
            <div className="slide-diagram-card">
              <div className="card-label">CHALKBOARD DIAGRAM</div>
              {renderStaticDiagram(currSlide.diagram_type)}
            </div>

          </div>

          {/* Bottom Row: Detailed Chalk Teaching Bullet Points */}
          <div className="slide-bullet-points-card">
            <div className="card-label">KEY CONCEPTUAL TAKEAWAYS</div>
            <div className="chalk-bullets-list">
              {currSlide.notes.map((note, i) => (
                <div key={i} className="chalk-bullet-row">
                  {note}
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Slide Progress Indicator */}
      <footer className="big-board-footer-progress">
        <div className="slide-dots-row">
          {LECTURE_SLIDES.map((s, idx) => (
            <button
              key={s.slide_num}
              className={`slide-dot-btn ${idx === currentSlideIdx ? 'active-dot' : ''}`}
              onClick={() => playSlideSequentially(idx)}
              title={s.title}
            >
              <span>{s.slide_num}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
