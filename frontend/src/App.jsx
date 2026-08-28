import React, { useState, useEffect } from 'react';
import AnimatedTeacherAvatar from './AnimatedTeacherAvatar';
import ManimStyleWhiteboard from './ManimStyleWhiteboard';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Key, 
  User, 
  Layers, 
  Award,
  Send,
  HelpCircle,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';
const CURRENT_USER_ID = 'vedansh_student';
const CURRENT_USER_NAME = 'Vedansh';

export default function App() {
  const [userProfile, setUserProfile] = useState({
    user_id: CURRENT_USER_ID,
    name: CURRENT_USER_NAME,
    mastery_score: 25,
    current_topic_index: 0,
    completed_topics: [],
    doubts_logged: []
  });

  const [tutorState, setTutorState] = useState({
    spoken_dialogue: "Hello Vedansh! Welcome to your personal 1-on-1 Kinematics coaching. Look at the animation on our whiteboard: observe how the initial launch velocity splits into independent horizontal and vertical vector components.",
    whiteboard: {
      action_name: "VECTOR_DECOMPOSITION",
      math_latex: "\\vec{r}(t) = (u\\cos\\theta)t\\hat{i} + ((u\\sin\\theta)t - \\frac{1}{2}gt^2)\\hat{j}",
      velocity: 25,
      angle: 45,
      gravity: 9.8,
      annotation_text: "Vector Decomposition"
    },
    concept_question: "Are the horizontal and vertical motions independent of each other in 2D projectile flight?",
    action_type: "TEACH",
    rag_topic: "2D Vector Decomposition"
  });

  const [inputVal, setInputVal] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // 1. Initialize user session on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: CURRENT_USER_ID, user_name: CURRENT_USER_NAME })
    })
      .then(res => res.json())
      .then(profile => {
        if (profile) setUserProfile(profile);
      })
      .catch(err => console.log("Backend initializing..."));

    handleSendMessage("start", true);
  }, []);

  // Text-To-Speech
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
      setInputVal('');
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/tutor/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: CURRENT_USER_ID,
          user_message: text,
          conversation_history: chatLog,
          api_key: apiKey
        })
      });

      if (!res.ok) throw new Error("Server response error");
      const data = await res.json();

      // Map animation mode based on topic
      let animMode = "TRAJECTORY";
      const topicLower = (data.rag_topic || "").toLowerCase();
      if (topicLower.includes("vector") || topicLower.includes("decomposition")) animMode = "VECTOR_DECOMPOSITION";
      else if (topicLower.includes("velocity") || topicLower.includes("vertical") || topicLower.includes("apex")) animMode = "VELOCITY_GRAPH";
      else if (topicLower.includes("drag") || topicLower.includes("air") || topicLower.includes("resistance")) animMode = "DRAG_COMPARISON";

      data.whiteboard.action_name = animMode;

      setTutorState(data);
      if (typeof data.user_mastery === 'number') {
        setUserProfile(prev => ({ ...prev, mastery_score: data.user_mastery }));
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
      console.warn("Using local adaptive state:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey) return;
    try {
      await fetch(`${API_BASE}/api/v1/config/api_key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      });
      setShowKeyModal(false);
      handleSendMessage("Connect Gemini reasoning engine");
    } catch (e) {
      console.error(e);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'ANSWER_TANGENT':
        return <span className="badge badge-tangent"><AlertCircle size={13}/> Answering Your Doubt</span>;
      case 'REMEDIATE':
        return <span className="badge badge-remediate"><Sparkles size={13}/> Intuitive Coaching</span>;
      default:
        return <span className="badge badge-teach"><GraduationCap size={13}/> Animated Micro-Lesson</span>;
    }
  };

  return (
    <div className="personal-app-container">
      {/* Top Navbar */}
      <header className="personal-navbar">
        <div className="nav-brand-section">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h2>Kinematics 1-on-1 Animation AI Tutor</h2>
            <p className="brand-tagline">Pure Programmatic Visual Engine • Live Adaptive Voice Avatar</p>
          </div>
        </div>

        <div className="nav-action-buttons">
          <button 
            className="btn-nav-control"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <Key size={15} /> API Key
          </button>
          <button 
            className={`btn-nav-control ${speechEnabled ? 'voice-active' : ''}`}
            onClick={() => {
              const next = !speechEnabled;
              setSpeechEnabled(next);
              if (next && tutorState.spoken_dialogue) speakText(tutorState.spoken_dialogue);
              else window.speechSynthesis?.cancel();
            }}
            title={speechEnabled ? "Voice Enabled" : "Enable Voice"}
          >
            {speechEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />} Voice {speechEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {/* Main 1-on-1 Split Grid */}
      <div className="personal-main-grid">
        
        {/* Left Side: Avatar & Dialogue Panel */}
        <aside className="personal-avatar-panel">
          
          {/* Student Profile Card */}
          <div className="student-profile-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="user-avatar-circle">
                  <User size={16} />
                </div>
                <div>
                  <h4>{userProfile?.name || "Vedansh"}</h4>
                  <span className="profile-subtitle">Personal 1-on-1 Session</span>
                </div>
              </div>

              <div className="mastery-indicator">
                <Award size={16} className="text-gold" />
                <span className="mastery-pct">{userProfile?.mastery_score || 25}% Mastery</span>
              </div>
            </div>

            <div className="mastery-track">
              <div 
                className="mastery-fill" 
                style={{ width: `${userProfile?.mastery_score || 25}%` }}
              ></div>
            </div>
          </div>

          {/* Animated Teacher Avatar (Lip-Sync + Gestures) */}
          <AnimatedTeacherAvatar 
            isSpeaking={isSpeaking} 
            currentAction={tutorState.action_type}
          />

          {/* Action & Grounding */}
          <div className="action-grounding-bar">
            {getActionBadge(tutorState.action_type)}
            {tutorState.rag_topic && (
              <span className="rag-ground-chip">{tutorState.rag_topic}</span>
            )}
          </div>

          {/* Spoken Dialogue & Socratic Question Area */}
          <div className="personal-dialogue-area">
            <div className="active-speech-bubble">
              <p className="speech-text">{tutorState.spoken_dialogue}</p>
            </div>

            {tutorState.concept_question && (
              <div className="socratic-check-box">
                <div className="check-title">
                  <HelpCircle size={15} className="text-cyan" />
                  <span>Check for Understanding</span>
                </div>
                <p className="check-text">{tutorState.concept_question}</p>
              </div>
            )}

            {/* Conversation Stream */}
            <div className="dialogue-history">
              {chatLog.slice(0, -1).map((msg, i) => (
                <div key={i} className={`msg-bubble ${msg.sender}`}>
                  <span className="msg-sender">{msg.sender === 'student' ? 'You' : 'Prof. Sophia'}</span>
                  <p>{msg.text || msg.dialogue}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="prompt-chips-row">
            <button onClick={() => handleSendMessage("How does air resistance change the trajectory?")}>
              💨 Air Drag Physics
            </button>
            <button onClick={() => handleSendMessage("What happens to vertical velocity vy over time?")}>
              📈 Plot vy(t) Graph
            </button>
            <button onClick={() => handleSendMessage("Show me vector decomposition again")}>
              📐 Vector Decomposition
            </button>
            <button onClick={() => handleSendMessage("Understood! Please advance to the next concept.")}>
              ✅ Next Lesson
            </button>
          </div>

          {/* Student Input Form */}
          <form className="personal-input-form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputVal); }}>
            <input 
              type="text" 
              placeholder="Ask any physics doubt or answer the quiz question..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-submit-doubt" disabled={loading || !inputVal.trim()}>
              <Send size={16} />
            </button>
          </form>
        </aside>

        {/* Right Side: Pure Animated Whiteboard */}
        <ManimStyleWhiteboard 
          mathLatex={tutorState.whiteboard?.math_latex}
          velocity={tutorState.whiteboard?.velocity || 25}
          angle={tutorState.whiteboard?.angle || 45}
          gravity={tutorState.whiteboard?.gravity || 9.8}
          animationMode={tutorState.whiteboard?.action_name || "TRAJECTORY"}
          annotationText={tutorState.whiteboard?.annotation_text}
        />

      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>🔑 Configure Google Gemini API Key</h3>
            <p>Connect your Gemini API Key for live personalized Socratic reasoning:</p>
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
