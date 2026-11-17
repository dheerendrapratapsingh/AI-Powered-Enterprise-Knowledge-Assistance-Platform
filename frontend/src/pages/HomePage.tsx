import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Building2,
  MapPin,
  BookOpen,
  ChevronRight,
  Compass,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { SiteNavbar } from '../components/SiteNavbar';
import { SiteFooter } from '../components/SiteFooter';
import { AI3DOrb } from '../components/AI3DOrb';
import styles from './HomePage.module.css';

interface HomePageProps {
  onLaunchCopilot?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function HomePage({ onLaunchCopilot, onSelectPrompt }: HomePageProps) {
  const navigate = useNavigate();

  const handleLaunch = (prompt?: string) => {
    if (prompt && onSelectPrompt) {
      onSelectPrompt(prompt);
    } else if (onLaunchCopilot) {
      onLaunchCopilot();
    } else {
      navigate('/copilot');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <SiteNavbar onLaunchCopilot={() => handleLaunch()} />

      {/* =========================================================================
          SECTION 1: HERO
          ========================================================================= */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          {/* Left Column */}
          <div className={styles.heroLeft}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowDot}></span>
              <span>MADE FOR THE VIT-AP STUDENT COMMUNITY</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Your campus. <br />
              Your questions. <br />
              <span className={styles.heroHeadlineLight}>One intelligent companion.</span>
            </h1>

            <p className={styles.heroSupportingText}>
              From academic syllabi and university regulations to hostel information and institutional resources,
              explore the information you need through VIT-AP Copilot.
            </p>

            <div className={styles.heroActionGroup}>
              <button className={styles.ctaPrimaryBtn} onClick={() => handleLaunch()}>
                <span>Launch Copilot</span>
                <ArrowRight size={15} />
              </button>
              <button className={styles.ctaSecondaryBtn} onClick={() => navigate('/how-to-use')}>
                <span>Discover How to Use</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Common Inquiries */}
            <div className={styles.heroPromptRow}>
              <span className={styles.heroPromptLabel}>Common Student Inquiries:</span>
              <div className={styles.heroPromptList}>
                <button
                  className={styles.heroPromptChip}
                  onClick={() => handleLaunch("What are the compulsory Programme Core courses for B.Tech CSE Core?")}
                >
                  <BookOpen size={12} className={styles.chipIcon} />
                  <span>B.Tech CSE Core Syllabi</span>
                </button>
                <button
                  className={styles.heroPromptChip}
                  onClick={() => handleLaunch("What are the Sunday outing return timings and extension procedure?")}
                >
                  <Building2 size={12} className={styles.chipIcon} />
                  <span>Hostel Outing Rules</span>
                </button>
                <button
                  className={styles.heroPromptChip}
                  onClick={() => handleLaunch("Where is Dr. Hari Seetha's cabin and what is her designation?")}
                >
                  <MapPin size={12} className={styles.chipIcon} />
                  <span>Faculty Directory</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Centerpiece & Live Interactive Preview */}
          <div className={styles.heroRight}>
            <div className={styles.heroOrbContainer}>
              <div className={styles.heroOrbGlow}></div>
              <AI3DOrb size={280} />

              <div className={styles.terminalOverlayCard}>
                <div className={styles.terminalHeader}>
                  <div className={styles.terminalBadgeRow}>
                    <span className={styles.terminalStatusDot}></span>
                    <span className={styles.terminalStatusText}>VIT-AP KNOWLEDGE STREAM</span>
                  </div>
                  <span className={styles.terminalVersion}>STUDENT WORKSPACE</span>
                </div>

                <div className={styles.terminalQuery}>
                  <span className={styles.terminalQueryUser}>Q:</span>
                  <span>What is the minimum attendance required to appear for FAT examinations?</span>
                </div>

                <div className={styles.terminalResponse}>
                  <span className={styles.terminalResponseText}>
                    Under VIT-AP Academic Regulations, students must maintain a minimum of <strong>75% attendance</strong> in
                    each registered course to be eligible to appear for the Final Assessment Test (FAT). Condonation up to 70%
                    may be granted strictly for authorized medical emergencies.
                  </span>

                  <div className={styles.citationBadge}>
                    <FileText size={11} />
                    <span>Academic_Regulations_2023.pdf • Page 19</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: INTRODUCE THE PRODUCT
          ========================================================================= */}
      <section className={styles.introSection}>
        <div className={styles.sectionInner}>
          <div className={styles.introHeader}>
            <div className={styles.sectionEyebrow}>CENTRALIZED CAMPUS KNOWLEDGE</div>
            <h2 className={styles.introTitle}>
              University information, <br />
              <span className={styles.introTitleHighlight}>without the endless searching.</span>
            </h2>
            <p className={styles.introLead}>
              Academic information, regulations, and university documents can be spread across multiple websites and files.
              VIT-AP Copilot brings available institutional knowledge into one conversational experience, helping students
              find relevant information more easily.
            </p>
          </div>

