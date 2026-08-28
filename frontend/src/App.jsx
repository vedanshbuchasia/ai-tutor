import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import PhysicsCanvas from './PhysicsCanvas';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Send, 
  HelpCircle, 
  Key,
  GraduationCap, 
  Layers, 
  AlertCircle,
  RefreshCw,
  Maximize2,
  Database,
  Activity,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeBoardTab, setActiveBoardTab] = useState('sim'); // 'sim' | 'diagram'
  
  const [tutorState, setTutorState] = useState({
    spoken_dialogue: "Welcome! I am your Multimodal AI Physics Tutor. Today we are exploring 2D Projectile Motion. Look at the animated blackboard: the blue trajectory traces the parabolic path, while the arrows represent horizontal velocity vx and changing vertical velocity vy.",
    frame_to_display: "frame_000.jpg",
    math_latex: "\\vec{r}(t) = (u\\cos\\theta)t\\hat{i} + ((u\\sin\\theta)t - \\frac{1}{2}gt^2)\\hat{j}",
    concept_question: "Can horizontal motion affect the time it takes for a projectile to fall to the ground?",
    action_type: "TEACH",
    simulation_params: { velocity: 25, angle: 45, gravity: 9.8 },
    rag_grounding: []
  });

  const [inputMessage, setInputMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedFrameZoom, setSelectedFrameZoom] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const mathRef = useRef(null);
  const chatEndRef = useRef(null);

  // Render KaTeX Math
  useEffect(() => {
    if (mathRef.current && tutorState.math_latex) {
      try {
        katex.render(tutorState.math_latex, mathRef.current, {
          displayMode: true,
          throwOnError: false
        });
      } catch (err) {
        console.error("KaTeX error:", err);
      }
    }
  }, [tutorState.math_latex]);

  // Initial prompt
  useEffect(() => {
    handleSend("start", true);
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

  const handleSend = async (messageToSend = null, isSilent = false) => {
    const text = (messageToSend !== null ? messageToSend : inputMessage).trim();
    if (!text && !isSilent) return;

    if (!isSilent) {
      setChatLog(prev => [...prev, { sender: 'student', text }]);
      setInputMessage('');
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: text,
          current_step: currentStep,
          conversation_history: chatLog,
          api_key: apiKey
        })
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      
      setTutorState(data);
      if (typeof data.step_index === 'number') {
        setCurrentStep(data.step_index);
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
      console.warn("API error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
      handleSend("Evaluate my syllabus with Gemini");
    } catch (e) {
      console.error(e);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'ANSWER_TANGENT':
        return <span className="badge badge-tangent"><AlertCircle size={14}/> Answering Tangent / Doubt</span>;
      case 'REMEDIATE':
        return <span className="badge badge-remediate"><RefreshCw size={14}/> Clarifying Concept</span>;
      default:
        return <span className="badge badge-teach"><GraduationCap size={14}/> Delivering Vector RAG Lesson</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="logo-icon"><Sparkles size={20} /></div>
          <div>
            <h1>Kinematics Multimodal Vector RAG Tutor</h1>
            <p className="nav-subtitle">Live Vector Grounding • Animated Visual Blackboard</p>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="stepper">
          {[0, 1, 2, 3, 4].map(idx => (
            <div 
              key={idx} 
              className={`step-node ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              onClick={() => {
                setCurrentStep(idx);
                handleSend(`Teach stage ${idx + 1}`);
              }}
            >
              <div className="node-circle">{idx < currentStep ? '✓' : idx + 1}</div>
              <span className="node-label">Stage {idx + 1}</span>
            </div>
          ))}
        </div>

        <div className="nav-controls">
          <button 
            className="btn-icon"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <Key size={18}/>
          </button>
          <button 
            className={`btn-icon ${speechEnabled ? 'active' : ''}`}
            onClick={() => {
              const next = !speechEnabled;
              setSpeechEnabled(next);
              if (next && tutorState.spoken_dialogue) speakText(tutorState.spoken_dialogue);
              else window.speechSynthesis?.cancel();
            }}
            title={speechEnabled ? "Voice Enabled" : "Enable Voice"}
          >
            {speechEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}
          </button>
        </div>
      </header>

      {/* Main Split Screen */}
      <div className="main-layout">
        
        {/* Left Side: Avatar & Interactive Teacher */}
        <aside className="left-panel">
          
          {/* Avatar Card */}
          <div className="avatar-card">
            <div className={`avatar-wrapper ${isSpeaking ? 'speaking' : ''}`}>
              <div className="avatar-glow"></div>
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
                alt="AI Professor" 
                className="avatar-img"
              />
              {isSpeaking && <div className="pulse-ring"></div>}
            </div>
            
            <div className="avatar-info">
              <h3>Prof. Sophia</h3>
              <div className="status-indicator">
                <span className="dot"></span>
                <span>{isSpeaking ? 'Narrating verbally...' : 'Listening & Ready'}</span>
              </div>
            </div>
          </div>

          {/* Action Badge & Vector Grounding Indicator */}
          <div className="current-action-bar flex justify-between items-center">
            {getActionBadge(tutorState.action_type)}
            {tutorState.rag_grounding?.length > 0 && (
              <span className="rag-pill">
                <Database size={12} /> {tutorState.rag_grounding[0].topic}
              </span>
            )}
          </div>

          {/* Dialogue & Question Box */}
          <div className="dialogue-box">
            <div className="dialogue-message current-speech">
              <p className="dialogue-text">{tutorState.spoken_dialogue}</p>
            </div>

            {tutorState.concept_question && (
              <div className="concept-check-card">
                <div className="check-header">
                  <HelpCircle size={16} className="text-cyan"/>
                  <strong>Check for Understanding:</strong>
                </div>
                <p className="question-text">{tutorState.concept_question}</p>
              </div>
            )}

            {/* Conversation Stream */}
            <div className="chat-history">
              {chatLog.slice(0, -1).map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.sender}`}>
                  <span className="bubble-sender">{msg.sender === 'student' ? 'You' : 'Prof. Sophia'}</span>
                  <p>{msg.text || msg.dialogue}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="quick-prompts">
            <button onClick={() => handleSend("What about air resistance and aerodynamic drag?")}>
              💡 Tangent: Air Drag?
            </button>
            <button onClick={() => handleSend("Why is maximum range at 45 degrees angle?")}>
              ❓ Why 45° for Max Range?
            </button>
            <button onClick={() => handleSend("What happens to vertical velocity vy at the apex?")}>
              🎯 Apex Velocity
            </button>
            <button onClick={() => handleSend("Understood! Please advance to next concept.")}>
              ✅ Next Lesson
            </button>
          </div>

          {/* Student Response Input */}
          <form className="input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input 
              type="text" 
              placeholder="Answer question or interrupt with any physics doubt..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-send" disabled={loading || !inputMessage.trim()}>
              <Send size={18} />
            </button>
          </form>
        </aside>

        {/* Right Side: The Visual Blackboard */}
        <main className="right-panel">
          <div className="blackboard-frame">
            
            {/* Blackboard Tabs */}
            <div className="blackboard-header">
              <div className="flex items-center gap-4">
                <div className="board-title">
                  <Layers size={18} />
                  <span>The Visual Physics Blackboard</span>
                </div>
                <div className="tab-pills">
                  <button 
                    className={`tab-btn ${activeBoardTab === 'sim' ? 'active' : ''}`}
                    onClick={() => setActiveBoardTab('sim')}
                  >
                    <Activity size={14} /> Live Physics Simulation
                  </button>
                  <button 
                    className={`tab-btn ${activeBoardTab === 'diagram' ? 'active' : ''}`}
                    onClick={() => setActiveBoardTab('diagram')}
                  >
                    <ImageIcon size={14} /> Grounded Lecture Keyframe
                  </button>
                </div>
              </div>

              <div className="board-status">
                <span>Vector Grounded • {tutorState.frame_to_display}</span>
              </div>
            </div>

            <div className="blackboard-content">
              
              {/* Dynamic Mathematical Equations via KaTeX */}
              <div className="math-display-card">
                <div className="math-label">Live Mathematical Formulation</div>
                <div ref={mathRef} className="katex-render-area"></div>
              </div>

              {/* Main Visual Display Area */}
              {activeBoardTab === 'sim' ? (
                <PhysicsCanvas 
                  velocity={tutorState.simulation_params?.velocity || 25}
                  angle={tutorState.simulation_params?.angle || 45}
                  gravity={tutorState.simulation_params?.gravity || 9.8}
                />
              ) : (
                <div className="visual-board">
                  <div className="diagram-header">
                    <span>Grounded Video Keyframe: {tutorState.frame_to_display}</span>
                    <button 
                      className="btn-zoom"
                      onClick={() => setSelectedFrameZoom(`${API_BASE}/frames/${tutorState.frame_to_display}`)}
                    >
                      <Maximize2 size={16} /> Expand Diagram
                    </button>
                  </div>

                  <div className="diagram-container">
                    <img 
                      src={`${API_BASE}/frames/${tutorState.frame_to_display}`} 
                      alt="Kinematics Visual Keyframe"
                      className="diagram-image"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="modal-body api-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Configure Gemini API Key</h3>
            <p>Enter your Google Gemini API key to enable live LLM generation and cloud vector embeddings:</p>
            <input 
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="api-input"
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowKeyModal(false)}>Cancel</button>
              <button className="btn-save" onClick={saveApiKey}>Save & Activate</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom View */}
      {selectedFrameZoom && (
        <div className="modal-backdrop" onClick={() => setSelectedFrameZoom(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <img src={selectedFrameZoom} alt="Zoomed diagram" />
            <button className="btn-close-modal" onClick={() => setSelectedFrameZoom(null)}>✕ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
