import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bot,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Database,
  Building2,
  MapPin,
  Mail,
  ChevronRight,
  BookOpen,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { AI3DOrb } from '../components/AI3DOrb';
import styles from './LandingPage.module.css';

interface LandingPageProps {
  onGetStarted: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function LandingPage({ onGetStarted, onSelectPrompt }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'hostel' | 'email'>('curriculum');
  const [activeStep, setActiveStep] = useState<number>(1);

  // Auto-cycle through the 4 steps of the retrieval pipeline
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleLaunchPrompt = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    } else {
      onGetStarted();
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Global Navigation Bar */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.brand} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className={styles.brandEmblem}>
              <Bot size={18} color="#FFFFFF" />
            </div>
            <div className={styles.brandTextGroup}>
              <span className={styles.brandTitle}>VIT-AP Copilot</span>
              <span className={styles.brandSubtitle}>Campus Intelligence</span>
            </div>
          </div>

          <div className={styles.navLinks}>
            <button className={styles.navLink} onClick={() => scrollToSection('overview')}>Overview</button>
            <button className={styles.navLink} onClick={() => scrollToSection('capabilities')}>Capabilities</button>
            <button className={styles.navLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button className={styles.navLink} onClick={() => scrollToSection('knowledge')}>Knowledge Base</button>
            <button className={styles.navLink} onClick={() => scrollToSection('preview')}>Interface</button>
          </div>

          <div className={styles.navActions}>
            <button className={styles.primaryNavBtn} onClick={onGetStarted}>
              <span>Launch Copilot</span>
              <ArrowRight size={14} />
            </button>

            <button
              className={styles.mobileToggleBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileNavMenu}>
            <button className={styles.mobileNavLink} onClick={() => scrollToSection('overview')}>Overview</button>
            <button className={styles.mobileNavLink} onClick={() => scrollToSection('capabilities')}>Capabilities</button>
            <button className={styles.mobileNavLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button className={styles.mobileNavLink} onClick={() => scrollToSection('knowledge')}>Knowledge Base</button>
            <button className={styles.mobileNavLink} onClick={() => scrollToSection('preview')}>Interface</button>
            <button className={styles.mobilePrimaryBtn} onClick={onGetStarted}>
              Launch Copilot <ArrowRight size={15} />
            </button>
          </div>
        )}
      </nav>

      {/* 2. Hero Section (Editorial Split Composition) */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          {/* Left Editorial Text Column */}
          <div className={styles.heroLeft}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowDot}></span>
              <span>THE INTELLIGENT CAMPUS INTERFACE</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Everything about your university. <br />
              <span className={styles.heroHeadlineLight}>One conversation away.</span>
            </h1>

            <p className={styles.heroSupportingText}>
              Find academic information, understand university regulations, explore institutional documents,
              and access campus knowledge through VIT-AP Copilot.
            </p>