          <div className={styles.editorialPreviewGrid}>
            <div className={styles.editorialCardMain}>
              <div className={styles.editorialBadge}>
                <Compass size={14} color="#38BDF8" />
                <span>Instant Information Access</span>
              </div>
              <h3 className={styles.editorialCardTitle}>Ask in plain language, receive verified answers.</h3>
              <p className={styles.editorialCardBody}>
                No more downloading 150-page curriculum handbooks or searching through scattered email circulars. Ask your
                question directly, and Copilot references the exact clauses, credits, and rules published by the university.
              </p>
              <div className={styles.editorialStatsRow}>
                <div className={styles.editorialStat}>
                  <span className={styles.editorialStatNum}>86+</span>
                  <span className={styles.editorialStatLabel}>University Documents Grounded</span>
                </div>
                <div className={styles.editorialStat}>
                  <span className={styles.editorialStatNum}>Direct</span>
                  <span className={styles.editorialStatLabel}>Clause &amp; Page References</span>
                </div>
                <div className={styles.editorialStat}>
                  <span className={styles.editorialStatNum}>Instant</span>
                  <span className={styles.editorialStatLabel}>Conversational Answers</span>
                </div>
              </div>
            </div>

            <div className={styles.editorialCardSide}>
              <div className={styles.sideCardHeader}>
                <div className={styles.sideCardDot}></div>
                <span>Curated for VIT-AP Students</span>
              </div>
              <ul className={styles.studentFeatureList}>
                <li className={styles.studentFeatureItem}>
                  <div className={styles.studentFeatureIcon}>
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <h4 className={styles.studentFeatureTitle}>Academic Syllabi &amp; Credits</h4>
                    <p className={styles.studentFeatureDesc}>
                      Explore course codes, prerequisites, credits, and syllabus units across B.Tech branches.
                    </p>
                  </div>
                </li>
                <li className={styles.studentFeatureItem}>
                  <div className={styles.studentFeatureIcon}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className={styles.studentFeatureTitle}>Rules &amp; Regulations</h4>
                    <p className={styles.studentFeatureDesc}>
                      Clear, factual summaries of FFCS guidelines, attendance thresholds, and grading systems.
                    </p>
                  </div>
                </li>
                <li className={styles.studentFeatureItem}>
                  <div className={styles.studentFeatureIcon}>
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className={styles.studentFeatureTitle}>Hostel &amp; Residential Life</h4>
                    <p className={styles.studentFeatureDesc}>
                      Hostel outing timings, night curfew regulations, mess procedures, and warden contacts.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: WHAT CAN YOU EXPLORE?
          ========================================================================= */}
      <section className={styles.exploreSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeaderCentered}>
            <div className={styles.sectionEyebrow}>CAMPUS CAPABILITIES</div>
            <h2 className={styles.sectionTitle}>What can you explore?</h2>
            <p className={styles.sectionSubtitle}>
              From official course curricula to residential rules, discover the student resources indexed in VIT-AP Copilot.
            </p>
          </div>

          <div className={styles.exploreAsymmetricGrid}>
            {/* Capability 1: Syllabi */}
            <div className={`${styles.exploreCard} ${styles.exploreCardLarge}`}>
              <div className={styles.exploreCardHeader}>
                <div className={styles.exploreIconWrap}>
                  <BookOpen size={20} />
                </div>
                <span className={styles.exploreCardTag}>ACADEMICS</span>
              </div>
              <h3 className={styles.exploreCardTitle}>Academic Syllabi &amp; Course Details</h3>
              <p className={styles.exploreCardDesc}>
                Explore full programme structures for B.Tech CSE Core, CSBS, and specializations. Review prerequisite trees,
                lecture/practical/project credit allocations (L-T-P-J-C), and detailed course module syllabi.
              </p>
              <div className={styles.exploreInteractiveSample}>
                <span>&quot;Show me the 4th semester courses and prerequisites for B.Tech CSE Core.&quot;</span>
              </div>
            </div>

            {/* Capability 2: Regulations */}
            <div className={styles.exploreCard}>
              <div className={styles.exploreCardHeader}>
                <div className={styles.exploreIconWrap}>
                  <ShieldCheck size={20} />
                </div>
                <span className={styles.exploreCardTag}>POLICIES</span>
              </div>
              <h3 className={styles.exploreCardTitle}>University Academic Regulations</h3>
              <p className={styles.exploreCardDesc}>
                Understand attendance rules, medical leave submission processes, FFCS credit minimums, and grade point
                evaluations with direct citations.
              </p>
            </div>

            {/* Capability 3: Hostel */}
            <div className={styles.exploreCard}>
              <div className={styles.exploreCardHeader}>
                <div className={styles.exploreIconWrap}>
                  <Building2 size={20} />
                </div>
                <span className={styles.exploreCardTag}>RESIDENTIAL</span>
              </div>
              <h3 className={styles.exploreCardTitle}>Hostel Rules &amp; Outings</h3>
              <p className={styles.exploreCardDesc}>
                Check weekday outing return deadlines, Sunday outing extension procedures, biometric sign-ins, and leaves.
              </p>
            </div>

            {/* Capability 4: Faculty */}
            <div className={styles.exploreCard}>
              <div className={styles.exploreCardHeader}>
                <div className={styles.exploreIconWrap}>
                  <MapPin size={20} />
                </div>
                <span className={styles.exploreCardTag}>CAMPUS</span>
              </div>
              <h3 className={styles.exploreCardTitle}>Faculty &amp; Department Directories</h3>
              <p className={styles.exploreCardDesc}>
                Look up faculty cabins, academic deaneries, school offices, and institutional contacts without walking
                between buildings.
              </p>
            </div>

            {/* Capability 5: Document Discovery & Attribution */}
            <div className={`${styles.exploreCard} ${styles.exploreCardLarge}`}>
              <div className={styles.exploreCardHeader}>
                <div className={styles.exploreIconWrap}>
                  <FileText size={20} />
                </div>
                <span className={styles.exploreCardTag}>VERIFIABILITY</span>
              </div>
              <h3 className={styles.exploreCardTitle}>Answers Supported by Original Documents</h3>
              <p className={styles.exploreCardDesc}>
                Copilot does not invent information. Every response references the exact university document and page number
                so you can verify the information directly against the official handbook.
              </p>
              <div className={styles.exploreTagRow}>
                <span className={styles.exploreDocBadge}>BTech_CSE_Core_2024.pdf</span>
                <span className={styles.exploreDocBadge}>Hostel_Regulations.pdf</span>
                <span className={styles.exploreDocBadge}>SCOPE_Faculty_Directory.pdf</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: HOW IT HELPS STUDENTS (PRACTICAL SCENARIOS)
          ========================================================================= */}
      <section className={styles.scenariosSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeaderCentered}>
            <div className={styles.sectionEyebrow}>STUDENT EXPERIENCES</div>
            <h2 className={styles.sectionTitle}>Designed for everyday student situations.</h2>
            <p className={styles.sectionSubtitle}>
              Here is how VIT-AP Copilot fits naturally into your semester routine.
            </p>
          </div>

          <div className={styles.scenariosGrid}>
            {/* Scenario 1 */}
            <div className={styles.scenarioCard}>
              <div className={styles.scenarioNum}>01</div>
              <div className={styles.scenarioIconWrap}>
                <Calendar size={18} />
              </div>
              <h3 className={styles.scenarioTitle}>Preparing for a New Semester</h3>
              <p className={styles.scenarioBody}>
                Before course registration (FFCS), check which courses you need to complete, their prerequisites, and
                recommended credit loads to plan your timetable smoothly.
              </p>
              <button
                className={styles.scenarioPromptBtn}
                onClick={() => handleLaunch("What are the prerequisites for Database Management Systems in B.Tech CSE?")}
              >
                <span>&quot;What are the prerequisites for DBMS?&quot;</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Scenario 2 */}
            <div className={styles.scenarioCard}>
              <div className={styles.scenarioNum}>02</div>
              <div className={styles.scenarioIconWrap}>
                <ShieldCheck size={18} />
              </div>
              <h3 className={styles.scenarioTitle}>Understanding University Rules</h3>
              <p className={styles.scenarioBody}>
                Unsure about attendance condonation policies or grade improvement criteria? Get plain-language explanations
                backed by official handbook citations.
              </p>
              <button
                className={styles.scenarioPromptBtn}
                onClick={() => handleLaunch("What is the attendance condonation policy for medical emergencies?")}
              >
                <span>&quot;What is the medical leave attendance rule?&quot;</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Scenario 3 */}
            <div className={styles.scenarioCard}>
              <div className={styles.scenarioNum}>03</div>
              <div className={styles.scenarioIconWrap}>
                <Building2 size={18} />
              </div>
              <h3 className={styles.scenarioTitle}>Finding Hostel Outing Information</h3>
              <p className={styles.scenarioBody}>
                Quickly check Sunday gate closure times, weekend outing rules, and leave approval workflows without
                guessing or asking across group chats.
              </p>
              <button
                className={styles.scenarioPromptBtn}
                onClick={() => handleLaunch("What is the return time for weekend outings in VIT-AP hostels?")}
              >
                <span>&quot;What time must I return on Sunday outings?&quot;</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Scenario 4 */}
            <div className={styles.scenarioCard}>
              <div className={styles.scenarioNum}>04</div>
              <div className={styles.scenarioIconWrap}>
                <MapPin size={18} />
              </div>
              <h3 className={styles.scenarioTitle}>Locating Faculty Cabins &amp; Offices</h3>
              <p className={styles.scenarioBody}>
                Need to meet a course coordinator or submit a physical form? Look up professor cabins, school deaneries, and
                office locations in seconds.
              </p>
              <button
                className={styles.scenarioPromptBtn}
                onClick={() => handleLaunch("Where is the SCOPE deanery office located?")}
              >
                <span>&quot;Where is the SCOPE deanery office?&quot;</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: KNOWLEDGE BASE PREVIEW
          ========================================================================= */}
      <section className={styles.kbPreviewSection}>
        <div className={styles.sectionInner}>
          <div className={styles.kbPreviewBanner}>
            <div className={styles.kbPreviewLeft}>
              <div className={styles.sectionEyebrow}>OFFICIAL DOCUMENTS</div>
              <h2 className={styles.kbPreviewTitle}>Grounded in university knowledge.</h2>
              <p className={styles.kbPreviewText}>
                VIT-AP Copilot searches across authentic, university-issued documents. Explore the syllabus handbooks,
                regulations, and directories actively indexed in the system.
              </p>

              <div className={styles.docPillList}>
                <div className={styles.docPill}>
                  <BookOpen size={13} color="#38BDF8" />
                  <span>B.Tech CSE Core Syllabus</span>
                </div>
                <div className={styles.docPill}>
                  <BookOpen size={13} color="#38BDF8" />
                  <span>B.Tech CSBS Syllabus</span>
                </div>
                <div className={styles.docPill}>
                  <Building2 size={13} color="#38BDF8" />
                  <span>Hostel Regulations &amp; Curfew Rules</span>
                </div>
                <div className={styles.docPill}>
                  <ShieldCheck size={13} color="#38BDF8" />
                  <span>Academic Regulations &amp; FFCS Handbook</span>
                </div>
                <div className={styles.docPill}>
                  <MapPin size={13} color="#38BDF8" />
                  <span>Faculty &amp; Cabin Directory</span>
                </div>
              </div>

              <div className={styles.kbActionRow}>
                <button className={styles.kbExploreBtn} onClick={() => navigate('/knowledge-base')}>
                  <span>View Full Knowledge Catalog</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className={styles.kbPreviewRight}>
              <div className={styles.verifiedCard}>
                <div className={styles.verifiedHeader}>
                  <ShieldCheck size={18} color="#34D399" />
                  <span>Institutional Verification Guarantee</span>
                </div>
                <p className={styles.verifiedBody}>
                  Every answer provided to students includes interactive source badges. If a policy changes or a new syllabus
                  is published, the indexed records are updated by university administrators.
                </p>
                <div className={styles.verifiedMeta}>
                  <div className={styles.verifiedItem}>
                    <span className={styles.verifiedLabel}>Active Sources</span>
                    <span className={styles.verifiedVal}>86 Documents</span>
                  </div>
                  <div className={styles.verifiedItem}>
                    <span className={styles.verifiedLabel}>Attribution</span>
                    <span className={styles.verifiedVal}>Exact Page Citations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FINAL CTA
          ========================================================================= */}
      <section className={styles.finalCtaSection}>
        <div className={styles.sectionInner}>
          <div className={styles.finalCtaBox}>
            <h2 className={styles.finalCtaTitle}>Your university is just a question away.</h2>
            <p className={styles.finalCtaDesc}>
              Explore academic information and institutional knowledge with VIT-AP Copilot.
            </p>
            <div className={styles.finalCtaActionGroup}>
              <button className={styles.finalCtaPrimary} onClick={() => handleLaunch()}>
                <span>Start Exploring</span>
                <ArrowRight size={15} />
              </button>
              <button className={styles.finalCtaSecondary} onClick={() => navigate('/for-students')}>
                <span>Read Student Guide</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default HomePage;
