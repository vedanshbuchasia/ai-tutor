import React, { useEffect, useState } from 'react';

export default function AnimatedTeacherAvatar({ isSpeaking, currentAction }) {
  const [mouthOpen, setMouthOpen] = useState(0); // 0 (closed) to 1 (open)
  const [blink, setBlink] = useState(false);
  const [handGesture, setHandGesture] = useState('point_right'); // 'point_right' | 'explain' | 'rest'

  // Lip-sync animation when speaking
  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthOpen(Math.random() > 0.3 ? Math.random() * 0.8 + 0.2 : 0.05);
      }, 120);
    } else {
      setMouthOpen(0.05);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Natural blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="animated-teacher-container">
      <div className={`avatar-svg-box ${isSpeaking ? 'active-lecturing' : ''}`}>
        <svg viewBox="0 0 160 180" className="teacher-svg" width="100%" height="100%">
          <defs>
            <radialGradient id="faceGrad" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#ffdfc4" />
              <stop offset="100%" stopColor="#f0b288" />
            </radialGradient>
            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a2e18" />
              <stop offset="100%" stopColor="#2c1a0e" />
            </linearGradient>
          </defs>

          {/* Torso & Professor Suit */}
          <path d="M 30 180 L 35 125 L 60 115 L 100 115 L 125 125 L 130 180 Z" fill="url(#suitGrad)" />
          {/* Shirt & Tie */}
          <polygon points="70,115 90,115 80,145" fill="#ffffff" />
          <polygon points="77,125 83,125 81,165 79,165" fill="#38bdf8" />

          {/* Neck */}
          <rect x="70" y="95" width="20" height="25" fill="#e0a37e" rx="3" />

          {/* Hair Back */}
          <ellipse cx="80" cy="65" rx="42" ry="46" fill="url(#hairGrad)" />

          {/* Head */}
          <ellipse cx="80" cy="70" rx="32" ry="38" fill="url(#faceGrad)" />

          {/* Hair Front / Bangs */}
          <path d="M 46 55 Q 80 30 114 55 Q 98 48 80 50 Q 62 48 46 55 Z" fill="url(#hairGrad)" />

          {/* Glasses Frame */}
          <circle cx="66" cy="66" r="11" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="94" cy="66" r="11" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" />
          <line x1="77" y1="66" x2="83" y2="66" stroke="#38bdf8" strokeWidth="2" />

          {/* Eyes (Blinking) */}
          {blink ? (
            <>
              <line x1="60" y1="66" x2="72" y2="66" stroke="#2c1a0e" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="88" y1="66" x2="100" y2="66" stroke="#2c1a0e" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="66" cy="66" r="4.5" fill="#1e293b" />
              <circle cx="94" cy="66" r="4.5" fill="#1e293b" />
              <circle cx="64.5" cy="64.5" r="1.5" fill="#ffffff" />
              <circle cx="92.5" cy="64.5" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Eyebrows */}
          <path d="M 58 52 Q 66 48 74 52" stroke="#2c1a0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 86 52 Q 94 48 102 52" stroke="#2c1a0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />

          {/* Nose */}
          <path d="M 80 66 L 77 77 L 83 77" stroke="#d4916a" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* Dynamic Animated Mouth (Lip-Sync) */}
          <ellipse 
            cx="80" 
            cy="88" 
            rx={Math.max(4, 7 * mouthOpen + 3)} 
            ry={Math.max(1.5, 6 * mouthOpen + 1)} 
            fill="#8b2635" 
            stroke="#c95061" 
            strokeWidth="1.2"
          />
          {mouthOpen > 0.3 && (
            <rect x="76" y="86" width="8" height="2" fill="#ffffff" rx="1" />
          )}

          {/* Gesturing Hand (Pointing to Whiteboard on Right) */}
          <g className="pointing-hand-anim">
            <path d="M 125 125 Q 145 105 155 90" stroke="#0f172a" strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="155" cy="90" r="6" fill="#f0b288" />
            <line x1="155" y1="90" x2="162" y2="82" stroke="#f0b288" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>

        {/* Glow speech indicator */}
        {isSpeaking && <div className="avatar-speech-glow"></div>}
      </div>

      <div className="teacher-badge-info">
        <span className="teacher-name">Prof. Sophia</span>
        <span className="teacher-status">{isSpeaking ? '🎙️ Explaining Concept...' : '👂 Listening to you'}</span>
      </div>
    </div>
  );
}
