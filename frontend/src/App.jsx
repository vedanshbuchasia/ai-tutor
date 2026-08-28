import React, { useState, useEffect } from 'react';
import PersonalAvatarPanel from './PersonalAvatarPanel';
import SingleWhiteboard from './SingleWhiteboard';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Key, 
  User, 
  Layers,
  GraduationCap
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';
const CURRENT_USER_ID = 'vedansh_student';
const CURRENT_USER_NAME = 'Vedansh';

export default function App() {
  const [userProfile, setUserProfile] = useState({
    user_id: CURRENT_USER_ID,
    name: CURRENT_USER_NAME,
    mastery_score: 20,
    current_topic_index: 0,
    completed_topics: [],
    doubts_logged: []
  });

  const [tutorState, setTutorState] = useState({
    spoken_dialogue: "Hello Vedansh! Welcome to your personal 1-on-1 Physics session on 2D Projectile Kinematics. Look at your whiteboard on the right: we decompose all motion into horizontal (vx) and vertical (vy) vectors. Let's start with the fundamental derivation.",
    whiteboard: {
      action_name: "ANIMATE_TRAJECTORY",
      math_latex: "\\vec{r}(t) = (u\\cos\\theta)t\\hat{i} + ((u\\sin\\theta)t - \\frac{1}{2}gt^2)\\hat{j}",
      velocity: 25,
      angle: 45,
      gravity: 9.8,
      frame_to_display: "frame_000.jpg",
      annotation_text: "2D Vector Decomposition"
    },
    concept_question: "Are the horizontal and vertical motions dependent on each other, or are they completely independent?",
    action_type: "TEACH",
    rag_topic: "2D Vector Decomposition"
  });

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

      if (!res.ok) throw new Error("Server response not ok");
      const data = await res.json();

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

  return (
    <div className="personal-app-container">
      {/* Top Navbar */}
      <header className="personal-navbar">
        <div className="nav-brand-section">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h2>Kinematics 1-on-1 AI Tutor</h2>
            <p className="brand-tagline">Personalized Adaptive Whiteboard & Vector RAG</p>
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

      {/* Main 1-on-1 Split Grid (Left: Avatar & Dialogue, Right: Single Whiteboard) */}
      <div className="personal-main-grid">
        <PersonalAvatarPanel 
          userProfile={userProfile}
          tutorDialogue={tutorState.spoken_dialogue}
          conceptQuestion={tutorState.concept_question}
          actionType={tutorState.action_type}
          ragTopic={tutorState.rag_topic}
          isSpeaking={isSpeaking}
          chatLog={chatLog}
          onSendMessage={handleSendMessage}
          loading={loading}
        />

        <SingleWhiteboard 
          mathLatex={tutorState.whiteboard?.math_latex}
          velocity={tutorState.whiteboard?.velocity || 25}
          angle={tutorState.whiteboard?.angle || 45}
          gravity={tutorState.whiteboard?.gravity || 9.8}
          frameToDisplay={tutorState.whiteboard?.frame_to_display || "frame_000.jpg"}
          apiBase={API_BASE}
          annotationText={tutorState.whiteboard?.annotation_text}
        />
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>🔑 Configure Google Gemini API Key</h3>
            <p>Connect your Gemini API Key for live personalized Socratic reasoning and cloud vector embeddings:</p>
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
