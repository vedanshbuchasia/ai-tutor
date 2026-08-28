import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Send,
  HelpCircle,
  Award,
  Volume2,
  VolumeX
} from 'lucide-react';

export const COMPREHENSIVE_COURSE = [
  {
    id: 1,
    title: "1. Introduction to 2D Kinematics & The Core Physical Model",
    category: "Foundations from Scratch",
    lecture_audio: "Hello students, and welcome to our comprehensive masterclass on 2D Projectile Kinematics! To learn this topic from scratch, let's first define what a projectile actually is. A projectile is any object that is launched into the air and then moves under the influence of gravity alone, with zero self-propulsion like a rocket or engine. Whether you throw a baseball, kick a soccer ball, or launch a cannon, they all follow the exact same fundamental laws of classical mechanics.",
    chalk_heading: "LESSON 1: WHAT IS A PROJECTILE? (FOUNDATIONS)",
    teaching_points: [
      {
        subtitle: "1. Definition of a Projectile",
        text: "An object thrown into space that continues in motion by its own inertia and is influenced solely by the downward acceleration of gravity."
      },
      {
        subtitle: "2. The 2D Coordinate System",
        text: "We set up a 2D Cartesian plane: the horizontal X-axis (ground distance) and the vertical Y-axis (altitude). All forces and vectors are decomposed onto these two axes."
      },
      {
        subtitle: "3. The Golden Theorem of Independence",
        text: "Motion in the horizontal direction and motion in the vertical direction are completely independent. What happens horizontally has ZERO influence on vertical gravity!"
      }
    ],
    latex_blocks: [
      "\\text{Definition: } \\vec{F}_{\\text{net}} = \\vec{F}_g = -mg\\,\\hat{j}",
      "\\vec{a} = 0\\,\\hat{i} - g\\,\\hat{j} \\implies a_x = 0, \\quad a_y = -9.8\\text{ m/s}^2"
    ],
    concept_quiz: "What is the only force acting on an ideal projectile once it leaves the launcher?"
  },
  {
    id: 2,
    title: "2. The Famous Independence of Motion (Bullet Drop Paradox)",
    category: "Physical Intuition",
    lecture_audio: "To truly understand why horizontal and vertical motions don't affect each other, let's explore a famous thought experiment. Imagine you are standing on a flat field holding two identical steel balls at the exact same height. You drop Ball A straight down, and at that exact same microsecond, you fire Ball B horizontally from a high-velocity cannon at 500 meters per second. Which ball hits the ground first? The surprising answer is that both balls hit the ground at the exact same millisecond!",
    chalk_heading: "LESSON 2: INDEPENDENCE OF PERPENDICULAR MOTIONS",
    teaching_points: [
      {
        subtitle: "1. The Bullet Drop Principle",
        text: "Because gravity pulls purely along the vertical Y-axis (ay = -g), it exerts zero horizontal force (ax = 0). The bullet's massive horizontal speed cannot prevent gravity from pulling it downward."
      },
      {
        subtitle: "2. Mathematical Decoupling",
        text: "We can treat any 2D trajectory problem as TWO completely separate 1D physics problems happening simultaneously: uniform velocity in X and constant acceleration in Y."
      },
      {
        subtitle: "3. Total Position Vector",
        text: "The position of the projectile at any time t is the vector sum of its horizontal displacement and vertical displacement."
      }
    ],
    latex_blocks: [
      "\\vec{r}(t) = x(t)\\,\\hat{i} + y(t)\\,\\hat{j}",
      "x(t) = v_x \\cdot t, \\quad y(t) = v_{y0} \\cdot t - \\frac{1}{2}gt^2"
    ],
    concept_quiz: "If you double the horizontal launch speed of a projectile, what happens to the time it takes to hit the floor?"
  },
  {
    id: 3,
    title: "3. Launch Geometry & Vector Decomposition",
    category: "Vector Trigonometry",
    lecture_audio: "When an object is launched with an initial speed u at an elevation angle theta relative to the ground, its initial velocity vector u points diagonally into the air. Before we can solve anything, we must decompose this diagonal vector into two perpendicular components using right-triangle trigonometry. Let's write out the cosine and sine components on the board.",
    chalk_heading: "LESSON 3: INITIAL VECTOR DECOMPOSITION",
    teaching_points: [
      {
        subtitle: "1. The Launch Right-Triangle",
        text: "The initial velocity vector u forms the hypotenuse of a right-angled triangle. The adjacent side is the horizontal velocity ux, and the opposite side is the vertical velocity uy0."
      },
      {
        subtitle: "2. Horizontal Component (ux)",
        text: "ux = u · cos(θ). This component governs how fast the object travels downfield. In a vacuum, ux never changes!"
      },
      {
        subtitle: "3. Vertical Component (uy0)",
        text: "uy0 = u · sin(θ). This component governs how high the object climbs and how long it stays airborne."
      }
    ],
    latex_blocks: [
      "u_x = u\\cos\\theta, \\quad u_{y0} = u\\sin\\theta",
      "|\\vec{u}| = \\sqrt{u_x^2 + u_{y0}^2}, \\quad \\tan\\theta = \\frac{u_{y0}}{u_x}"
    ],
    concept_quiz: "If a projectile is launched at 60 degrees, which component is larger: horizontal speed ux or vertical speed uy?"
  },
  {
    id: 4,
    title: "4. The 1D Horizontal Dimension (Inertial Coasting)",
    category: "1D Kinematic Equations",
    lecture_audio: "Now let's examine the horizontal X-dimension in detail. According to Newton's First Law of Motion, an object in motion will continue in motion with a constant velocity unless acted upon by an external net force. In ideal projectile motion with no air resistance, there is zero horizontal force. Therefore, horizontal acceleration ax is exactly zero, and horizontal speed vx remains constant from launch to landing.",
    chalk_heading: "LESSON 4: THE HORIZONTAL DIMENSION (ax = 0)",
    teaching_points: [
      {
        subtitle: "1. Zero Horizontal Acceleration",
        text: "ΣFx = 0  =>  ax = 0 m/s². There is no gravity or force in the horizontal direction."
      },
      {
        subtitle: "2. Constant Horizontal Velocity",
        text: "vx(t) = ux = u · cos(θ) = CONSTANT for all time t during flight."
      },
      {
        subtitle: "3. Linear Horizontal Distance",
        text: "Distance traveled in X grows linearly with time: x(t) = (u · cos θ) · t."
      }
    ],
    latex_blocks: [
      "a_x = 0 \\implies v_x(t) = u\\cos\\theta = \\text{const}",
      "x(t) = (u\\cos\\theta) \\cdot t"
    ],
    concept_quiz: "Does the horizontal speed of an ideal projectile increase, decrease, or stay the same as it flies?"
  },
  {
    id: 5,
    title: "5. The 1D Vertical Dimension (Gravitational Combat)",
    category: "1D Kinematic Equations",
    lecture_audio: "In stark contrast to the horizontal glide, the vertical Y-dimension is in a continuous battle with gravity. As the projectile climbs upward, Earth's gravitational acceleration of 9.8 meters per second squared acts downwards, constantly draining its vertical velocity. At the apex, vertical speed momentarily reaches zero before reversing direction and accelerating downwards.",
    chalk_heading: "LESSON 5: THE VERTICAL DIMENSION (ay = -g)",
    teaching_points: [
      {
        subtitle: "1. Constant Downward Acceleration",
        text: "ay = -g = -9.8 m/s². Gravity continuously pulls downward towards Earth's center."
      },
      {
        subtitle: "2. Vertical Velocity Equation",
        text: "vy(t) = uy0 - g·t = (u · sin θ) - g·t. Speed decreases by 9.8 m/s every second."
      },
      {
        subtitle: "3. Vertical Displacement Equation",
        text: "y(t) = (u · sin θ)·t - ½·g·t². This is a quadratic function of time."
      }
    ],
    latex_blocks: [
      "a_y = -g = -9.8\\text{ m/s}^2",
      "v_y(t) = u\\sin\\theta - gt, \\quad y(t) = (u\\sin\\theta)t - \\frac{1}{2}gt^2",
      "v_y^2 = (u\\sin\\theta)^2 - 2g \\cdot y"
    ],
    concept_quiz: "What is the value of vertical acceleration ay when the projectile is at the very highest point of its flight?"
  },
  {
    id: 6,
    title: "6. Apex Peak: Maximum Height & Time to Top",
    category: "Mathematical Derivations",
    lecture_audio: "Let's derive two of the most critical equations in physics: the time to reach the apex and the maximum height H max! At the exact top of the trajectory, the projectile stops rising for a single infinitesimal moment, meaning vertical velocity vy equals zero. Using our kinematic formulas, we can solve for t apex and H max algebraically.",
    chalk_heading: "LESSON 6: DERIVATION OF APEX TIME & H_MAX",
    teaching_points: [
      {
        subtitle: "1. The Apex Condition",
        text: "At maximum altitude H_max, vertical velocity vy = 0. (Note: horizontal velocity vx is still active!)"
      },
      {
        subtitle: "2. Solving for Time to Peak (t_apex)",
        text: "Setting vy = 0  =>  0 = u·sin(θ) - g·t_apex  =>  t_apex = (u · sin θ) / g."
      },
      {
        subtitle: "3. Deriving Maximum Height (H_max)",
        text: "Using vy² = uy0² - 2g·H_max with vy = 0  =>  H_max = (u² · sin²θ) / (2g)."
      }
    ],
    latex_blocks: [
      "v_y = 0 \\implies 0 = u\\sin\\theta - gt_{\\text{apex}} \\implies t_{\\text{apex}} = \\frac{u\\sin\\theta}{g}",
      "H_{\\max} = \\frac{(u\\sin\\theta)^2}{2g} = \\frac{u^2\\sin^2\\theta}{2g}"
    ],
    concept_quiz: "If you double the initial launch velocity u, by what factor does the maximum height H_max increase?"
  },
  {
    id: 7,
    title: "7. Total Time of Flight & Horizontal Range (45° Proof)",
    category: "Mathematical Derivations",
    lecture_audio: "Now let's derive the total time in the air and the horizontal range R! In a vacuum, projectile motion is completely symmetrical: the time to go up equals the time to come down, so total flight time T is double t apex. Multiplying this airtime by constant horizontal speed gives the range. Using trigonometry, we derive R equals u squared sine 2 theta over g, proving why 45 degrees yields maximum range.",
    chalk_heading: "LESSON 7: RANGE DERIVATION & 45° OPTIMIZATION",
    teaching_points: [
      {
        subtitle: "1. Total Airtime (T_total)",
        text: "Due to symmetry, T_total = 2 · t_apex = (2u · sin θ) / g."
      },
      {
        subtitle: "2. Horizontal Range Derivation",
        text: "R = vx · T_total = (u · cos θ) · [(2u · sin θ) / g] = [u² · (2 sin θ cos θ)] / g = (u² · sin 2θ) / g."
      },
      {
        subtitle: "3. The 45° Maximum Range Proof",
        text: "The sine function reaches its absolute peak of 1 at 90°. Since sin(2θ) = 1  =>  2θ = 90°  =>  θ = 45°! Thus, 45 degrees maximizes range in a vacuum."
      },
      {
        subtitle: "4. Complementary Angle Symmetry",
        text: "Any two launch angles that add up to 90° (like 30° and 60°, or 15° and 75°) produce the exact same horizontal range!"
      }
    ],
    latex_blocks: [
      "T_{\\text{total}} = \\frac{2u\\sin\\theta}{g}, \\quad R = \\frac{u^2\\sin(2\\theta)}{g}",
      "R_{\\max} = \\frac{u^2}{g} \\quad (\\text{at } \\theta = 45^\\circ)",
      "R(\\theta) = R(90^\\circ - \\theta)"
    ],
    concept_quiz: "A cannon fires at 20 degrees and lands 80 meters away. Which other angle will land at the exact same 80 meters?"
  },
  {
    id: 8,
    title: "8. The Trajectory Equation (Why Paths are Pure Parabolas)",
    category: "Mathematical Derivations",
    lecture_audio: "Why does every thrown object trace a parabola rather than a circle or ellipse? Let's prove it by eliminating the time parameter t between our horizontal and vertical equations. When we substitute t equals x over u cosine theta into the vertical displacement equation, we obtain y as a quadratic function of x: y equals A x minus B x squared, which is the exact mathematical definition of a parabola opening downwards!",
    chalk_heading: "LESSON 8: THE TRAJECTORY EQUATION",
    teaching_points: [
      {
        subtitle: "1. Eliminating Time (t)",
        text: "From horizontal motion: x = (u · cos θ)·t  =>  t = x / (u · cos θ)."
      },
      {
        subtitle: "2. Substituting into Vertical Equation",
        text: "y = (u · sin θ)·[x / (u · cos θ)] - ½·g·[x / (u · cos θ)]²."
      },
      {
        subtitle: "3. The Parabolic Equation",
        text: "y(x) = (tan θ)·x - [g / (2u²·cos²θ)]·x². This is of the form y = Ax - Bx², proving the path is a pure parabola."
      }
    ],
    latex_blocks: [
      "t = \\frac{x}{u\\cos\\theta} \\implies y(x) = (u\\sin\\theta)\\left(\\frac{x}{u\\cos\\theta}\\right) - \\frac{1}{2}g\\left(\\frac{x}{u\\cos\\theta}\\right)^2",
      "y(x) = (\\tan\\theta)x - \\frac{g}{2u^2\\cos^2\\theta}x^2 \\quad \\text{[Equation of Trajectory]}"
    ],
    concept_quiz: "In the trajectory equation y = Ax - Bx², what physical property does the term 'A' represent?"
  }
];

