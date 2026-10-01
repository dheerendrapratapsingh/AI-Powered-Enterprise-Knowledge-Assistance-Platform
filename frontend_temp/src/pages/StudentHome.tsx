import React from 'react';
import './StudentHome.css';

export default function StudentHome({ onStartChat }: { onStartChat: (q?: string) => void }) {
  const suggestedQuestions = [
    { text: "How does attendance work?", icon: "📊" },
    { text: "How do I apply for revaluation?", icon: "📝" },
    { text: "When does the semester end?", icon: "📅" },
    { text: "How do I register for a course?", icon: "📚" },
    { text: "What are the hostel rules?", icon: "🏠" },
    { text: "How does the placement process work?", icon: "💼" }
  ];

  return (
    <div className="student-home-container">
      <div className="home-header">
        <h1 className="home-title">VIT-AP Student Copilot</h1>
        <p className="home-subtitle">Your intelligent AI assistant for all university queries.</p>
      </div>
      
      <div className="search-box-container">
        <input 
          type="text" 
          className="search-input"
          placeholder="Ask anything about academics, hostels, placements..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              onStartChat(e.currentTarget.value);
            }
          }}
        />
      </div>

      <div className="suggestions-section">
        <h3 className="suggestions-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
          </svg>
          Suggested Questions
        </h3>
        <div className="suggestions-grid">
          {suggestedQuestions.map((q, idx) => (
            <button 
              key={idx} 
              className="suggestion-card"
              onClick={() => onStartChat(q.text)}
            >
              <div className="suggestion-icon">{q.icon}</div>
              <span>{q.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
