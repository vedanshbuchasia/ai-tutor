import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  HelpCircle, 
  Sparkles, 
  User, 
  Award, 
  CheckCircle, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export default function PersonalAvatarPanel({ 
  userProfile,
  tutorDialogue,
  conceptQuestion,
  actionType,
  ragTopic,
  isSpeaking,
  chatLog,
  onSendMessage,
  loading
}) {
  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, tutorDialogue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;
    onSendMessage(inputVal);
    setInputVal('');
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'ANSWER_TANGENT':
        return <span className="badge badge-tangent"><AlertCircle size={13}/> Answering Your Doubt</span>;
      case 'REMEDIATE':
        return <span className="badge badge-remediate"><Sparkles size={13}/> Conceptual Coaching</span>;
      default:
        return <span className="badge badge-teach"><GraduationCap size={13}/> Personalized Micro-Lesson</span>;
    }
  };

  return (
    <aside className="personal-avatar-panel">
      {/* 1. Student Personal Mastery Card */}
      <div className="student-profile-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="user-avatar-circle">
              <User size={16} />
            </div>
            <div>
              <h4>{userProfile?.name || "Student"}</h4>
              <span className="profile-subtitle">Personal 1-on-1 Session</span>
            </div>
          </div>

          <div className="mastery-indicator">
            <Award size={16} className="text-gold" />
            <span className="mastery-pct">{userProfile?.mastery_score || 25}%</span>
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="mastery-track">
          <div 
            className="mastery-fill" 
            style={{ width: `${userProfile?.mastery_score || 25}%` }}
          ></div>
        </div>
      </div>

      {/* 2. Talking Teacher Avatar */}
      <div className="avatar-interaction-card">
        <div className={`avatar-container ${isSpeaking ? 'speaking' : ''}`}>
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
            alt="AI Tutor Avatar" 
            className="tutor-avatar-img"
          />
          {isSpeaking && (
            <div className="speaking-wave-bars">
              <span></span><span></span><span></span><span></span>
            </div>
          )}
        </div>

        <div className="avatar-meta">
          <h3>Prof. Sophia</h3>
          <span className="teaching-status">
            {isSpeaking ? '🎙️ Speaking...' : '👂 Listening to you'}
          </span>
        </div>
      </div>

      {/* Action Status & RAG Grounding */}
      <div className="action-grounding-bar">
        {getActionBadge(actionType)}
        {ragTopic && <span className="rag-ground-chip">{ragTopic}</span>}
      </div>

      {/* 3. Dialogue & Question Scroll Area */}
      <div className="personal-dialogue-area">
        {/* Active Speech Bubble */}
        <div className="active-speech-bubble">
          <p className="speech-text">{tutorDialogue}</p>
        </div>

        {/* Check for Understanding Card */}
        {conceptQuestion && (
          <div className="socratic-check-box">
            <div className="check-title">
              <HelpCircle size={15} className="text-cyan" />
              <span>Check for Understanding</span>
            </div>
            <p className="check-text">{conceptQuestion}</p>
          </div>
        )}

        {/* Conversation History Stream */}
        <div className="dialogue-history">
          {chatLog.slice(0, -1).map((msg, i) => (
            <div key={i} className={`msg-bubble ${msg.sender}`}>
              <span className="msg-sender">{msg.sender === 'student' ? 'You' : 'Prof. Sophia'}</span>
              <p>{msg.text || msg.dialogue}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 4. Quick Prompt Suggestions */}
      <div className="prompt-chips-row">
        <button onClick={() => onSendMessage("What about air resistance and friction?")}>
          💨 Air Resistance Doubt
        </button>
        <button onClick={() => onSendMessage("Why is maximum range at 45 degrees?")}>
          🎯 Why 45° for Range?
        </button>
        <button onClick={() => onSendMessage("Understood! Please advance to the next concept.")}>
          ✅ Got it! Next
        </button>
      </div>

      {/* 5. Student Response Input Form */}
      <form className="personal-input-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Answer question or interrupt with any doubt..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-submit-doubt" disabled={loading || !inputVal.trim()}>
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}
