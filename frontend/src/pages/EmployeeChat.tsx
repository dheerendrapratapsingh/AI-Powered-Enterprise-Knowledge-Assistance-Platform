import { useState, useRef, useEffect } from 'react';
import { Send, FileText, HelpCircle, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import styles from './EmployeeChat.module.css';
import { sendMessage } from '../services/chat';

export function EmployeeChat() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, sources?: any[], message_id?: string, feedbackSubmitted?: boolean}[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFeedback = async (messageIndex: number, rating: number) => {
    const msg = messages[messageIndex];
    if (!msg.message_id || msg.feedbackSubmitted) return;

    try {
      // Import this at the top of the file via the next edit
      const { submitFeedback } = await import('../services/chat');
      await submitFeedback(msg.message_id, rating);
      
      setMessages(prev => prev.map((m, i) => 
        i === messageIndex ? { ...m, feedbackSubmitted: true } : m
      ));
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const currentQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: currentQuery }]);
    setLoading(true);

    try {
      const res = await sendMessage(currentQuery);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: res.answer, 
        sources: res.sources,
        message_id: res.message_id
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        <div className={styles.chatHistory}>
          {messages.length === 0 ? (
            /* Welcome Message / Quick Actions */
            <div className={styles.welcomeSection}>
              <div className={styles.welcomeAvatar}>
                <div className={styles.logoIcon}></div>
              </div>
              <h1 className={styles.welcomeTitle}>Good morning</h1>
              <p className={styles.welcomeSubtitle}>How can I help you today?</p>
              
              <div className={styles.quickActions}>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("How do I deploy a project?")}>
                  <span className={styles.actionIcon}>🚀</span>
                  <span className={styles.actionText}>Deploy a project</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("Leave policy")}>
                  <span className={styles.actionIcon}>🏖️</span>
                  <span className={styles.actionText}>Leave policy</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("VPN access")}>
                  <span className={styles.actionIcon}>🔐</span>
                  <span className={styles.actionText}>VPN access</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("Find a person")}>
                  <span className={styles.actionIcon}>👥</span>
                  <span className={styles.actionText}>Find a person</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.messageGroup}>
              {messages.map((msg, idx) => (
                msg.role === 'user' ? (
                  <div key={idx} className={styles.userMessage}>
                    <div className={styles.messageContent}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className={styles.aiMessage}>
                    <div className={styles.aiAvatar}>
                      <div className={styles.logoIconSmall}></div>
                    </div>
                    <div className={styles.messageContent}>
                      <p className={styles.responseText}>{msg.content}</p>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className={styles.sourcesSection}>
                          <h4 className={styles.sourcesTitle}>Sources</h4>
                          <div className={styles.sourcesList}>
                            {msg.sources.map((src: any, i: number) => (
                              <div key={i} className={styles.sourceTag}>
                                <FileText size={14} />
                                {src.metadata.filename || 'Document'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.feedbackSection}>
                        {msg.feedbackSubmitted ? (
                          <span className={styles.feedbackText} style={{ color: 'var(--success)' }}>
                            ✓ Thanks for your feedback!
                          </span>
                        ) : (
                          <>
                            <span className={styles.feedbackText}>Was this helpful?</span>
                            <button className={styles.feedbackBtn} onClick={() => handleFeedback(idx, 1)}>👍</button>
                            <button className={styles.feedbackBtn} onClick={() => handleFeedback(idx, -1)}>👎</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              ))}
              {loading && (
                <div className={styles.aiMessage}>
                  <div className={styles.aiAvatar}>
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className={styles.messageContent}>
                    <p className={styles.responseText} style={{ color: '#94a3b8' }}>Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className={styles.inputContainer}>
          <div className={`glass-panel ${styles.inputWrapper}`}>
            <input 
              type="text" 
              className={styles.inputField} 
              placeholder="Ask anything about your organization..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <button className={styles.sendButton} onClick={handleSend} disabled={loading || !query.trim()}>
              <Send size={18} />
            </button>
          </div>
          <div className={styles.inputDisclaimer}>
            AI-generated responses may contain inaccuracies. Verify critical information.
          </div>
        </div>
      </div>

      {/* Right Sidebar - History & Context */}
      <div className={styles.contextSidebar}>
        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>
            <MessageSquare size={16} /> Recent Conversations
          </h3>
          <div className={styles.historyList}>
            <div className={styles.historyGroup}>
              <div className={styles.historyLabel}>Today</div>
              <button className={styles.historyItemActive}>New Conversation</button>
            </div>
          </div>
        </div>
        
        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>
            <HelpCircle size={16} /> Suggested Queries
          </h3>
          <div className={styles.suggestionsList}>
            <button className={styles.suggestionBtn} onClick={() => setQuery("Who approves travel expenses?")}>
              Who approves travel expenses? <ChevronRight size={14} />
            </button>
            <button className={styles.suggestionBtn} onClick={() => setQuery("What is the Q3 roadmap?")}>
              What is the Q3 roadmap? <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
