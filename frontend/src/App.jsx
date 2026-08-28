import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Send, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  AlertCircle,
  RefreshCw,
  Maximize2
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5);
  const [curriculum, setCurriculum] = useState([]);
  
  const [tutorState, setTutorState] = useState({
    spoken_dialogue: "Welcome to Kinematics! Today we explore 2D Projectile Motion step-by-step. Look at the board to see how motion is decomposed into horizontal and vertical components.",
    frame_to_display: "frame_000.jpg",
    math_latex: "\\vec{r}(t) = x(t)\\hat{i} + y(t)\\hat{j}",
    concept_question: "Can horizontal motion affect the time it takes for a projectile to fall to the ground?",
    action_type: "TEACH"
  });

  const [inputMessage, setInputMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedFrameZoom, setSelectedFrameZoom] = useState(null);

  const mathRef = useRef(null);
  const chatEndRef = useRef(null);

  // Render KaTeX Math whenever math_latex updates
  useEffect(() => {
    if (mathRef.current && tutorState.math_latex) {
      try {
        katex.render(tutorState.math_latex, mathRef.current, {
          displayMode: true,
          throwOnError: false
        });
      } catch (err) {
        console.error("KaTeX render error:", err);
      }
    }
  }, [tutorState.math_latex]);

  // Load initial curriculum
  useEffect(() => {
    fetch(`${API_BASE}/curriculum`)
      .then(res => res.json())
      .then(data => {
        if (data.steps) {
          setCurriculum(data.steps);
          setTotalSteps(data.steps.length);
        }
      })
      .catch(err => console.log("API not ready yet, using offline state"));

    // Initial greeting
    handleSend("hello", true);
  }, []);

  // Text-To-Speech
  const speakText = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
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
          conversation_history: chatLog
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

      if (speechEnabled) {
        speakText(data.spoken_dialogue);
      }
    } catch (err) {
      console.warn("Backend offline, using internal fallback:", err);
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'ANSWER_TANGENT':
        return <span className="badge badge-tangent"><AlertCircle size={14}/> Answering Tangent / Doubt</span>;
      case 'REMEDIATE':
        return <span className="badge badge-remediate"><RefreshCw size={14}/> Clarifying Concept</span>;
      default:
        return <span className="badge badge-teach"><GraduationCap size={14}/> Delivering Lesson</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="logo-icon"><Sparkles size={20} /></div>
          <div>
            <h1>Kinematics AI Blackboard Tutor</h1>
            <p className="nav-subtitle">Proactive Multimodal Visual Classroom</p>
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
                handleSend(`Go to step ${idx + 1}`);
              }}
            >
              <div className="node-circle">{idx < currentStep ? '✓' : idx + 1}</div>
              <span className="node-label">Step {idx + 1}</span>
            </div>
          ))}
        </div>

        <div className="nav-controls">
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
                <span>{isSpeaking ? 'Lecturing...' : 'Listening to you'}</span>
              </div>
            </div>
          </div>

          {/* Action Badge */}
          <div className="current-action-bar">
            {getActionBadge(tutorState.action_type)}
          </div>

          {/* Chat Stream & Dialogue */}
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

            {/* Conversation History */}
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

          {/* Quick Questions / Doubts Bar */}
          <div className="quick-prompts">
            <button onClick={() => handleSend("What about air resistance and friction?")}>
              💡 Ask Doubt (Air Resistance)
            </button>
            <button onClick={() => handleSend("Why is maximum range at 45 degrees?")}>
              ❓ Why 45° for Range?
            </button>
            <button onClick={() => handleSend("Understood, continue to next topic!")}>
              ✅ Understood! Next Step
            </button>
          </div>

          {/* Student Response Input */}
          <form className="input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input 
              type="text" 
              placeholder="Answer quiz or ask any doubt (interrupt freely)..." 
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
            <div className="blackboard-header">
              <div className="board-title">
                <Layers size={18} />
                <span>Lecture Blackboard • {tutorState.frame_to_display}</span>
              </div>
              <div className="board-status">
                <span>Topic: Kinematics 2D</span>
              </div>
            </div>

            <div className="blackboard-content">
              {/* Dynamic Mathematical Equations via KaTeX */}
              <div className="math-display-card">
                <div className="math-label">Active Physics Formulation</div>
                <div ref={mathRef} className="katex-render-area"></div>
              </div>

              {/* Multimodal Keyframe Visual Display */}
              <div className="visual-board">
                <div className="diagram-header">
                  <span>Visual Grounding (Grounded Keyframe from Lecture Video)</span>
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
                    alt="Kinematics Visual Diagram"
                    className="diagram-image"
                    onError={(e) => {
                      // Fallback placeholder if image not yet populated
                      e.target.src = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                  <div className="diagram-overlay-caption">
                    <span>Frame: {tutorState.frame_to_display} • Timestamp Grounded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

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
