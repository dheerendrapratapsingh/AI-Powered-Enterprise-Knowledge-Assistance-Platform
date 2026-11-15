import { ArrowRight, Bot, ShieldCheck, Zap, Database, CheckCircle2, BookOpen, MapPin, Mail, Layers } from 'lucide-react';
import { AI3DOrb } from '../components/AI3DOrb';
import { KnowledgeNetworkBg } from '../components/KnowledgeNetworkBg';
import styles from './LandingPage.module.css';

interface LandingPageProps {
  onGetStarted: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function LandingPage({ onGetStarted, onSelectPrompt }: LandingPageProps) {
  const handlePromptClick = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    } else {
      onGetStarted();
    }
  };

  return (
    <div className={styles.landingContainer}>
      <KnowledgeNetworkBg />

      {/* Navigation Header */}
      <header className={styles.navbar}>
        <div className={styles.brand} onClick={onGetStarted}>
          <div className={styles.logoIcon}>
            <Bot size={22} color="#FFFFFF" />
          </div>
          <span className={styles.brandName}>VIT-AP Copilot</span>
          <span className={styles.brandBadge}>Enterprise AI</span>
        </div>

        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Architecture</a>
          <a href="#knowledge" className={styles.navLink}>Knowledge Base</a>
          <button className="btn-primary" onClick={onGetStarted}>
            Launch Copilot <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.announcementPill}>
            <span className={styles.announcementDot}></span>
            <span>Hybrid Engine Active • Google Gemini 2.0 Flash</span>
          </div>

          <h1 className={styles.headline}>
            Your University. <br />
            <span className="gradient-text-accent">One Intelligent Copilot.</span>
          </h1>

          <p className={styles.description}>
            Instant, verified intelligence across academic syllabi, multi-degree curricula,
            hostel regulations, and faculty directories with mathematical anti-hallucination precision.
          </p>

          <div className={styles.ctaGroup}>
            <button className="btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }} onClick={onGetStarted}>
              Start Chatting <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem' }}>
              Explore Capabilities
            </a>
          </div>

          {/* Prompt Starter Pills */}
          <div className={styles.promptSuggestions}>
            <span className={styles.promptLabel}>Try asking the copilot:</span>
            <div className={styles.promptPillsRow}>
              <button 
                className={styles.heroPromptPill}
                onClick={() => handlePromptClick("What are all the compulsory Programme Core courses for B.Tech CSE Core?")}
              >
                <BookOpen size={13} color="var(--accent-cyan)" />
                B.Tech CSE Core Syllabi
              </button>
              <button 
                className={styles.heroPromptPill}
                onClick={() => handlePromptClick("What are the Sunday outing return timings and extra 3-hour extension rules?")}
              >
                <ShieldCheck size={13} color="var(--accent-violet)" />
                Hostel Outing Rules
              </button>
              <button 
                className={styles.heroPromptPill}
                onClick={() => handlePromptClick("Where is Dr. Hari Seetha's cabin and what is her designation?")}
              >
                <MapPin size={13} color="var(--accent-emerald)" />
                Faculty Contact Directory
              </button>
              <button 
                className={styles.heroPromptPill}
                onClick={() => handlePromptClick("Draft a polite email to my Course Coordinator requesting syllabus clarification.")}
              >
                <Mail size={13} color="var(--accent-primary)" />
                Draft Coordinator Email
              </button>
            </div>
          </div>
        </div>

        {/* 3D Visual Centerpiece */}
        <div className={styles.heroVisual}>
          <div className={styles.orbWrapper}>
            <div className={styles.orbAura}></div>
            <AI3DOrb size={320} interactive={true} />

            {/* Floating Telemetry Badges */}
            <div className={`${styles.floatingBadge} ${styles.floatingBadgeTop}`}>
              <Zap size={16} color="var(--accent-cyan)" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#FFF' }}>Sub-70ms</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Semantic Vector Cache</span>
              </div>
            </div>

            <div className={`${styles.floatingBadge} ${styles.floatingBadgeBottom}`}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#FFF' }}>100% Ground Truth</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Zero Course Bleed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className={styles.metricsSection}>
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>&lt; 70ms</span>
            <span className={styles.metricLabel}>Instant Semantic Cache Response</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>100%</span>
            <span className={styles.metricLabel}>Anti-Hallucination Ground Truth Guardrail</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>0%</span>
            <span className={styles.metricLabel}>Local GPU Load (Cloud Gemini 2.0 Flash)</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>99.9%</span>
            <span className={styles.metricLabel}>High-Availability Service Uptime</span>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Engineered for Excellence</span>
          <h2 className={styles.sectionTitle}>Enterprise Architecture Designed for Campus Intelligence</h2>
          <p className={styles.sectionSubtitle}>
            Built specifically to overcome the severe limitations of standard RAG systems when ingesting complex institutional documents.
          </p>
        </div>

        <div className={styles.featureGrid}>
          <div className={`glass-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <Layers size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Coordinate-Based PDF Extraction</h3>
            <p className={styles.featureCardDesc}>
              Universal two-column coordinate parser (splitting pages at x=295) isolates left and right syllabus columns, mathematically locking course codes to their exact titles and credits.
            </p>
          </div>

          <div className={`glass-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <ShieldCheck size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Degree & Domain Isolation</h3>
            <p className={styles.featureCardDesc}>
              Context-aware vector filtering prevents cross-curricular contamination. When querying B.Tech CSE Core, CSBS and BBA courses are automatically suppressed.
            </p>
          </div>

          <div className={`glass-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <Zap size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Sub-70ms Semantic Cache</h3>
            <p className={styles.featureCardDesc}>
              SQLite-backed dense vector cache checks cosine similarity (&ge; 0.95). Frequent student inquiries are answered in 67 milliseconds—over 1,700x faster than cold LLM execution.
            </p>
          </div>

          <div className={`glass-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <Bot size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Hybrid AI Engine</h3>
            <p className={styles.featureCardDesc}>
              Blazing-fast Google Gemini 2.0 Flash primary streams tokens at 100+ tokens/sec with zero local GPU requirements. Seamless offline fallback to Ollama (qwen2.5:1.5b).
            </p>
          </div>

          <div className={`glass-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <Mail size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Institutional Email Drafting</h3>
            <p className={styles.featureCardDesc}>
              Intent-aware prompt synthesis formats structured, polite emails to School Deans, Faculty, and Hostel Wardens with student signature blocks.
            </p>
          </div>

          <div className={`glass-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>
              <Database size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Dynamic Knowledge Portal</h3>
            <p className={styles.featureCardDesc}>
              No hardcoded policies. Org Admins upload PDFs, DOCX, CSV, and Excel directories through a drag-and-drop web portal with automated FAISS indexing.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Knowledge Base Section */}
      <section id="knowledge" className={styles.knowledgeSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Verified Knowledge Sources</span>
          <h2 className={styles.sectionTitle}>Official Institutional Knowledge Base</h2>
          <p className={styles.sectionSubtitle}>
            Every answer is backed by exact citations with document names and page numbers.
          </p>
        </div>

        <div className={styles.knowledgeGrid}>
          <div className={`glass-card ${styles.knowledgeCard}`}>
            <span className={styles.docIcon}>📘</span>
            <h4 className={styles.docTitle}>B.Tech CSE Core</h4>
            <p className={styles.docSubtitle}>Programme Core, University Core & Electives curriculum</p>
            <span className={styles.docStatus}>
              <CheckCircle2 size={14} /> Ready & Indexed
            </span>
          </div>

          <div className={`glass-card ${styles.knowledgeCard}`}>
            <span className={styles.docIcon}>📗</span>
            <h4 className={styles.docTitle}>B.Tech CSBS</h4>
            <p className={styles.docSubtitle}>Computer Science & Business Systems syllabus</p>
            <span className={styles.docStatus}>
              <CheckCircle2 size={14} /> Ready & Indexed
            </span>
          </div>

          <div className={`glass-card ${styles.knowledgeCard}`}>
            <span className={styles.docIcon}>🏢</span>
            <h4 className={styles.docTitle}>Hostel Regulations</h4>
            <p className={styles.docSubtitle}>Outing hours, General Leave protocol & night attendance</p>
            <span className={styles.docStatus}>
              <CheckCircle2 size={14} /> Ready & Indexed
            </span>
          </div>

          <div className={`glass-card ${styles.knowledgeCard}`}>
            <span className={styles.docIcon}>📇</span>
            <h4 className={styles.docTitle}>Faculty Directory</h4>
            <p className={styles.docSubtitle}>Cabin numbers, designations & department contacts</p>
            <span className={styles.docStatus}>
              <CheckCircle2 size={14} /> Ready & Indexed
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={styles.logoIcon} style={{ width: 28, height: 28 }}>
              <Bot size={16} color="#FFFFFF" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>VIT-AP AI Copilot</span>
          </div>

          <p className={styles.footerText}>
            © 2026 VIT-AP AI Copilot. Built with Google DeepMind & FastAPI technologies.
          </p>

          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }} onClick={onGetStarted}>
            Launch Portal
          </button>
        </div>
      </footer>
    </div>
  );
}
