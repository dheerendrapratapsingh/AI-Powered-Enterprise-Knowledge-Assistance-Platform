import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  MessageSquare,
  Plus,
  Compass,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SourceCitation, type Citation } from '../components/SourceCitation';
import { WorkflowSteps, type WorkflowStep } from '../components/WorkflowSteps';
import styles from './EmployeeChat.module.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  workflow?: {
    title: string;
    steps: WorkflowStep[];
  };
  relatedQuestions?: string[];
  feedback?: 'like' | 'dislike' | null;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    sender: 'user',
    content: 'How do I deploy a microservice to our production cluster?',
    timestamp: '10:24 AM',
  },
  {
    id: 'msg_2',
    sender: 'assistant',
    content:
      'To deploy any microservice to the production Kubernetes cluster, you must adhere to the standard release process outlined in our engineering guidelines. Ensure all CI pipeline checks pass and peer reviews are signed off before triggering the rollout.',
    timestamp: '10:24 AM',
    citations: [
      {
        id: 'c1',
        docTitle: 'Developer Deployment Guide',
        page: 18,
        snippet:
          'Production rollout requires all automated smoke tests to pass with 0 critical vulnerabilities in Trivy scans. Merges to main trigger a staged canary deployment.',
        relevanceScore: 0.96,
      },
      {
        id: 'c2',
        docTitle: 'Production Deployment SOP v4',
        page: 4,
        snippet:
          'Incident commander and Tech Lead approvals must be recorded in Jira issue prior to initiating kubectl rollout undo or helm upgrade commands.',
        relevanceScore: 0.91,
      },
    ],
    workflow: {
      title: 'Production Microservice Deployment SOP',
      steps: [
        {
          stepNumber: 1,
          title: 'Create Release Branch & PR',
          description: 'Cut branch from release/vX.Y and ensure green status on GitHub Actions CI.',
        },
        {
          stepNumber: 2,
          title: 'Execute Automated Security Scans',
          description: 'Run SAST + container vulnerability scan. No high/critical CVEs allowed.',
        },
        {
          stepNumber: 3,
          title: 'Submit Release Ticket in Jira',
          description: 'Fill rollback plan and verification checklist; tag Engineering Lead.',
        },
        {
          stepNumber: 4,
          title: 'Trigger ArgoCD Canary Rollout',
          description: 'Deploy 10% traffic canary for 15 minutes while monitoring Datadog error rates.',
          actionUrl: 'https://argocd.internal.acme.corp',
          actionLabel: 'Open ArgoCD Portal',
        },
        {
          stepNumber: 5,
          title: 'Promote to 100% Traffic',
          description: 'Complete full deployment and verify health probes return HTTP 200 OK.',
        },
      ],
    },
    relatedQuestions: [
      'What is the rollback procedure if canary fails?',
      'Who is the secondary on-call approver for urgent hotfixes?',
      'Where do I check Datadog APM dashboard links?',
    ],
    feedback: null,
  },
];

const PRESET_TOPICS = [
  { icon: '🚀', title: 'Deploy a project', query: 'How do I deploy a project to staging and production?' },
  { icon: '🏖️', title: 'Leave & PTO policy', query: 'What is our annual leave policy and how do I apply on Keka?' },
  { icon: '🔐', title: 'VPN & Access setup', query: 'How do I request WireGuard VPN access for cloud environments?' },
  { icon: '💻', title: 'Hardware budget', query: 'What is the equipment allowance policy for remote engineers?' },
];

