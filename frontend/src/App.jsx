import React, { useState, useEffect } from 'react';
import ClassroomSidebar from './ClassroomSidebar';
import ClassroomBlackboard from './ClassroomBlackboard';
import { 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  Key, 
  BookOpen, 
  Sparkles, 
  Layers,
  ChevronRight
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const COURSE_CHAPTERS = [
  { id: 0, title: "1. Vector Decomposition in 2D", status: "completed" },
  { id: 1, title: "2. Constant Horizontal Velocity (ax = 0)", status: "current" },
  { id: 2, title: "3. Vertical Deceleration & Apex Height", status: "locked" },
  { id: 3, title: "4. Total Time of Flight & Max Range", status: "locked" },
  { id: 4, title: "5. Aerodynamic Drag & Relative Velocity", status: "locked" }
];

export default function App() {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [activeBoardTab, setActiveBoardTab] = useState('lab'); // 'theory' | 'lab' | 'diagram'
  
  const [tutorState, setTutorState] = useState({
    spoken_dialogue: "Welcome to today's MIT-style visual physics lecture on Kinematics and 2D Projectiles! On Board B, we are simulating a projectile in real-time. Notice how the horizontal cyan vector vx remains perfectly constant, while the vertical emerald vector vy decelerates under gravity. Let's analyze what happens at maximum height.",
    frame_to_display: "frame_005.jpg",
    math_latex: "a_x = 0 \\implies v_x = u\\cos\\theta, \\quad y(t) = (u\\sin\\theta)t - \\frac{1}{2}gt^2",
    concept_question: "Can horizontal motion affect the time it takes for a projectile to fall to the ground, or are x and y completely independent?",
    action_type: "TEACH",
    lecture_topic: "2D Projectile Kinematics & Trajectory Parabola"
  });

  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Initial welcome
    handleSendMessage("start", true);
  }, []);

  const speakText = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (text, isSilent = false) => {
    if (!text.trim() && !isSilent) return;

    if (!isSilent) {
      setChatLog(prev => [...prev, { sender: 'student', text }]);
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: text,
          current_step: currentChapter,
          conversation_history: chatLog,
          api_key: apiKey
        })
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      
      setTutorState(data);
      if (typeof data.step_index === 'number') {
        setCurrentChapter(data.step_index);
      }

      setChatLog(prev => [...prev, {
        sender: 'tutor',
        dialogue: data.spoken_dialogue,
        question: data.concept_question,
        action: data.action_type
      }]);

      if (speechEnabled && data.spoken_dialogue) {
        speakText(data.spoken_dialogue);
      }
    } catch (err) {
      console.warn("API offline fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey) return;
    try {
      await fetch(`${API_BASE}/set_api_key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      });
      setShowKeyModal(false);
      handleSendMessage("Connect Gemini LLM tutor");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="classroom-app-container">
      {/* Top University Lecture Hall Navigation Bar */}
      <header className="lecture-hall-navbar">
        <div className="nav-course-brand">
          <div className="university-crest">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2>PHYS 101: Classical Mechanics & Kinematics</h2>
            <div className="course-status-pill">
              <span className="live-dot"></span>
              <span>LIVE LECTURE HALL • Prof. Sophia presiding</span>
            </div>
          </div>
        </div>

        {/* Chapter Progression Tree */}
        <div className="chapter-progress-bar">
          {COURSE_CHAPTERS.map((ch, idx) => (
            <div 
              key={ch.id} 
              className={`chapter-node ${idx === currentChapter ? 'current' : ''} ${idx < currentChapter ? 'done' : ''}`}
              onClick={() => {
                setCurrentChapter(idx);
                handleSendMessage(`Teach chapter: ${ch.title}`);
              }}
            >
              <span className="chapter-index">{idx + 1}</span>
              <span className="chapter-name">{ch.title.split('.')[1]}</span>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="hall-controls">
          <button 
            className="control-btn"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <Key size={16} /> API Key
          </button>
          <button 
            className={`control-btn ${speechEnabled ? 'voice-on' : ''}`}
            onClick={() => {
              const next = !speechEnabled;
              setSpeechEnabled(next);
              if (next && tutorState.spoken_dialogue) speakText(tutorState.spoken_dialogue);
              else window.speechSynthesis?.cancel();
            }}
            title={speechEnabled ? "Voice Enabled" : "Enable Voice"}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Voice {speechEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {/* Main Classroom Layout (Left: Sidebar / Peers / Dialogue, Right: Multi-Board Smartboard) */}
      <div className="classroom-main-grid">
        <ClassroomSidebar 
          tutorDialogue={tutorState.spoken_dialogue}
          conceptQuestion={tutorState.concept_question}
          actionType={tutorState.action_type}
          isSpeaking={isSpeaking}
          chatLog={chatLog}
          onSendMessage={handleSendMessage}
          loading={loading}
        />

        <ClassroomBlackboard 
          activeTab={activeBoardTab}
          setActiveTab={setActiveBoardTab}
          mathLatex={tutorState.math_latex}
          frameToDisplay={tutorState.frame_to_display}
          apiBase={API_BASE}
          lectureTopic={tutorState.lecture_topic}
        />
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>🔑 Configure Google Gemini API Key</h3>
            <p>Connect your Gemini API Key for dynamic multi-turn Socratic reasoning and cloud vector embeddings:</p>
            <input 
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="key-input"
            />
            <div className="modal-btn-row">
              <button className="btn-cancel" onClick={() => setShowKeyModal(false)}>Cancel</button>
              <button className="btn-save" onClick={saveApiKey}>Save & Activate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