            <div className={styles.heroActionGroup}>
              <button className={styles.ctaPrimaryBtn} onClick={onGetStarted}>
                <span>Explore Copilot</span>
                <ArrowRight size={15} />
              </button>
              <button className={styles.ctaSecondaryBtn} onClick={() => scrollToSection('overview')}>
                <span>Discover the Platform</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Quick Starter Queries */}
            <div className={styles.heroPromptRow}>
              <span className={styles.heroPromptLabel}>Common Inquiries:</span>
              <div className={styles.heroPromptList}>
                <button
                  className={styles.heroPromptChip}
                  onClick={() => handleLaunchPrompt("What are the compulsory Programme Core courses for B.Tech CSE Core?")}
                >
                  <BookOpen size={12} className={styles.chipIcon} />
                  <span>B.Tech CSE Core Syllabi</span>
                </button>
                <button
                  className={styles.heroPromptChip}
                  onClick={() => handleLaunchPrompt("What are the Sunday outing return timings and extension procedure?")}
                >
                  <Building2 size={12} className={styles.chipIcon} />
                  <span>Hostel Outing Rules</span>
                </button>
                <button
                  className={styles.heroPromptChip}
                  onClick={() => handleLaunchPrompt("Where is Dr. Hari Seetha's cabin and what is her designation?")}
                >
                  <MapPin size={12} className={styles.chipIcon} />
                  <span>Faculty Locator</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Showcase: Architectural 3D Knowledge Core & Live Grounded Terminal */}
          <div className={styles.heroRight}>
            <div className={styles.heroCardFrame}>
              <div className={styles.heroCardHeader}>
                <div className={styles.macDots}>
                  <span></span><span></span><span></span>
                </div>
                <div className={styles.cardHeaderTitle}>
                  <ShieldCheck size={13} color="var(--accent-cyan)" />
                  <span>Verified Ground Truth Pipeline • VIT-AP Campus</span>
                </div>
                <div className={styles.statusIndicator}>
                  <span className={styles.livePulse}></span>
                  <span>ONLINE</span>
                </div>
              </div>

              {/* Integrated 3D Institutional Core Centerpiece */}
              <div className={styles.core3DContainer}>
                <AI3DOrb size={240} interactive={true} />
                <div className={styles.coreCaption}>
                  <span className={styles.coreCaptionTitle}>INSTITUTIONAL KNOWLEDGE PRISM</span>
                  <span className={styles.coreCaptionDetail}>Faceted Refractive Core • Dual Coordinate Gimbals • 4 Orbiting Anchors</span>
                </div>
              </div>

              {/* Live Interactive Query Snippet Preview */}
              <div className={styles.heroTerminalPreview}>
                <div className={styles.terminalPromptBlock}>
                  <div className={styles.terminalUserRow}>
                    <span className={styles.terminalRoleBadge}>STUDENT INQUIRY</span>
                    <span className={styles.terminalTimestamp}>10:42 AM</span>
                  </div>
                  <p className={styles.terminalUserQuery}>
                    "What are the Sunday hostel outing return timings and penalty for late arrival?"
                  </p>
                </div>

                <div className={styles.terminalResponseBlock}>
                  <div className={styles.terminalAssistantHeader}>
                    <div className={styles.botIconSmall}>
                      <Bot size={13} color="#FFFFFF" />
                    </div>
                    <span className={styles.terminalAssistantLabel}>VIT-AP COPILOT RESPONSE</span>
                    <span className={styles.groundedTag}>GROUNDED</span>
                  </div>
                  <p className={styles.terminalAnswer}>
                    Sunday outings permit students to leave the campus starting at <strong>8:00 AM</strong> with a mandatory return
                    by <strong>6:30 PM</strong>. Biometric attendance is recorded at the hostel turnstiles upon re-entry.
                  </p>
                  <div className={styles.citationBadgeRow}>
                    <span className={styles.citationBadge}>
                      <FileText size={11} />
                      Ladies Hostel Rules & Regulations, Rule 4.2
                    </span>
                    <span className={styles.citationBadge}>
                      <Building2 size={11} />
                      Hostel Notices 2024–25
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Introduction (Editorial Manifesto) */}
      <section id="overview" className={styles.statementSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeaderEditorial}>
            <span className={styles.sectionNumeral}>01 / PLATFORM OVERVIEW</span>
            <h2 className={styles.editorialHeadline}>
              University knowledge, <br />
              <span className={styles.editorialHeadlineAccent}>made accessible.</span>
            </h2>
            <p className={styles.editorialParagraph}>
              University information is often distributed across websites, academic documents, regulations,
              and institutional resources. VIT-AP Copilot brings this knowledge into one conversational experience,
              helping users find relevant information without navigating multiple sources.
            </p>
          </div>

          <div className={styles.editorialThreeCol}>
            <div className={styles.editorialCol}>
              <div className={styles.editorialColNumber}>01</div>
              <h3 className={styles.editorialColTitle}>Single Conversational Access Point</h3>
              <p className={styles.editorialColDesc}>
                Consolidates academic handbooks, curriculum syllabi, examination bylaws, and administrative directories into a single conversational interface.
              </p>
            </div>

            <div className={styles.editorialCol}>
              <div className={styles.editorialColNumber}>02</div>
              <h3 className={styles.editorialColTitle}>Traceable Ground Truth</h3>
              <p className={styles.editorialColDesc}>
                Every answer references verified institutional sources. Direct citations with document titles and page numbers allow users to independently verify information.
              </p>
            </div>

            <div className={styles.editorialCol}>
              <div className={styles.editorialColNumber}>03</div>
              <h3 className={styles.editorialColTitle}>Role-Aware Context Isolation</h3>
              <p className={styles.editorialColDesc}>
                Maintains clean curriculum boundaries. Inquiries regarding B.Tech CSE Core strictly suppress unrelated curricula to eliminate cross-domain confusion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Capabilities Section (Asymmetric Architectural Grid) */}
      <section id="capabilities" className={styles.capabilitiesSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumeral}>02 / CAPABILITIES</span>
            <h2 className={styles.sectionTitle}>Six pillars of campus intelligence.</h2>
            <p className={styles.sectionSubtitle}>
              Engineered specifically for university operational workflows, academic navigation, and student queries.
            </p>
          </div>

          <div className={styles.capabilitiesGrid}>
            {/* Capability 01: Featured Wide Card */}
            <div className={`${styles.capabilityCard} ${styles.capabilityWide}`}>
              <div className={styles.capabilityTopRow}>
                <span className={styles.capNumber}>01</span>
                <span className={styles.capTag}>CURRICULAR FOUNDATION</span>
              </div>
              <h3 className={styles.capTitle}>Academic Knowledge</h3>
              <p className={styles.capDesc}>
                Access programme syllabi, course structures, credit distributions, and prerequisites.
                Coordinate-aware PDF parsing isolates two-column syllabus tables, guaranteeing exact course-code to title mapping.
              </p>
              <div className={styles.capMiniWidget}>
                <div className={styles.courseRow}>
                  <span className={styles.courseCode}>CSE1001</span>
                  <span className={styles.courseName}>Problem Solving and Algorithmic Thinking</span>
                  <span className={styles.courseCredits}>4 Credits • Core</span>
                </div>
                <div className={styles.courseRow}>
                  <span className={styles.courseCode}>CSE2004</span>
                  <span className={styles.courseName}>Database Management Systems</span>
                  <span className={styles.courseCredits}>4 Credits • Core</span>
                </div>
              </div>
            </div>

            {/* Capability 02 */}
            <div className={styles.capabilityCard}>
              <div className={styles.capabilityTopRow}>
                <span className={styles.capNumber}>02</span>
                <span className={styles.capTag}>STUDENT LIFE</span>
              </div>
              <h3 className={styles.capTitle}>University Regulations</h3>
              <p className={styles.capDesc}>
                Understand hostel regulations, Sunday outing timelines, General Leave procedures,
                75% mandatory attendance guidelines, and academic debarment bylaws.
              </p>
              <div className={styles.capHighlightBox}>
                <span className={styles.highlightBadge}>OUTING POLICY</span>
                <span className={styles.highlightText}>Strict 6:30 PM deadline with biometric logging</span>
              </div>
            </div>

            {/* Capability 03 */}
            <div className={styles.capabilityCard}>
              <div className={styles.capabilityTopRow}>
                <span className={styles.capNumber}>03</span>
                <span className={styles.capTag}>DIRECTORY</span>
              </div>
              <h3 className={styles.capTitle}>Institutional Directory</h3>
              <p className={styles.capDesc}>
                Locate faculty members across schools (SCOPE, SENSE, VSB, VSL), find exact cabin numbers,
                employee IDs, and department designations with instant retrieval.
              </p>
              <div className={styles.capHighlightBox}>
                <span className={styles.highlightBadge}>CABIN LOOKUP</span>
                <span className={styles.highlightText}>AB-1 & Central Block office mapping</span>
              </div>
            </div>

            {/* Capability 04 */}
            <div className={styles.capabilityCard}>
              <div className={styles.capabilityTopRow}>
                <span className={styles.capNumber}>04</span>
                <span className={styles.capTag}>RETRIEVAL</span>
              </div>
              <h3 className={styles.capTitle}>Intelligent Document Retrieval</h3>
              <p className={styles.capDesc}>
                Ask natural questions about official institutional PDFs. The dense vector engine
                retrieves matching passages and synthesizes concise, accurate summaries.
              </p>
              <div className={styles.capHighlightBox}>
                <span className={styles.highlightBadge}>VECTOR SEARCH</span>
                <span className={styles.highlightText}>FAISS indexed chunks with cosine similarity</span>
              </div>
            </div>

            {/* Capability 05 */}
            <div className={styles.capabilityCard}>
              <div className={styles.capabilityTopRow}>
                <span className={styles.capNumber}>05</span>
                <span className={styles.capTag}>COMMUNICATION</span>
              </div>
              <h3 className={styles.capTitle}>Institutional Email Assistance</h3>
              <p className={styles.capDesc}>
                Generate structured, formal email drafts addressed to School Deans, Faculty, and Course Coordinators
                for leave permissions, exam queries, or research discussions.
              </p>
              <div className={styles.capHighlightBox}>
                <span className={styles.highlightBadge}>FORMAL TEMPLATES</span>
                <span className={styles.highlightText}>Standardized university etiquette & subject lines</span>
              </div>
            </div>

            {/* Capability 06: Knowledge Management */}
            <div className={`${styles.capabilityCard} ${styles.capabilityWide}`}>
              <div className={styles.capabilityTopRow}>
                <span className={styles.capNumber}>06</span>
                <span className={styles.capTag}>ADMINISTRATION</span>
              </div>
              <h3 className={styles.capTitle}>Knowledge Management & Dual Ingestion</h3>
              <p className={styles.capDesc}>
                Administrators can upload documents (PDF, DOCX, CSV) or initiate automated website crawling across university subdomains.
                New regulations are converted to vectors and indexed without restarting services.
              </p>
              <div className={styles.ingestionBadgeRow}>
                <span className={styles.ingestionBadge}>
                  <FileText size={12} />
                  Administrative Manual Uploads
                </span>
                <span className={styles.ingestionBadge}>
                  <Globe size={12} />
                  Automated vitap.ac.in Web Crawler
                </span>
                <span className={styles.ingestionBadge}>
                  <Database size={12} />
                  Real-time FAISS Re-indexing
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (4-Stage Process Pipeline) */}
      <section id="how-it-works" className={styles.processSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumeral}>03 / PIPELINE</span>
            <h2 className={styles.sectionTitle}>From a question to a grounded answer.</h2>
            <p className={styles.sectionSubtitle}>
              A transparent, multi-stage retrieval architecture designed to ensure academic accuracy.
            </p>
          </div>

          <div className={styles.processStepsRow}>
            {/* Step 1 */}
            <div
              className={`${styles.processStepCard} ${activeStep === 1 ? styles.processStepActive : ''}`}
              onClick={() => setActiveStep(1)}
            >
              <div className={styles.stepNumBadge}>01</div>
              <h4 className={styles.stepName}>Ask</h4>
              <p className={styles.stepDesc}>
                The user submits a question in natural language. The system analyzes query intent and context.
              </p>
              <div className={styles.stepStatus}>Natural Language Input</div>
            </div>

            {/* Step 2 */}
            <div
              className={`${styles.processStepCard} ${activeStep === 2 ? styles.processStepActive : ''}`}
              onClick={() => setActiveStep(2)}
            >
              <div className={styles.stepNumBadge}>02</div>
              <h4 className={styles.stepName}>Retrieve</h4>
              <p className={styles.stepDesc}>
                FAISS dense vector index identifies the most relevant passages across institutional documents.
              </p>
              <div className={styles.stepStatus}>FAISS Vector Search</div>
            </div>

            {/* Step 3 */}
            <div
              className={`${styles.processStepCard} ${activeStep === 3 ? styles.processStepActive : ''}`}
              onClick={() => setActiveStep(3)}
            >
              <div className={styles.stepNumBadge}>03</div>
              <h4 className={styles.stepName}>Verify</h4>
              <p className={styles.stepDesc}>
                Context chunks are verified for curriculum relevance. If information is absent, explicit fallback is triggered.
              </p>
              <div className={styles.stepStatus}>Ground Truth Validation</div>
            </div>

            {/* Step 4 */}
            <div
              className={`${styles.processStepCard} ${activeStep === 4 ? styles.processStepActive : ''}`}
              onClick={() => setActiveStep(4)}
            >
              <div className={styles.stepNumBadge}>04</div>
              <h4 className={styles.stepName}>Respond</h4>
              <p className={styles.stepDesc}>
                Structured answer is streamed token-by-token with exact source document references and page citations.
              </p>
              <div className={styles.stepStatus}>Cited Markdown Output</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Knowledge Base Section (Verified Institutional Sources) */}
      <section id="knowledge" className={styles.knowledgeSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumeral}>04 / KNOWLEDGE SOURCES</span>
            <h2 className={styles.sectionTitle}>Built around institutional knowledge.</h2>
            <p className={styles.sectionSubtitle}>
              Every answer is formulated from verified university documents, curriculum handbooks, and crawled institutional pages.
            </p>
          </div>

          <div className={styles.knowledgeGrid}>
            <div className={styles.docSourceCard}>
              <div className={styles.docHeader}>
                <span className={styles.docType}>ACADEMIC CURRICULUM</span>
                <span className={styles.docStatusLive}>INDEXED</span>
              </div>
              <h4 className={styles.docTitle}>B.Tech CSE Core (2024–28)</h4>
              <p className={styles.docDetails}>
                Complete course catalogue including Programme Core, University Core, and Programme Electives with credit distributions.
              </p>
              <span className={styles.docMeta}>Source: School of Computer Science & Engineering</span>
            </div>

            <div className={styles.docSourceCard}>
              <div className={styles.docHeader}>
                <span className={styles.docType}>ACADEMIC CURRICULUM</span>
                <span className={styles.docStatusLive}>INDEXED</span>
              </div>
              <h4 className={styles.docTitle}>B.Tech CSBS (2024–28)</h4>
              <p className={styles.docDetails}>
                Computer Science & Business Systems curriculum designed in partnership with Tata Consultancy Services (TCS).
              </p>
              <span className={styles.docMeta}>Source: SCOPE & Industry Advisory Board</span>
            </div>

            <div className={styles.docSourceCard}>
              <div className={styles.docHeader}>
                <span className={styles.docType}>CAMPUS REGULATIONS</span>
                <span className={styles.docStatusLive}>INDEXED</span>
              </div>
              <h4 className={styles.docTitle}>Hostel Rules & Notices Handbook</h4>
              <p className={styles.docDetails}>
                Official guidelines regarding Sunday outing timings, night biometric attendance, leave applications, and dining policies.
              </p>
              <span className={styles.docMeta}>Source: Office of the Chief Warden</span>
            </div>

            <div className={styles.docSourceCard}>
              <div className={styles.docHeader}>
                <span className={styles.docType}>INSTITUTIONAL COMPLIANCE</span>
                <span className={styles.docStatusLive}>INDEXED</span>
              </div>
              <h4 className={styles.docTitle}>Public Self-Disclosure Document</h4>
              <p className={styles.docDetails}>
                Statutory regulatory disclosures, fee structures, academic council bylaws, and administrative leadership designations.
              </p>
              <span className={styles.docMeta}>Source: Office of the Registrar</span>
            </div>

            <div className={styles.docSourceCard}>
              <div className={styles.docHeader}>
                <span className={styles.docType}>LIVE WEB CRAWLER</span>
                <span className={styles.docStatusLive}>SYNCHRONIZED</span>
              </div>
              <h4 className={styles.docTitle}>Official VIT-AP Web Subdomains</h4>
              <p className={styles.docDetails}>
                Crawled pages from vitap.ac.in covering school directories, admission FAQs, announcements, and campus directions.
              </p>
              <span className={styles.docMeta}>Source: https://vitap.ac.in (80+ Pages Indexed)</span>
            </div>

            <div className={styles.docSourceCard}>
              <div className={styles.docHeader}>
                <span className={styles.docType}>FACULTY DIRECTORY</span>
                <span className={styles.docStatusLive}>INDEXED</span>
              </div>
              <h4 className={styles.docTitle}>Faculty Cabin & Contact Directory</h4>
              <p className={styles.docDetails}>
                Professors, Associate Professors, Assistant Professors, cabin room numbers in Academic Blocks, and official email addresses.
              </p>
              <span className={styles.docMeta}>Source: Institutional Directory Records</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Trust & Transparency Section */}
      <section className={styles.trustSection}>
        <div className={styles.sectionInner}>
          <div className={styles.trustGrid}>
            <div className={styles.trustLeft}>
              <span className={styles.sectionNumeral}>05 / RELIABILITY PHILOSOPHY</span>
              <h2 className={styles.trustHeadline}>
                Know where your answers come from.
              </h2>
              <p className={styles.trustBody}>
                VIT-AP Copilot is built on an anti-hallucination architecture. Rather than generating answers from ungrounded
                model memory, answers are strictly derived from verified university publications.
              </p>
              <div className={styles.trustPillars}>
                <div className={styles.pillarItem}>
                  <CheckCircle2 size={16} color="var(--accent-cyan)" />
                  <div>
                    <h5 className={styles.pillarTitle}>Direct Document Citations</h5>
                    <p className={styles.pillarText}>Every factual statement cites the document title and page number.</p>
                  </div>
                </div>

                <div className={styles.pillarItem}>
                  <CheckCircle2 size={16} color="var(--accent-cyan)" />
                  <div>
                    <h5 className={styles.pillarTitle}>Explicit Fallback Protocol</h5>
                    <p className={styles.pillarText}>When information is unverified or absent, the Copilot transparently directs users to official university coordinators.</p>
                  </div>
                </div>

                <div className={styles.pillarItem}>
                  <CheckCircle2 size={16} color="var(--accent-cyan)" />
                  <div>
                    <h5 className={styles.pillarTitle}>Domain-Specific Context Filtering</h5>
                    <p className={styles.pillarText}>Strict branch isolation prevents cross-curriculum course bleeding between distinct degrees.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.trustRight}>
              <div className={styles.trustAuditBox}>
                <div className={styles.auditHeader}>
                  <ShieldCheck size={16} color="var(--accent-emerald)" />
                  <span>CITATION AUDIT TRAIL</span>
                </div>
                <div className={styles.auditSnippet}>
                  <div className={styles.auditRow}>
                    <span className={styles.auditKey}>Claim:</span>
                    <span className={styles.auditVal}>Sunday outing curfew is 6:30 PM.</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditKey}>Source Document:</span>
                    <span className={styles.auditVal}>VIT_AP_Ladies_Hostel_Rules_Compiled.docx</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditKey}>Clause / Page:</span>
                    <span className={styles.auditVal}>Section 4: Outing Regulations (p. 2)</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span className={styles.auditKey}>Grounding Status:</span>
                    <span className={styles.auditValVerified}>✓ Verified from University Knowledge Base</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Product Experience Preview (High-Fidelity Interface Demo) */}
      <section id="preview" className={styles.previewSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumeral}>06 / INTERFACE PREVIEW</span>
            <h2 className={styles.sectionTitle}>Experience VIT-AP Copilot.</h2>
            <p className={styles.sectionSubtitle}>
              Clean, distraction-free desktop chat workspace designed for students and faculty.
            </p>
          </div>

          {/* Scenario Tab Controls */}
          <div className={styles.previewTabsRow}>
            <button
              className={`${styles.previewTab} ${activeTab === 'curriculum' ? styles.previewTabActive : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum & Syllabi
            </button>
            <button
              className={`${styles.previewTab} ${activeTab === 'hostel' ? styles.previewTabActive : ''}`}
              onClick={() => setActiveTab('hostel')}
            >
              Hostel Regulations
            </button>
            <button
              className={`${styles.previewTab} ${activeTab === 'email' ? styles.previewTabActive : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Dean Email Drafting
            </button>
          </div>

          {/* High-Fidelity Desktop App Frame */}
          <div className={styles.desktopAppFrame}>
            <div className={styles.desktopAppHeader}>
              <div className={styles.macControls}>
                <span></span><span></span><span></span>
              </div>
              <div className={styles.appTitleCenter}>
                <span>VIT-AP Copilot Workspace — Academic Intelligence</span>
              </div>
              <div className={styles.appRightStatus}>
                <span className={styles.engineBadge}>Campus AI Active</span>
              </div>
            </div>

            <div className={styles.desktopAppBody}>
              {/* Left Sidebar Mockup */}
              <div className={styles.mockSidebar}>
                <div className={styles.mockBrand}>
                  <Bot size={16} color="var(--accent-cyan)" />
                  <span>VIT-AP Copilot</span>
                </div>
                <div className={styles.mockHistoryHeader}>Recent Conversations</div>
                <div className={`${styles.mockHistoryItem} ${activeTab === 'curriculum' ? styles.mockHistoryActive : ''}`}>
                  <span>B.Tech CSE Core Syllabi</span>
                </div>
                <div className={`${styles.mockHistoryItem} ${activeTab === 'hostel' ? styles.mockHistoryActive : ''}`}>
                  <span>Hostel Outing Rules</span>
                </div>
                <div className={`${styles.mockHistoryItem} ${activeTab === 'email' ? styles.mockHistoryActive : ''}`}>
                  <span>Academic Leave Email</span>
                </div>
                <div className={styles.mockUserCard}>
                  <div className={styles.mockAvatar}>S</div>
                  <div className={styles.mockUserInfo}>
                    <span className={styles.mockUserName}>Student Member</span>
                    <span className={styles.mockUserRole}>B.Tech CSE Core</span>
                  </div>
                </div>
              </div>

              {/* Chat Canvas Mockup */}
              <div className={styles.mockCanvas}>
                {activeTab === 'curriculum' && (
                  <div className={styles.mockDialog}>
                    <div className={styles.mockUserMsg}>
                      <p>What are the Programme Core courses for B.Tech CSE Core?</p>
                    </div>
                    <div className={styles.mockAiMsg}>
                      <div className={styles.mockAiHeader}>
                        <ShieldCheck size={13} color="var(--accent-cyan)" />
                        <span>VIT-AP GROUND TRUTH RAG</span>
                      </div>
                      <div className={styles.mockAiContent}>
                        <p>Based on the official <strong>B.Tech CSE Core Curriculum</strong>, the Programme Core courses include:</p>
                        <ul>
                          <li><strong>CSE1001</strong>: Problem Solving and Algorithmic Thinking (4 Credits)</li>
                          <li><strong>CSE1002</strong>: Problem Solving and Object Oriented Programming (4 Credits)</li>
                          <li><strong>CSE2001</strong>: Data Structures and Algorithms (4 Credits)</li>
                          <li><strong>CSE2004</strong>: Database Management Systems (4 Credits)</li>
                          <li><strong>CSE3001</strong>: Computer Networks (4 Credits)</li>
                        </ul>
                      </div>
                      <div className={styles.mockSourcePill}>
                        <FileText size={11} />
                        VITAP-2025+B.Tech+CSE+Core.pdf (p. 2)
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'hostel' && (
                  <div className={styles.mockDialog}>
                    <div className={styles.mockUserMsg}>
                      <p>What are the Sunday outing return timings and penalty for late arrival?</p>
                    </div>
                    <div className={styles.mockAiMsg}>
                      <div className={styles.mockAiHeader}>
                        <ShieldCheck size={13} color="var(--accent-cyan)" />
                        <span>VIT-AP GROUND TRUTH RAG</span>
                      </div>
                      <div className={styles.mockAiContent}>
                        <p>According to the official <strong>VIT-AP Ladies Hostel Rules Handbook</strong>:</p>
                        <ul>
                          <li><strong>Sunday Outing Hours</strong>: Permitted from <strong>8:00 AM</strong> to <strong>6:30 PM</strong>.</li>
                          <li><strong>Attendance Protocol</strong>: Biometric check is mandatory at the hostel security gate.</li>
                          <li><strong>Late Return Penalty</strong>: Returning after 6:30 PM without prior approved extension results in suspension of outing privileges for the next 3 consecutive Sundays.</li>
                        </ul>
                      </div>
                      <div className={styles.mockSourcePill}>
                        <FileText size={11} />
                        VIT_AP_Ladies_Hostel_Rules_Compiled.docx (Rule 4.2)
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div className={styles.mockDialog}>
                    <div className={styles.mockUserMsg}>
                      <p>Draft a formal email to my School Dean requesting permission for an academic hackathon leave.</p>
                    </div>
                    <div className={styles.mockAiMsg}>
                      <div className={styles.mockAiHeader}>
                        <Mail size={13} color="var(--accent-emerald)" />
                        <span>OFFICIAL EMAIL ASSISTANCE</span>
                      </div>
                      <div className={styles.mockAiContent}>
                        <p><strong>Subject:</strong> Request for Academic Leave to Participate in Hackathon — [Your Name] — Reg: [Reg. No.]</p>
                        <p><strong>Respected Dean,</strong></p>
                        <p>I am writing to make an earnest request for permission to attend [Name of Hackathon] scheduled from [Start Date] to [End Date] at [Venue].</p>
                        <p>I have attached the official invitation letter. I undertake to complete all missed class assignments promptly upon return.</p>
                        <p>Sincerely,<br />[Your Name] | [Your Branch, e.g., B.Tech CSE Core] | VIT-AP University</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mock Input Bar */}
                <div className={styles.mockInputBar}>
                  <div className={styles.mockInputPlaceholder}>Ask anything about academic regulations, syllabus, hostels...</div>
                  <button className={styles.mockSendBtn} onClick={onGetStarted}>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className={styles.finalCtaSection}>
        <div className={styles.sectionInner}>
          <div className={styles.finalCtaBox}>
            <div className={styles.finalCtaContent}>
              <span className={styles.finalCtaEyebrow}>START EXPLORING TODAY</span>
              <h2 className={styles.finalCtaHeadline}>Your university, within reach.</h2>
              <p className={styles.finalCtaSubtext}>
                Explore institutional knowledge, find academic information, and get answers through VIT-AP Copilot.
              </p>
              <div className={styles.finalCtaButtons}>
                <button className={styles.finalPrimaryBtn} onClick={onGetStarted}>
                  <span>Launch VIT-AP Copilot</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Institutional Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTopRow}>
            <div className={styles.footerBrandCol}>
              <div className={styles.footerBrand}>
                <div className={styles.brandEmblemSmall}>
                  <Bot size={16} color="#FFFFFF" />
                </div>
                <span className={styles.footerBrandTitle}>VIT-AP Copilot</span>
              </div>
              <p className={styles.footerBrandDesc}>
                An institutional intelligence platform for VIT-AP University, synthesizing curriculum documents,
                campus regulations, and faculty directories into verified conversational assistance.
              </p>
              <div className={styles.footerEngineBadge}>
                <span className={styles.badgePulse}></span>
                <span>Campus Knowledge Base Synchronized</span>
              </div>
            </div>

            <div className={styles.footerNavCol}>
              <h5 className={styles.footerNavTitle}>Platform</h5>
              <button className={styles.footerLink} onClick={() => scrollToSection('overview')}>Platform Overview</button>
              <button className={styles.footerLink} onClick={() => scrollToSection('capabilities')}>Capabilities</button>
              <button className={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button className={styles.footerLink} onClick={() => scrollToSection('preview')}>Interface Demo</button>
            </div>

            <div className={styles.footerNavCol}>
              <h5 className={styles.footerNavTitle}>Knowledge Sources</h5>
              <span className={styles.footerLinkStatic}>B.Tech CSE Core Syllabus</span>
              <span className={styles.footerLinkStatic}>B.Tech CSBS Syllabus</span>
              <span className={styles.footerLinkStatic}>Ladies Hostel Handbook</span>
              <span className={styles.footerLinkStatic}>Public Self-Disclosure Document</span>
              <span className={styles.footerLinkStatic}>Faculty Cabin Directory</span>
            </div>

            <div className={styles.footerNavCol}>
              <h5 className={styles.footerNavTitle}>Access</h5>
              <button className={styles.footerLink} onClick={onGetStarted}>Student Chat Portal</button>
              <button className={styles.footerLink} onClick={onGetStarted}>Admin Knowledge Uploads</button>
              <span className={styles.footerLinkStatic}>Internal Network Only</span>
            </div>
          </div>

          <div className={styles.footerBottomRow}>
            <span className={styles.copyrightText}>
              © 2026 VIT-AP AI Copilot. Developed for VIT-AP University. All rights reserved.
            </span>
            <div className={styles.footerStatusIndicator}>
              <span className={styles.footerDot}></span>
              <span>Grounded Retrieval Pipeline Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
