import { useState } from 'react';
import { Send, FileText, CheckCircle2, User, HelpCircle, ChevronRight, MessageSquare } from 'lucide-react';
import styles from './EmployeeChat.module.css';

export function EmployeeChat() {
  const [query, setQuery] = useState('');
  
  return (
    <div className={styles.container}>
      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        <div className={styles.chatHistory}>
          {/* Welcome Message / Quick Actions */}
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeAvatar}>
              <div className={styles.logoIcon}></div>
            </div>
            <h1 className={styles.welcomeTitle}>Good morning, Dheerendra</h1>
            <p className={styles.welcomeSubtitle}>How can I help you today?</p>
            
            <div className={styles.quickActions}>
              <button className={`glass-panel ${styles.actionButton}`}>
                <span className={styles.actionIcon}>🚀</span>
                <span className={styles.actionText}>Deploy a project</span>
              </button>
              <button className={`glass-panel ${styles.actionButton}`}>
                <span className={styles.actionIcon}>🏖️</span>
                <span className={styles.actionText}>Leave policy</span>
              </button>
              <button className={`glass-panel ${styles.actionButton}`}>
                <span className={styles.actionIcon}>🔐</span>
                <span className={styles.actionText}>VPN access</span>
              </button>
              <button className={`glass-panel ${styles.actionButton}`}>
                <span className={styles.actionIcon}>👥</span>
                <span className={styles.actionText}>Find a person</span>
              </button>
            </div>
          </div>

          {/* Example Chat Message (Workflow Response) */}
          <div className={styles.messageGroup}>
            <div className={styles.userMessage}>
              <div className={styles.messageContent}>
                How do I deploy a project?
              </div>
            </div>
            
            <div className={styles.aiMessage}>
              <div className={styles.aiAvatar}>
                <div className={styles.logoIconSmall}></div>
              </div>
              <div className={styles.messageContent}>
                <p className={styles.responseText}>To deploy a project to the production environment, follow these steps:</p>
                
                <div className={styles.workflowSteps}>
                  <div className={`${styles.step} ${styles.stepCompleted}`}>
                    <CheckCircle2 size={20} className={styles.stepIcon} />
                    <span className={styles.stepText}>Create deployment branch</span>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepCircle}>2</div>
                    <span className={styles.stepText}>Run automated tests</span>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepCircle}>3</div>
                    <span className={styles.stepText}>Submit deployment request</span>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepCircle}>4</div>
                    <span className={styles.stepText}>Get approval</span>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepCircle}>5</div>
                    <span className={styles.stepText}>Deploy to production</span>
                  </div>
                </div>

                <div className={styles.workflowMeta}>
                  <p><strong>Estimated time:</strong> 15 minutes</p>
                  <p><strong>Required access:</strong> GitLab, Production VPN, Deployment portal</p>
                  <button className={styles.primaryButton}>Open Deployment Portal</button>
                </div>

                <div className={styles.sourcesSection}>
                  <h4 className={styles.sourcesTitle}>Sources</h4>
                  <div className={styles.sourcesList}>
                    <div className={styles.sourceTag}>
                      <FileText size={14} />
                      Developer Deployment Guide (Pg 18)
                    </div>
                    <div className={styles.sourceTag}>
                      <FileText size={14} />
                      Production Deployment SOP (Pg 4)
                    </div>
                  </div>
                </div>
                
                <div className={styles.feedbackSection}>
                  <span className={styles.feedbackText}>Was this helpful?</span>
                  <button className={styles.feedbackBtn}>👍</button>
                  <button className={styles.feedbackBtn}>👎</button>
                </div>
              </div>
            </div>
          </div>
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
            />
            <button className={styles.sendButton}>
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
              <button className={styles.historyItemActive}>How do I deploy a project?</button>
              <button className={styles.historyItem}>Leave policy updates</button>
              <button className={styles.historyItem}>Backend deployment owner</button>
            </div>
            <div className={styles.historyGroup}>
              <div className={styles.historyLabel}>Yesterday</div>
              <button className={styles.historyItem}>VPN troubleshooting</button>
              <button className={styles.historyItem}>Development environment setup</button>
            </div>
          </div>
        </div>
        
        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>
            <HelpCircle size={16} /> Suggested Queries
          </h3>
          <div className={styles.suggestionsList}>
            <button className={styles.suggestionBtn}>
              Who approves travel expenses? <ChevronRight size={14} />
            </button>
            <button className={styles.suggestionBtn}>
              What is the Q3 roadmap? <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
