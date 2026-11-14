import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, FileText, HelpCircle, ChevronRight, MessageSquare, Loader2, Plus, Trash2, Square } from 'lucide-react';
import styles from './EmployeeChat.module.css';
import { 
  sendMessageStream, 
  submitFeedback, 
  getConversations, 
  getConversationMessages,
  deleteConversation 
} from '../services/chat';

interface SourceItem {
  document_id?: string;
  document_name?: string;
  page?: number;
  metadata?: { filename?: string };
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  sources?: SourceItem[];
  message_id?: string;
  feedbackSubmitted?: boolean;
}

interface ConversationItem {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

export function EmployeeChat() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data || []);
    } catch (err) {
      console.warn("Could not load conversations:", err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSelectConversation = async (convId: string) => {
    if (convId === conversationId) return;
    setLoading(true);
    try {
      const msgs = await getConversationMessages(convId);
      setConversationId(convId);
      setMessages(msgs.map((m: any) => ({
        role: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content,
        sources: m.sources,
        message_id: m.id
      })));
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setQuery('');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      if (conversationId === convId) {
        handleNewConversation();
      }
      loadConversations();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleFeedback = async (messageIndex: number, rating: number) => {
    const msg = messages[messageIndex];
    if (!msg.message_id || msg.feedbackSubmitted) return;

    try {
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

    // Append user message and an initial empty AI message for token streaming
    const userMessage: ChatMessage = { role: 'user', content: currentQuery };
    const aiMessage: ChatMessage = { role: 'ai', content: '', sources: [] };
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await sendMessageStream(
      currentQuery, 
      conversationId, 
      {
        onMetadata: (metadata) => {
          if (metadata.conversation_id && metadata.conversation_id !== conversationId) {
            setConversationId(metadata.conversation_id);
            loadConversations();
          }
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                message_id: metadata.message_id,
                sources: metadata.sources
              };
            }
            return updated;
          });
        },
        onToken: (token) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + token
              };
            }
            return updated;
          });
        },
        onDone: () => {
          setLoading(false);
          abortControllerRef.current = null;
        },
        onError: (errMsg) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'ai') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content || `Sorry, I encountered an error: ${errMsg}`
              };
            }
            return updated;
          });
          setLoading(false);
          abortControllerRef.current = null;
        }
      },
      controller.signal
    );
  };

  return (
    <div className={styles.container}>
      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        <div className={styles.chatHistory}>
          {messages.length === 0 ? (
            /* Welcome Section */
            <div className={styles.welcomeSection}>
              <div className={styles.welcomeAvatar}>
                <div className={styles.logoIcon}></div>
              </div>
              <h1 className={styles.welcomeTitle}>Good day</h1>
              <p className={styles.welcomeSubtitle}>How can I assist you with VIT-AP knowledge today?</p>
              
              <div className={styles.quickActions}>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("Draft a formal email to my School Dean requesting permission for an academic event leave.")}>
                  <span className={styles.actionIcon}>✉️</span>
                  <span className={styles.actionText}>Draft Email to Dean</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("What are all the compulsory Programme Core courses for B.Tech CSE Core?")}>
                  <span className={styles.actionIcon}>📚</span>
                  <span className={styles.actionText}>B.Tech CSE Core</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("Where is Dr. Hari Seetha's cabin and what is her department and designation?")}>
                  <span className={styles.actionIcon}>📍</span>
                  <span className={styles.actionText}>Find Faculty Cabin</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("What are the Sunday outing rules, return timings, and extra 3-hour extension procedure?")}>
                  <span className={styles.actionIcon}>🏠</span>
                  <span className={styles.actionText}>Hostel Outing Rules</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("Draft a polite email to my Course Coordinator requesting clarification on syllabus and attendance.")}>
                  <span className={styles.actionIcon}>📝</span>
                  <span className={styles.actionText}>Draft Email to Coordinator</span>
                </button>
                <button className={`glass-panel ${styles.actionButton}`} onClick={() => setQuery("What are the Programme Core courses for B.Tech CSBS?")}>
                  <span className={styles.actionIcon}>💼</span>
                  <span className={styles.actionText}>B.Tech CSBS Courses</span>
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
                      <div className={styles.markdownBody}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className={styles.sourcesSection}>
                          <h4 className={styles.sourcesTitle}>Sources Cited</h4>
                          <div className={styles.sourcesList}>
                            {msg.sources.map((src: SourceItem, i: number) => {
                              const docName = src.document_name || src.metadata?.filename || 'Document';
                              const pageInfo = src.page ? ` (p. ${src.page})` : '';
                              return (
                                <div key={i} className={styles.sourceTag}>
                                  <FileText size={14} />
                                  <span>{docName}{pageInfo}</span>
                                </div>
                              );
                            })}
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
                            <button className={styles.feedbackBtn} onClick={() => handleFeedback(idx, 1)} title="Helpful">👍</button>
                            <button className={styles.feedbackBtn} onClick={() => handleFeedback(idx, -1)} title="Not Helpful">👎</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              ))}
              {loading && messages.length > 0 && messages[messages.length - 1].content === '' && (
                <div className={styles.aiMessage}>
                  <div className={styles.aiAvatar}>
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className={styles.messageContent}>
                    <p className={styles.responseText} style={{ color: '#94a3b8' }}>Thinking & retrieving knowledge...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className={styles.inputContainer}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <button 
                onClick={handleStop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s'
                }}
                title="Stop generating response"
              >
                <Square size={12} fill="#f87171" /> Stop generating
              </button>
            </div>
          )}
          <div className={`glass-panel ${styles.inputWrapper}`}>
            <input 
              type="text" 
              className={styles.inputField} 
              placeholder={loading ? "Generating response (click Stop to cancel)..." : "Ask anything about policies, regulations, or campus procedures..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
            />
            {loading ? (
              <button 
                className={styles.sendButton} 
                onClick={handleStop}
                style={{ background: '#ef4444', color: '#fff' }}
                title="Stop generating"
              >
                <Square size={13} fill="#fff" />
              </button>
            ) : (
              <button className={styles.sendButton} onClick={handleSend} disabled={!query.trim()}>
                <Send size={18} />
              </button>
            )}
          </div>
          <div className={styles.inputDisclaimer}>
            VIT-AP AI Copilot answers using verified official institutional guidelines.
          </div>
        </div>
      </div>

      {/* Right Sidebar - History & Context */}
      <div className={styles.contextSidebar}>
        <div className={styles.sidebarSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 className={styles.sidebarTitle} style={{ margin: 0 }}>
              <MessageSquare size={16} /> Recent Chats
            </h3>
            <button 
              onClick={handleNewConversation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#fff',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
              title="Start a new chat"
            >
              <Plus size={12} /> New
            </button>
          </div>
          
          <div className={styles.historyList}>
            {conversations.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                No past conversations yet.
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: conv.id === conversationId ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    border: conv.id === conversationId ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: 4,
                    transition: 'background 0.2s'
                  }}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <span style={{ 
                    fontSize: '0.82rem', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    maxWidth: 160,
                    color: conv.id === conversationId ? '#fff' : 'var(--text-muted)'
                  }}>
                    {conv.title || "Untitled Conversation"}
                  </span>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>
            <HelpCircle size={16} /> Suggested Queries
          </h3>
          <div className={styles.suggestionsList}>
            <button className={styles.suggestionBtn} onClick={() => setQuery("Can I get an extra 3 hours for Sunday outing?")}>
              Extra 3 hours for outing? <ChevronRight size={14} />
            </button>
            <button className={styles.suggestionBtn} onClick={() => setQuery("What happens if a student returns on the same day during General Leave?")}>
              Same-day return penalty? <ChevronRight size={14} />
            </button>
            <button className={styles.suggestionBtn} onClick={() => setQuery("What is the health emergency procedure for hospital visits?")}>
              Emergency hospital protocol? <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
