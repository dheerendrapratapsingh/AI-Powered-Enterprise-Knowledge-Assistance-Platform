import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  FileText, 
  Bot, 
  Plus, 
  Trash2, 
  Square, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Search, 
  PanelLeft, 
  Pencil, 
  X,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { AI3DOrb } from '../components/AI3DOrb';
import { Space3DBackground } from '../components/Space3DBackground';
import styles from './EmployeeChat.module.css';
import { 
  sendMessageStream, 
  submitFeedback, 
  getConversations, 
  getConversationMessages, 
  deleteConversation, 
  renameConversation, 
  clearAllConversations 
} from '../services/chat';
import { getCurrentUser } from '../services/auth';

interface SourceItem {
  document_id?: string;
  document_name?: string;
  page?: number;
  source_url?: string;
  source_type?: string;
  metadata?: { filename?: string; source_url?: string; source_type?: string };
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  sources?: SourceItem[];
  message_id?: string;
  feedbackSubmitted?: boolean;
  response_type?: string;
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
  const [historySearch, setHistorySearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  // Inline rename state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getCurrentUser().then(u => setUser(u)).catch(() => {});
    loadConversations();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data || []);
    } catch (err) {
      console.warn('Could not load conversations:', err);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

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
      console.error('Failed to load conversation messages:', err);
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
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    try {
      await deleteConversation(convId);
      if (conversationId === convId) {
        handleNewConversation();
      }
      loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleStartRename = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title || '');
  };

  const handleSaveRename = async (e: React.MouseEvent | React.KeyboardEvent, convId: string) => {
    e.stopPropagation();
    if (!editingTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      await renameConversation(convId, editingTitle.trim());
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: editingTitle.trim() } : c));
      setEditingConvId(null);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to permanently clear your entire conversation history?')) return;
    try {
      await clearAllConversations();
      handleNewConversation();
      loadConversations();
    } catch (err) {
      console.error('Failed to clear conversations:', err);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSources = (index: number) => {
    setExpandedSources(prev => ({ ...prev, [index]: !prev[index] }));
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
      console.error('Failed to submit feedback', err);
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || query;
    if (!promptToSend.trim() || loading) return;

    setQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: ChatMessage = { role: 'user', content: promptToSend };
    const aiMessage: ChatMessage = { role: 'ai', content: '', sources: [] };
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await sendMessageStream(
      promptToSend, 
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
                sources: metadata.sources,
                response_type: metadata.response_type || (metadata.sources && metadata.sources.length > 0 ? 'answer' : 'greeting')
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
          loadConversations();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group conversations by date (Today, Yesterday, Previous 7 Days, Older)
  const filteredConversations = conversations.filter(c => 
    (c.title || '').toLowerCase().includes(historySearch.toLowerCase())
  );

  const groupConversations = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const last7Days = today - 7 * 86400000;
    const last30Days = today - 30 * 86400000;

    const groups: { [key: string]: ConversationItem[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': []
    };

    filteredConversations.forEach(c => {
      const time = c.updated_at ? new Date(c.updated_at).getTime() : (c.created_at ? new Date(c.created_at).getTime() : 0);
      if (time >= today) {
        groups['Today'].push(c);
      } else if (time >= yesterday) {
        groups['Yesterday'].push(c);
      } else if (time >= last7Days) {
        groups['Previous 7 Days'].push(c);
      } else if (time >= last30Days) {
        groups['Previous 30 Days'].push(c);
      } else {
        groups['Older'].push(c);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const activeConversation = conversations.find(c => c.id === conversationId);

  return (
    <div className={styles.container}>
      {/* ChatGPT-Style Left History Sidebar */}
      <aside className={`${styles.historySidebar} ${!sidebarOpen ? styles.historySidebarHidden : ''}`}>
        <div className={styles.historyHeader}>
          <div className={styles.historyTopRow}>
            <div className={styles.historyBrandTitle}>
              <MessageSquare size={16} color="var(--accent-cyan)" />
              <span>Chat History</span>
            </div>

            <button 
              className={styles.historyActionBtn}
              onClick={() => setSidebarOpen(false)}
              title="Close history panel"
            >
              <PanelLeft size={16} />
            </button>
          </div>

          <button className={styles.newChatBtn} onClick={handleNewConversation} title="Start new dialogue session">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} />
              <span>New Chat</span>
            </span>
            <span style={{ fontSize: '0.72rem', opacity: 0.7, padding: '2px 5px', borderRadius: 4, background: 'rgba(0,0,0,0.2)' }}>
              Ctrl+N
            </span>
          </button>

          <div className={styles.searchBox}>
            <Search size={13} color="var(--text-muted)" />
            <input 
              type="text"
              placeholder="Search chat history..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Grouped History List */}
        <div className={styles.historyListContainer}>
          {filteredConversations.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem 1rem', textAlign: 'center' }}>
              {historySearch ? 'No matching chats found.' : 'No chat history yet. Ask a question to begin!'}
            </div>
          ) : (
            groupConversations().map(([groupName, items]) => (
              <div key={groupName} className={styles.historyGroupItems}>
                <div className={styles.historyGroupTitle}>{groupName}</div>
                {items.map(conv => (
                  <div 
                    key={conv.id}
                    className={`${styles.historyItem} ${conv.id === conversationId ? styles.historyItemActive : ''}`}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <div className={styles.historyItemLeft}>
                      <MessageSquare size={14} color={conv.id === conversationId ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                      
                      {editingConvId === conv.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          autoFocus
                          onChange={e => setEditingTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveRename(e, conv.id)}
                          onClick={e => e.stopPropagation()}
                          className={styles.renameInput}
                        />
                      ) : (
                        <span className={styles.historyText} title={conv.title || 'Untitled Session'}>
                          {conv.title || 'Untitled Session'}
                        </span>
                      )}
                    </div>

                    <div className={styles.historyActions}>
                      {editingConvId === conv.id ? (
                        <>
                          <button 
                            className={styles.historyActionBtn}
                            onClick={e => handleSaveRename(e, conv.id)}
                            title="Save title"
                          >
                            <Check size={12} color="var(--accent-emerald)" />
                          </button>
                          <button 
                            className={styles.historyActionBtn}
                            onClick={e => { e.stopPropagation(); setEditingConvId(null); }}
                            title="Cancel rename"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className={styles.historyActionBtn}
                            onClick={e => handleStartRename(e, conv)}
                            title="Rename chat"
                          >
                            <Pencil size={12} />
                          </button>
                          <button 
                            className={`${styles.historyActionBtn} ${styles.historyActionDelete}`}
                            onClick={e => handleDeleteConversation(e, conv.id)}
                            title="Delete chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* History Footer */}
        {conversations.length > 0 && (
          <div className={styles.historyFooter}>
            <button className={styles.clearAllBtn} onClick={handleClearAll} title="Clear all past chats">
              <Trash2 size={12} />
              <span>Clear chat history</span>
            </button>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              {conversations.length} sessions
            </span>
          </div>
        )}
      </aside>

      {/* Main Chat Workspace */}
      <div className={styles.chatArea}>
        <Space3DBackground 
          opacity={messages.length === 0 ? 0.85 : 0.38} 
          showGrid={true} 
          interactive={true} 
        />

        {/* Sub-Header Bar on Canvas */}
        <div className={styles.canvasHeader}>
          <div className={styles.canvasHeaderLeft}>
            {!sidebarOpen && (
              <button 
                className={styles.toggleSidebarBtn}
                onClick={() => setSidebarOpen(true)}
                title="Open chat history"
              >
                <PanelLeft size={16} />
              </button>
            )}

            <div className={styles.activeConvTitle}>
              {activeConversation?.title || (messages.length > 0 ? "Active Dialogue Session" : "New Conversation")}
            </div>

            <div className={styles.headerModeBadge}>
              <span className={styles.headerModeBadgeDot}></span>
              <span>Dual-Mode AI Engine</span>
            </div>
          </div>

          <button className="btn-secondary" style={{ padding: '5px 11px', fontSize: '0.78rem' }} onClick={handleNewConversation}>
            <Plus size={12} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className={styles.chatHistory}>
          {messages.length === 0 ? (
            /* Empty State: 3D Holographic Orb + Refined Starter Cards */
            <div className={styles.welcomeSection}>
              <AI3DOrb size={190} interactive={true} />
              
              <div className={styles.welcomeBadge}>
                <Sparkles size={12} color="var(--accent-cyan)" />
                <span>Verified Institutional Knowledge Engine • Zero Hallucination</span>
              </div>

              <h1 className={styles.welcomeGreeting}>
                {getTimeGreeting()}, <span className="gradient-text-accent">{user?.name ? user.name.split(' ')[0] : 'Scholar'}</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                How can I assist your academic journey today? Select an official inquiry or ask anything about degree curricula, hostels, or faculty below.
              </p>

              <div className={styles.starterGrid}>
                <div 
                  className={styles.starterCard} 
                  onClick={() => handleSend("What are all the compulsory Programme Core courses for B.Tech CSE Core?")}
                >
                  <div className={styles.starterLeft}>
                    <div className={styles.starterIcon}>📘</div>
                    <div className={styles.starterContent}>
                      <span className={styles.starterTitle}>B.Tech CSE Core Syllabi</span>
                      <span className={styles.starterPrompt}>Programme Core subjects, course codes & credit details</span>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className={styles.starterArrow} />
                </div>

                <div 
                  className={styles.starterCard} 
                  onClick={() => handleSend("What are the Sunday outing return timings, late penalties, and extra 3-hour extension procedure?")}
                >
                  <div className={styles.starterLeft}>
                    <div className={styles.starterIcon}>🏠</div>
                    <div className={styles.starterContent}>
                      <span className={styles.starterTitle}>Hostel Outing Regulations</span>
                      <span className={styles.starterPrompt}>6:30 PM deadline, biometric checks, and extension rules</span>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className={styles.starterArrow} />
                </div>

                <div 
                  className={styles.starterCard} 
                  onClick={() => handleSend("Where is Dr. Hari Seetha's cabin and what is her designation and department?")}
                >
                  <div className={styles.starterLeft}>
                    <div className={styles.starterIcon}>📍</div>
                    <div className={styles.starterContent}>
                      <span className={styles.starterTitle}>Faculty & Cabin Locator</span>
                      <span className={styles.starterPrompt}>Locate professors, designations, and campus office cabins</span>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className={styles.starterArrow} />
                </div>

                <div 
                  className={styles.starterCard} 
                  onClick={() => handleSend("Draft a formal email to my School Dean requesting permission for an academic hackathon leave.")}
                >
                  <div className={styles.starterLeft}>
                    <div className={styles.starterIcon}>✉️</div>
                    <div className={styles.starterContent}>
                      <span className={styles.starterTitle}>Draft Official Email</span>
                      <span className={styles.starterPrompt}>Compose polished request letters to Deans or Coordinators</span>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className={styles.starterArrow} />
                </div>
              </div>
            </div>
          ) : (
            /* Dialogue Messages */
            <div className={styles.messageGroup}>
              {messages.map((msg, idx) => (
                msg.role === 'user' ? (
                  <div key={idx} className={styles.userMessage}>
                    <div className={styles.userBubble}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className={styles.aiMessage}>
                    <div className={styles.aiAvatar}>
                      <Bot size={20} color="#FFFFFF" />
                    </div>

                    <div className={styles.aiContentWrapper}>
                      <div className={styles.aiBubble}>
                        <div className={styles.aiBubbleHeader}>
                          {msg.sources && msg.sources.length > 0 ? (
                            <div className={styles.aiModePillGrounded}>
                              <ShieldCheck size={12} />
                              <span>VIT-AP Ground Truth RAG</span>
                            </div>
                          ) : (
                            <div className={styles.aiModePillConversational}>
                              <Sparkles size={12} />
                              <span>Conversational Intelligence</span>
                            </div>
                          )}
                          <span className={styles.aiModelBadge}>Gemini 2.0 Flash</span>
                        </div>

                        <div className={styles.markdownBody}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {loading && idx === messages.length - 1 && (
                            <span className="streaming-cursor"></span>
                          )}
                        </div>

                        {/* Expandable Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className={styles.sourcesCard} style={{ marginTop: '14px' }}>
                            <div className={styles.sourcesHeader} onClick={() => toggleSources(idx)}>
                              <div className={styles.sourcesTitle}>
                                <FileText size={14} />
                                <span>Verified Sources Cited</span>
                                <span className={styles.sourcesBadge}>{msg.sources.length}</span>
                              </div>
                              {expandedSources[idx] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </div>

                            {expandedSources[idx] !== false && (
                              <div className={styles.sourcesList}>
                                {msg.sources.map((src, sIdx) => {
                                  const name = src.document_name || src.metadata?.filename || 'Official Document';
                                  const pageStr = src.page ? ` • p. ${src.page}` : '';
                                  const webUrl = src.source_url || (src.metadata && src.metadata.source_url);
                                  const isWeb = webUrl && webUrl.startsWith('http');

                                  if (isWeb) {
                                    return (
                                      <a
                                        key={sIdx}
                                        href={webUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.sourcePill}
                                        title={`Open Official Web Source: ${webUrl}`}
                                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                                      >
                                        <ExternalLink size={12} color="var(--accent-cyan)" />
                                        <span>{name}</span>
                                      </a>
                                    );
                                  }

                                  return (
                                    <div key={sIdx} className={styles.sourcePill} title={`Document: ${name}`}>
                                      <FileText size={12} color="var(--accent-cyan)" />
                                      <span>{name}{pageStr}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Toolbar */}
                      {msg.content && (
                        <div className={styles.actionToolbar}>
                          <button 
                            className={styles.toolbarBtn} 
                            onClick={() => handleCopy(msg.content, idx)}
                            title="Copy answer to clipboard"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check size={13} color="var(--accent-emerald)" />
                                <span style={{ color: 'var(--accent-emerald)' }}>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {msg.feedbackSubmitted ? (
                            <span style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)', padding: '0 8px' }}>
                              ✓ Thanks for your feedback!
                            </span>
                          ) : (
                            <>
                              <button 
                                className={styles.toolbarBtn} 
                                onClick={() => handleFeedback(idx, 1)} 
                                title="Mark as helpful"
                              >
                                <ThumbsUp size={13} />
                              </button>
                              <button 
                                className={styles.toolbarBtn} 
                                onClick={() => handleFeedback(idx, -1)} 
                                title="Mark as unhelpful"
                              >
                                <ThumbsDown size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}

              {/* Thinking Indicator */}
              {loading && messages.length > 0 && messages[messages.length - 1].content === '' && (
                <div className={styles.aiMessage}>
                  <div className={styles.aiAvatar}>
                    <Bot size={20} color="#FFFFFF" className="animate-spin-slow" />
                  </div>
                  <div className={styles.aiContentWrapper}>
                    <div className={styles.aiBubble} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="streaming-cursor"></span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        Consulting verified university knowledge base...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Overlap-Proof Floating Input Composer */}
        <div className={styles.inputContainer}>
          {loading && (
            <div className={styles.stopGeneratingRow}>
              <button className={styles.stopButton} onClick={handleStop}>
                <Square size={13} fill="#F87171" />
                <span>Stop generating</span>
              </button>
            </div>
          )}

          <div className={styles.composerGlass}>
            <textarea
              ref={textareaRef}
              rows={1}
              autoComplete="off"
              spellCheck={false}
              className={styles.composerInput}
              placeholder={loading ? "Generating response (click Stop to cancel)..." : "Ask anything about academic regulations, syllabus, hostels..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
            />

            <button 
              className={styles.sendBtn} 
              onClick={() => handleSend()} 
              disabled={!query.trim() || loading}
              title="Send question (Enter)"
            >
              <Send size={16} />
            </button>
          </div>

          <div className={styles.inputDisclaimer}>
            Answers are grounded in official VIT-AP university documents • Sub-70ms Semantic Cache Active
          </div>
        </div>
      </div>
    </div>
  );
}
