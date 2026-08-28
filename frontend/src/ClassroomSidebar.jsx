import React, { useState } from 'react';
import { 
  Users, 
  HelpCircle, 
  Send, 
  Sparkles, 
  BarChart2, 
  FileText, 
  CheckCircle, 
  MessageSquare,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

const SIMULATED_PEERS = [
  { name: "Aisha K.", role: "Physics Major", query: "Wait Professor, why does vy reach exactly 0 at the peak?", time: "2m ago" },
  { name: "Marcus L.", role: "Engineering", query: "Does mass affect the flight time if air resistance is neglected?", time: "Just now" }
];

export default function ClassroomSidebar({ 
  tutorDialogue,
  conceptQuestion,
  actionType,
  isSpeaking,
  chatLog,
  onSendMessage,
  loading
}) {
  const [activeTab, setActiveTab] = useState('lecture'); // 'lecture' | 'peers' | 'notes'
  const [inputVal, setInputVal] = useState('');
  const [selectedPollOption, setSelectedPollOption] = useState(null);
  const [pollSubmitted, setPollSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;
    onSendMessage(inputVal);
    setInputVal('');
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'ANSWER_TANGENT':
        return <span className="badge badge-tangent"><AlertCircle size={13}/> Socratic Doubt Clarification</span>;
      case 'REMEDIATE':
        return <span className="badge badge-remediate"><Sparkles size={13}/> Conceptual Remediation</span>;
      default:
        return <span className="badge badge-teach"><GraduationCap size={13}/> Active Lecture Derivation</span>;
    }
  };

  return (
    <aside className="classroom-sidebar-container">
      {/* Professor Avatar Card */}
      <div className="professor-card">
        <div className={`avatar-box ${isSpeaking ? 'speaking' : ''}`}>
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
            alt="Professor Sophia" 
            className="prof-img"
          />
          {isSpeaking && <div className="audio-wave-bars">
            <span></span><span></span><span></span><span></span>
          </div>}
        </div>

        <div className="prof-details">
          <div className="flex items-center gap-2">
            <h3>Prof. Sophia</h3>
            <span className="prof-tag">MIT Physics</span>
          </div>
          <p className="prof-status">
            {isSpeaking ? '🎙️ Lecturing & Demonstrating...' : '👂 Listening to the Hall'}
          </p>
        </div>
      </div>

      {/* Sidebar Navigation Tabs */}
      <div className="sidebar-nav-tabs">
        <button 
          className={`side-tab ${activeTab === 'lecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('lecture')}
        >
          <MessageSquare size={14}/> Lecture Dialogue
        </button>
        <button 
          className={`side-tab ${activeTab === 'peers' ? 'active' : ''}`}
          onClick={() => setActiveTab('peers')}
        >
          <Users size={14}/> Classroom (18 Online)
        </button>
        <button 
          className={`side-tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={14}/> Live Notebook
        </button>
      </div>

      {/* Action Badge */}
      <div className="sidebar-action-bar">
        {getActionBadge(actionType)}
      </div>

      {/* Tab Content 1: Main Lecture Dialogue */}
      {activeTab === 'lecture' && (
        <div className="dialogue-scroll-area">
          {/* Main Professor Speech */}
          <div className="professor-speech-bubble">
            <p className="speech-text">{tutorDialogue}</p>
          </div>

          {/* Socratic Check for Understanding */}
          {conceptQuestion && (
            <div className="socratic-quiz-card">
              <div className="quiz-header">
                <HelpCircle size={15} className="text-cyan" />
                <span>Classroom Check for Understanding</span>
              </div>
              <p className="quiz-question">{conceptQuestion}</p>

              {/* Interactive Poll Options */}
              <div className="poll-options">
                {["Independent: Falling time is unchanged", "Dependent: vx affects vertical gravity"].map((opt, i) => (
                  <button 
                    key={i}
                    className={`poll-opt-btn ${selectedPollOption === i ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPollOption(i);
                      setPollSubmitted(true);
                      onSendMessage(`I choose: ${opt}`);
                    }}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                    {pollSubmitted && (
                      <span className="poll-stat">{i === 0 ? '84%' : '16%'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Previous Dialogue Stream */}
          <div className="history-stream">
            {chatLog.slice(0, -1).map((msg, i) => (
              <div key={i} className={`stream-bubble ${msg.sender}`}>
                <span className="stream-author">{msg.sender === 'student' ? 'You' : 'Prof. Sophia'}</span>
                <p>{msg.text || msg.dialogue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Simulated Classmates & Doubts */}
      {activeTab === 'peers' && (
        <div className="peers-scroll-area">
          <div className="peer-section-title">
            <Users size={14} /> Questions from Your Classmates
          </div>
          {SIMULATED_PEERS.map((peer, i) => (
            <div key={i} className="peer-card">
              <div className="peer-header">
                <div className="peer-avatar">{peer.name[0]}</div>
                <div>
                  <span className="peer-name">{peer.name}</span>
                  <span className="peer-role"> • {peer.role}</span>
                </div>
                <span className="peer-time">{peer.time}</span>
              </div>
              <p className="peer-query">"{peer.query}"</p>
              <button 
                className="btn-peer-discuss"
                onClick={() => onSendMessage(`Let's discuss ${peer.name}'s question: ${peer.query}`)}
              >
                Discuss with Professor ➔
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content 3: Smart Student Notebook */}
      {activeTab === 'notes' && (
        <div className="notes-scroll-area">
          <div className="notebook-header">
            <h4>📖 Kinematics Derivation Notebook</h4>
            <span className="badge badge-teach">Auto-Generated</span>
          </div>

          <div className="notebook-body">
            <div className="note-section">
              <h5>1. Core Decomposition Principle</h5>
              <p>2D Motion = Independent Horizontal (ax = 0) + Vertical (ay = -g) motion.</p>
              <code>r(t) = (u·cosθ)t î + ((u·sinθ)t - ½gt²) ĵ</code>
            </div>

            <div className="note-section">
              <h5>2. Key Kinematic Formulas</h5>
              <ul>
                <li><strong>Time of Flight:</strong> T = 2u·sinθ / g</li>
                <li><strong>Maximum Height:</strong> H_max = u²·sin²θ / 2g</li>
                <li><strong>Horizontal Range:</strong> R = u²·sin(2θ) / g</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quick Discussion Prompts */}
      <div className="sidebar-quick-prompts">
        <button onClick={() => onSendMessage("What happens to maximum height if launch angle is 90 degrees?")}>
          🎯 Launch at 90° (Free Fall)
        </button>
        <button onClick={() => onSendMessage("How does atmospheric drag alter the parabolic symmetry?")}>
          💨 Atmospheric Drag
        </button>
        <button onClick={() => onSendMessage("Understood professor! Please proceed to the next derivation.")}>
          ✅ Continue Lecture
        </button>
      </div>

      {/* Student Question / Interruption Bar */}
      <form className="sidebar-input-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Raise hand or ask a physics doubt..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-send-doubt" disabled={loading || !inputVal.trim()}>
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}
