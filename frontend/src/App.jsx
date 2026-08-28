import React, { useState, useEffect } from 'react';
import ChalkboardMasterClass from './ChalkboardMasterClass';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Key, 
  User, 
  Award,
  Send,
  HelpCircle,
  AlertCircle,
  GraduationCap,
  Calculator,
  Compass
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

  const [lesson, setLesson] = useState(null);
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

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      setLesson(data);
      if (typeof data.user_mastery === 'number') {
        setUserProfile(prev => ({ ...prev, mastery_score: data.user_mastery }));
      }

      setChatLog(prev => [...prev, {
        sender: 'tutor',
        dialogue: data.spoken_dialogue,
        quiz: data.concept_quiz,
        action: data.action_type
      }]);

      if (speechEnabled && data.spoken_dialogue) {
        speakText(data.spoken_dialogue);
      }
    } catch (err) {
      console.warn("Using local adaptive lesson:", err);
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
      handleSendMessage("Connect Gemini AI Tutor");
    } catch (e) {
      console.error(e);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'SOLVE_PROBLEM':
        return <span className="badge badge-solve"><Calculator size={13}/> Solving Problem on Board</span>;
      case 'ANSWER_TANGENT':
        return <span className="badge badge-tangent"><AlertCircle size={13}/> Answering Your Doubt</span>;
      case 'REMEDIATE':
        return <span className="badge badge-remediate"><Sparkles size={13}/> Intuitive Coaching</span>;
      default:
        return <span className="badge badge-teach"><GraduationCap size={13}/> Interactive MasterClass</span>;
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
            <h2>Kinematics AI MasterClass Tutor</h2>
            <p className="brand-tagline">Google Gemini & Qdrant RAG • Live Blackboard Problem Solving</p>
          </div>
        </div>

        <div className="nav-action-buttons">
          <button 
            className="btn-nav-control"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <Key size={15} /> LLM API Key (Gemini)
          </button>
          <button 
            className={`btn-nav-control ${speechEnabled ? 'voice-active' : ''}`}
            onClick={() => {
              const next = !speechEnabled;
              setSpeechEnabled(next);
              if (next && lesson?.spoken_dialogue) speakText(lesson.spoken_dialogue);
              else window.speechSynthesis?.cancel();
            }}
            title={speechEnabled ? "Voice Enabled" : "Enable Voice"}
          >
            {speechEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />} Voice {speechEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="personal-main-grid">
        
        {/* Left Side: Student Profile & Socratic Dialogue */}
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
                  <span className="profile-subtitle">1-on-1 Physics Mastery</span>
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

          {/* Action & Grounding */}
          <div className="action-grounding-bar">
            {getActionBadge(lesson?.action_type)}
            {lesson?.concept_summary && (
              <span className="rag-ground-chip">{lesson.topic_title}</span>
            )}
          </div>

          {/* Spoken Dialogue & Socratic Question Area */}
          <div className="personal-dialogue-area">
            <div className="active-speech-bubble">
              <p className="speech-text">{lesson?.spoken_dialogue}</p>
            </div>

            {lesson?.concept_quiz && (
              <div className="socratic-check-box">
                <div className="check-title">
                  <HelpCircle size={15} className="text-cyan" />
                  <span>Socratic Concept Check</span>
                </div>
                <p className="check-text">{lesson.concept_quiz}</p>
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

          {/* Quick Problem Solving & Doubt Chips */}
          <div className="prompt-chips-row">
            <button onClick={() => handleSendMessage("Solve the next example problem on the board!")}>
              📝 Solve Next Problem
            </button>
            <button onClick={() => handleSendMessage("Both hit at the exact same millisecond!")}>
              🎯 Both hit at same time
            </button>
            <button onClick={() => handleSendMessage("Why is maximum range at 45 degrees?")}>
              📐 Why 45° for Range?
            </button>
            <button onClick={() => handleSendMessage("What happens to vertical velocity vy at maximum apex height?")}>
              ⛰️ Apex vy = 0 Proof
            </button>
            <button onClick={() => handleSendMessage("What about real-world air resistance and aerodynamic drag?")}>
              💨 Air Resistance
            </button>
          </div>

          {/* Student Input Form */}
          <form className="personal-input-form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputVal); }}>
            <input 
              type="text" 
              placeholder="Answer quiz or ask the professor to solve any problem..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-submit-doubt" disabled={loading || !inputVal.trim()}>
              <Send size={16} />
            </button>
          </form>
        </aside>

        {/* Right Side: Chalkboard MasterClass Scene */}
        <ChalkboardMasterClass 
          lesson={lesson}
          isSpeaking={isSpeaking}
          onNextQuestion={() => handleSendMessage("Solve the next question")}
          onReplay={() => {
            if (speechEnabled && lesson?.spoken_dialogue) speakText(lesson.spoken_dialogue);
          }}
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