export function EmployeeChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // Dynamic response generation simulating RAG + Qwen3-8B
    setTimeout(() => {
      let aiResponse: Message;

      if (query.toLowerCase().includes('leave') || query.toLowerCase().includes('pto')) {
        aiResponse = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          content:
            'Employees are allocated 24 days of paid time off (PTO) annually, credited at 2 days per calendar month. A maximum of 10 unused days may be carried over to the subsequent financial year. All leaves must be submitted via the HR portal at least 3 business days in advance.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: [
            {
              id: 'c_hr_1',
              docTitle: 'HR Policies & Benefits Handbook 2026',
              page: 12,
              snippet: 'Paid Time Off accrues at 2.0 days/month for full-time employees. Unused leave carryover limit is 10 days.',
              relevanceScore: 0.97,
            },
          ],
          workflow: {
            title: 'PTO Application Workflow',
            steps: [
              {
                stepNumber: 1,
                title: 'Check Leave Balance',
                description: 'Verify remaining balance in the Keka HR portal under My Leaves.',
              },
              {
                stepNumber: 2,
                title: 'Submit Leave Request',
                description: 'Select start/end dates and provide emergency contact information.',
              },
              {
                stepNumber: 3,
                title: 'Manager Approval',
                description: 'Direct manager receives notification and must approve within 48h.',
              },
            ],
          },
          relatedQuestions: [
            'What is the parental leave duration?',
            'How do sick leaves differ from PTO?',
            'What is the encashment policy upon separation?',
          ],
          feedback: null,
        };
      } else if (query.toLowerCase().includes('vpn') || query.toLowerCase().includes('access')) {
        aiResponse = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          content:
            'Remote access to internal staging and production infrastructure is managed strictly via WireGuard VPN paired with Okta SSO MFA. Ensure your device is registered with MDM (Jamf/Intune) before requesting access keys.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: [
            {
              id: 'c_sec_1',
              docTitle: 'Information Security & Zero Trust Network Policy',
              page: 7,
              snippet: 'WireGuard profiles expire after 90 days. Endpoint compliance check is required every 30 days.',
              relevanceScore: 0.94,
            },
          ],
          workflow: {
            title: 'VPN Onboarding Steps',
            steps: [
              { stepNumber: 1, title: 'Install WireGuard Client', description: 'Download client from internal software catalog.' },
              { stepNumber: 2, title: 'Generate Keypair', description: 'Run "nexa-access gen-keys" in CLI to create your public/private pair.' },
              { stepNumber: 3, title: 'Submit ServiceNow Ticket', description: 'Attach public key and select target cluster environments.' },
            ],
          },
          relatedQuestions: [
            'How do I troubleshoot VPN DNS resolution errors?',
            'Which IP ranges require active VPN?',
          ],
          feedback: null,
        };
      } else {
        aiResponse = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          content: `Based on your organization's verified documentation, here is the answer regarding: "${query}". All policies are indexed directly from your organization knowledge base and grounded using strict RAG retrieval to prevent hallucination.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: [
            {
              id: `c_gen_${Date.now()}`,
              docTitle: 'Enterprise Knowledge Hub — General Guidelines',
              page: 1,
              snippet: `Verified organizational reference chunk corresponding to query terms for ${user?.orgName || 'Acme Corp'}.`,
              relevanceScore: 0.89,
            },
          ],
          relatedQuestions: [
            'Can you explain this with more technical details?',
            'Who is the domain owner responsible for this policy?',
          ],
          feedback: null,
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 800);
  };

  const handleFeedback = (msgId: string, rating: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: m.feedback === rating ? null : rating } : m))
    );
  };

  const copyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
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
                <Sparkles size={28} className={styles.sparkleIcon} />
              </div>
              <h1 className={styles.welcomeTitle}>
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0] || 'Employee'}
              </h1>
              <p className={styles.welcomeSubtitle}>
                I am your {user?.orgName || 'Enterprise'} AI Knowledge Assistant. Ask me anything about policies, procedures, or docs.
              </p>

              <div className={styles.quickActions}>
                {PRESET_TOPICS.map((topic) => (
                  <button
                    key={topic.title}
                    className={`glass-panel ${styles.actionButton}`}
                    onClick={() => handleSend(topic.query)}
                  >
                    <span className={styles.actionIcon}>{topic.icon}</span>
                    <div className={styles.actionInfo}>
                      <span className={styles.actionText}>{topic.title}</span>
                      <span className={styles.actionSub}>{topic.query}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messagesContainer}>
              {messages.map((msg) => (
                <div key={msg.id} className={styles.messageGroup}>
                  {msg.sender === 'user' ? (
                    <div className={styles.userMessageRow}>
                      <div className={styles.userMessage}>
                        <div className={styles.messageContent}>{msg.content}</div>
                        <span className={styles.timestamp}>{msg.timestamp}</span>
                      </div>
                      <div className={styles.userAvatar}>
                        {user?.avatarInitial || 'U'}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.aiMessageRow}>
                      <div className={styles.aiAvatar}>
                        <div className={styles.logoIconSmall} />
                      </div>
                      <div className={styles.aiMessageBody}>
                        <div className={styles.aiMessageHeader}>
                          <span className={styles.aiName}>NexaAI Assistant</span>
                          <span className={styles.timestamp}>{msg.timestamp}</span>
                        </div>

                        <div className={styles.messageContent}>
                          <p className={styles.responseText}>{msg.content}</p>

                          {/* Workflow Steps if present */}
                          {msg.workflow && (
                            <WorkflowSteps
                              workflowTitle={msg.workflow.title}
                              steps={msg.workflow.steps}
                            />
                          )}

                          {/* Source Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <SourceCitation citations={msg.citations} />
                          )}

                          {/* Related Questions */}
                          {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                            <div className={styles.relatedSection}>
                              <span className={styles.relatedLabel}>Related questions:</span>
                              <div className={styles.chipsRow}>
                                {msg.relatedQuestions.map((q) => (
                                  <button
                                    key={q}
                                    className={styles.chipBtn}
                                    onClick={() => handleSend(q)}
                                  >
                                    <ChevronRight size={13} />
                                    <span>{q}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer: Copy & Feedback */}
                          <div className={styles.aiMessageFooter}>
                            <button
                              className={styles.copyBtn}
                              onClick={() => copyText(msg.id, msg.content)}
                              title="Copy response"
                            >
                              {copiedId === msg.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <div className={styles.feedbackSection}>
                              <span className={styles.feedbackText}>Was this helpful?</span>
                              <button
                                className={`${styles.feedbackBtn} ${msg.feedback === 'like' ? styles.feedbackActive : ''}`}
                                onClick={() => handleFeedback(msg.id, 'like')}
                                title="Helpful"
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <button
                                className={`${styles.feedbackBtn} ${msg.feedback === 'dislike' ? styles.feedbackActive : ''}`}
                                onClick={() => handleFeedback(msg.id, 'dislike')}
                                title="Not helpful"
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className={styles.aiMessageRow}>
                  <div className={styles.aiAvatar}>
                    <div className={styles.logoIconSmall} />
                  </div>
                  <div className={styles.loadingBubble}>
                    <div className={styles.typingDots}>
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className={styles.loadingText}>Retrieving from knowledge base & generating...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className={styles.inputContainer}>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              handleSend();
            }}
            className={`glass-panel ${styles.inputWrapper}`}
          >
            <input
              type="text"
              className={styles.inputField}
              placeholder="Ask anything about policies, procedures, SOPs, engineering..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputQuery.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </form>
          <div className={styles.inputDisclaimer}>
            <span>NexaAI RAG Grounded</span> • Responses reference verified {user?.orgName || 'organization'} documents.
          </div>
        </div>
      </div>

      {/* Right Sidebar - History & Context */}
      <div className={styles.contextSidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={clearChat}>
            <Plus size={16} /> New Chat
          </button>
        </div>

        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>
            <MessageSquare size={16} /> Recent Conversations
          </h3>
          <div className={styles.historyList}>
            <div className={styles.historyGroup}>
              <div className={styles.historyLabel}>Today</div>
              <button
                className={styles.historyItemActive}
                onClick={() => handleSend('How do I deploy a microservice to production?')}
              >
                Production microservice deployment
              </button>
              <button
                className={styles.historyItem}
                onClick={() => handleSend('What is our annual leave policy?')}
              >
                Annual leave & PTO policy
              </button>
              <button
                className={styles.historyItem}
                onClick={() => handleSend('How do I request WireGuard VPN access?')}
              >
                VPN & Zero Trust onboarding
              </button>
            </div>
            <div className={styles.historyGroup}>
              <div className={styles.historyLabel}>Yesterday</div>
              <button className={styles.historyItem}>ServiceNow incident escalation</button>
              <button className={styles.historyItem}>Developer hardware allowance</button>
            </div>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>
            <Compass size={16} /> Quick Prompts
          </h3>
          <div className={styles.suggestionsList}>
            {[
              'Who approves travel expense claims over $500?',
              'What are the SLAs for Tier 1 customer outages?',
              'How to request emergency database write access?',
            ].map((prompt) => (
              <button
                key={prompt}
                className={styles.suggestionBtn}
                onClick={() => handleSend(prompt)}
              >
                <span>{prompt}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