export default function ComprehensiveCourseClassroom() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [studentDoubt, setStudentDoubt] = useState('');
  const [doubtAnswers, setDoubtAnswers] = useState([]);
  
  const canvasRef = useRef(null);
  const formulaRefs = useRef({});
  const curr = COMPREHENSIVE_COURSE[currentIdx];

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

  // KaTeX rendering
  useEffect(() => {
    (curr.latex_blocks || []).forEach((latex, idx) => {
      const el = formulaRefs.current[idx];
      if (el) {
        try {
          katex.render(latex, el, { displayMode: true, throwOnError: false });
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, [currentIdx]);

  // Spoken lecture delivery
  const speakLesson = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(curr.lecture_audio);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      // Auto advance to next chapter
      if (currentIdx < COMPREHENSIVE_COURSE.length - 1) {
        setTimeout(() => setCurrentIdx(prev => prev + 1), 2500);
      }
    };
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    } else {
      speakLesson();
    }
  };

  const handleNext = () => {
    window.speechSynthesis?.cancel();
    setCurrentIdx(prev => Math.min(prev + 1, COMPREHENSIVE_COURSE.length - 1));
    setIsPlaying(false);
  };

  const handlePrev = () => {
    window.speechSynthesis?.cancel();
    setCurrentIdx(prev => Math.max(prev - 1, 0));
    setIsPlaying(false);
  };

  // Chalkboard Trajectory Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let t = 0;
    let animId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Blackboard grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      const originX = 180;
      const originY = 175;

      // Coordinate axes
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      // X Ground
      ctx.beginPath();
      ctx.moveTo(originX - 10, originY);
      ctx.lineTo(canvas.width - 20, originY);
      ctx.stroke();
      // Y Altitude
      ctx.beginPath();
      ctx.moveTo(originX, originY + 10);
      ctx.lineTo(originX, 20);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText("Y (Altitude, ay = -g)", originX + 8, 30);
      ctx.fillText("X (Distance, ax = 0)", canvas.width - 120, originY - 6);

      // Trajectory Math
      const v0 = 24;
      const angleRad = (currentIdx === 6 ? 45 : 35) * Math.PI / 180;
      const g = 9.8;
      const vx0 = v0 * Math.cos(angleRad);
      const vy0 = v0 * Math.sin(angleRad);
      const totalT = (2 * vy0) / g;
      const scale = 5.2;

      // Dashed theoretical path
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
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

      // Vector arrows (vx, vy)
      drawVector(ctx, curX, curY, curX + vx0 * 1.5, curY, '#38bdf8', 'vx [const]');
      drawVector(ctx, curX, curY, curX, curY - curVy * 1.5, '#34d399', 'vy');

      t += 0.025;
      if (t > totalT + 0.6) t = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentIdx]);

  const drawVector = (ctx, fromX, fromY, toX, toY, color, label) => {
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
    if (!studentDoubt.trim()) return;
    const q = studentDoubt;
    setDoubtAnswers(prev => [...prev, {
      question: q,
      answer: `Prof. Sophia: That's a great question regarding ${curr.title}! Let's review the fundamental physical mechanism: ${curr.teaching_points[0].text}`
    }]);
    setStudentDoubt('');
  };

  return (
    <div className="comprehensive-classroom-container">
      {/* Top Navbar */}
      <header className="classroom-top-nav">
        <div className="flex items-center gap-3">
          <GraduationCap size={24} className="text-gold" />
          <div>
            <h2 className="top-title">Kinematics 2D Comprehensive MasterClass</h2>
            <p className="top-sub">Full Curriculum Grounded in RAG & LLM • Chapter {currentIdx + 1} of {COMPREHENSIVE_COURSE.length}</p>
          </div>
        </div>

        {/* Master Play & Chapter Controls */}
        <div className="top-play-controls">
          <button className="btn-ch-nav" onClick={handlePrev} disabled={currentIdx === 0}>
            <SkipBack size={14} /> Previous
          </button>

          <button 
            className={`btn-master-play ${isPlaying ? 'is-playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'Pause Lecture' : '▶ Start / Listen to Class'}</span>
          </button>

          <button className="btn-ch-nav" onClick={handleNext} disabled={currentIdx === COMPREHENSIVE_COURSE.length - 1}>
            Next <SkipForward size={14} />
          </button>
        </div>
      </header>

      {/* Main Classroom Layout */}
      <div className="classroom-body-grid">
        
        {/* Left Sidebar: Lecture Transcript & All Chapters */}
        <aside className="classroom-sidebar-panel">
          
          {/* Active Professor Speech Box */}
          <div className="prof-speech-card">
            <div className="prof-header">
              <Sparkles size={14} className="text-cyan" />
              <span>Prof. Sophia (Lecturing Live)</span>
            </div>
            <p className="prof-audio-text">{curr.lecture_audio}</p>
          </div>

          {/* Socratic Concept Quiz */}
          <div className="socratic-quiz-card">
            <div className="quiz-header">
              <HelpCircle size={14} className="text-gold" />
              <span>Concept Check for Understanding</span>
            </div>
            <p className="quiz-question">{curr.concept_quiz}</p>
          </div>

          {/* Chapters Directory */}
          <div className="chapters-directory-card">
            <div className="dir-header">
              <BookOpen size={14} className="text-cyan" />
              <span>Complete Course Modules</span>
            </div>
            <div className="chapters-scroll-list">
              {COMPREHENSIVE_COURSE.map((mod, i) => (
                <button 
                  key={mod.id}
                  className={`chapter-btn ${i === currentIdx ? 'active-ch' : ''}`}
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setCurrentIdx(i);
                    setIsPlaying(false);
                  }}
                >
                  <span className="ch-num">{i + 1}.</span>
                  <span className="ch-name">{mod.title.replace(/^\d+\.\s*/, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Student Doubt Box */}
          <form className="doubt-input-form" onSubmit={handleAskDoubt}>
            <input 
              type="text" 
              placeholder="Ask any doubt about this topic..."
              value={studentDoubt}
              onChange={(e) => setStudentDoubt(e.target.value)}
            />
            <button type="submit" className="btn-ask"><Send size={14} /></button>
          </form>

          {doubtAnswers.length > 0 && (
            <div className="doubts-history">
              {doubtAnswers.map((d, i) => (
                <div key={i} className="doubt-item">
                  <span className="d-q">You: {d.question}</span>
                  <span className="d-a">{d.answer}</span>
                </div>
              ))}
            </div>
          )}

        </aside>

        {/* Right Blackboard: The Full Detailed Teaching Surface */}
        <main className="classroom-chalkboard-surface">
          
          {/* Blackboard Title */}
          <div className="chalkboard-topic-header">
            <span className="chalkboard-main-title">{curr.chalk_heading}</span>
            <span className="chalkboard-status">{isPlaying ? '🎙️ Explaining Live & Writing Notes' : '⏸️ Ready (Click Start)'}</span>
          </div>

          {/* Canvas with Standing Teacher Avatar */}
          <div className="chalkboard-canvas-box">
            <canvas ref={canvasRef} width={820} height={180} className="chalkboard-canvas-el" />

            {/* In-Scene Teacher Avatar */}
            <div className="chalkboard-avatar-svg">
              <svg viewBox="0 0 160 260" width="130" height="180">
                <defs>
                  <radialGradient id="faceGrad" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#ffdfc4" />
                    <stop offset="100%" stopColor="#f0b288" />
                  </radialGradient>
                  <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                <polygon points="45,170 115,170 125,250 35,250" fill="#0f172a" />
                <ellipse cx="55" cy="255" rx="14" ry="4" fill="#000" />
                <ellipse cx="105" cy="255" rx="14" ry="4" fill="#000" />

                <path d="M 38 175 L 42 110 L 62 100 L 98 100 L 118 110 L 122 175 Z" fill="url(#suitGrad)" />
                <polygon points="70,100 90,100 80,130" fill="#ffffff" />
                <polygon points="78,110 82,110 81,148 79,148" fill="#38bdf8" />

                <path d="M 42 110 Q 25 140 32 170" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" fill="none" />
                <circle cx="32" cy="170" r="6" fill="#f0b288" />

                <ellipse cx="80" cy="55" rx="38" ry="42" fill="#3d2314" />
                <ellipse cx="80" cy="60" rx="28" ry="34" fill="url(#faceGrad)" />
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

          {/* Mathematical Derivations & Chalk Explanations */}
          <div className="chalkboard-detailed-notes">
            
            {/* KaTeX Formulas */}
            <div className="katex-formulas-card">
              {(curr.latex_blocks || []).map((_, i) => (
                <div key={i} ref={el => formulaRefs.current[i] = el} className="chalk-math-line"></div>
              ))}
            </div>

            {/* Detailed Conceptual Bullet Points */}
            <div className="teaching-points-grid">
              {(curr.teaching_points || []).map((pt, i) => (
                <div key={i} className="teaching-point-card">
                  <h4 className="point-subtitle">{pt.subtitle}</h4>
                  <p className="point-text">{pt.text}</p>
                </div>
              ))}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
