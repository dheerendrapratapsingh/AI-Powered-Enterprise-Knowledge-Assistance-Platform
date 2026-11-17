import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { SiteNavbar } from '../components/SiteNavbar';
import { SiteFooter } from '../components/SiteFooter';
import styles from './ForStudentsPage.module.css';

export function ForStudentsPage() {
  const navigate = useNavigate();

  const handleLaunchWithPrompt = (prompt: string) => {
    navigate(`/copilot?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className={styles.pageWrapper}>
      <SiteNavbar onLaunchCopilot={() => navigate('/copilot')} />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowDot}></span>
              <span>DESIGNED FOR VIT-AP SCHOLARS</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Made for the way you <br />
              <span className={styles.heroHeadlineGradient}>experience university life.</span>
            </h1>

            <p className={styles.heroDescription}>
              Whether you are exploring your syllabus, understanding university rules, or looking for campus
              information, VIT-AP Copilot helps you discover relevant information in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: Academic Life */}
      <section className={styles.sectionBlock}>
        <div className={styles.container}>
          <div className={styles.blockGrid}>
            <div className={styles.blockTextCol}>
              <div className={styles.blockTag}>ACADEMIC LIFE</div>
              <h2 className={styles.blockHeading}>Stay informed about your academics.</h2>
              <p className={styles.blockDesc}>
                Navigate your degree with clarity. Find credit requirements, examine course units, and check prerequisite
                chains across all semesters without digging through lengthy circulars.
              </p>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Explore B.Tech CSE Core, CSBS, and departmental specialization syllabi.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Review lecture, lab, and project credit allocations (L-T-P-J-C).</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Check compulsory Programme Core vs Discipline Elective requirements.</span>
                </li>
              </ul>

              <div className={styles.samplePromptList}>
                <div className={styles.samplePromptLabel}>Try asking:</div>
                <button
                  className={styles.promptChip}
                  onClick={() => handleLaunchWithPrompt("Show me the B.Tech CSE core syllabus and credit distribution.")}
                >
                  <span>&quot;Show me the B.Tech CSE core syllabus.&quot;</span>
                  <ArrowRight size={13} className={styles.promptChipIcon} />
                </button>
                <button
                  className={styles.promptChip}
                  onClick={() => handleLaunchWithPrompt("What subjects are included in the 3rd semester for CSBS?")}
                >
                  <span>&quot;What subjects are included in my programme?&quot;</span>
                  <ArrowRight size={13} className={styles.promptChipIcon} />
                </button>
                <button
                  className={styles.promptChip}
                  onClick={() => handleLaunchWithPrompt("Help me find the academic regulations regarding course withdrawal.")}
                >
                  <span>&quot;Help me find the academic regulations.&quot;</span>
                  <ArrowRight size={13} className={styles.promptChipIcon} />
                </button>
              </div>
            </div>

            <div className={styles.blockVisualCol}>
              <div className={styles.visualCard}>
                <div className={styles.visualCardHeader}>
                  <BookOpen size={16} color="#38BDF8" />
                  <span className={styles.visualCardTitle}>Available Curriculum Documents</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>B.Tech CSE Core Handbook</span>
                  <span className={styles.previewDocMeta}>160 Total Credits • Ver. 2024</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>B.Tech CSBS Curriculum</span>
                  <span className={styles.previewDocMeta}>TCS Partnered • Ver. 2023</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Academic Regulations 2023-24</span>
                  <span className={styles.previewDocMeta}>FFCS Guidelines • Exam Rules</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Elective Basket Handbooks</span>
                  <span className={styles.previewDocMeta}>Open &amp; Discipline Electives</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Hostel and Campus Life */}
      <section className={styles.sectionBlock}>
        <div className={styles.container}>
          <div className={`${styles.blockGrid} ${styles.blockGridReversed}`}>
            <div className={styles.blockTextCol}>
              <div className={styles.blockTag}>RESIDENTIAL POLICIES</div>
              <h2 className={styles.blockHeading}>Find the information you need about campus life.</h2>
              <p className={styles.blockDesc}>
                Living on campus comes with specific guidelines. Copilot provides direct answers on outing timings,
                leave permissions, and dining policies grounded in the official hostel handbook.
              </p>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Look up weekday and Sunday outing return timings for men&apos;s and women&apos;s hostels.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Understand weekend leave approval steps and parent consent procedures.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Find mess rules, quiet hours, and campus health center contacts.</span>
                </li>
              </ul>

              <div className={styles.samplePromptList}>
                <div className={styles.samplePromptLabel}>Try asking:</div>
                <button
                  className={styles.promptChip}
                  onClick={() => handleLaunchWithPrompt("What are the hostel outing regulations and return timings for Sunday?")}
                >
                  <span>&quot;What are the hostel outing regulations?&quot;</span>
                  <ArrowRight size={13} className={styles.promptChipIcon} />
                </button>
                <button
                  className={styles.promptChip}
                  onClick={() => handleLaunchWithPrompt("Where can I find hostel leave information and application process?")}
                >
                  <span>&quot;Where can I find hostel leave information?&quot;</span>
                  <ArrowRight size={13} className={styles.promptChipIcon} />
                </button>
              </div>
            </div>

            <div className={styles.blockVisualCol}>
              <div className={styles.visualCard}>
                <div className={styles.visualCardHeader}>
                  <Building2 size={16} color="#38BDF8" />
                  <span className={styles.visualCardTitle}>Hostel &amp; Residential Guidelines</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Sunday General Outing</span>
                  <span className={styles.previewDocMeta}>Return by 6:00 PM / Biometric</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Home Leave Application</span>
                  <span className={styles.previewDocMeta}>V-TOP Portal Approval 48h Prior</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Campus Health &amp; Emergency</span>
                  <span className={styles.previewDocMeta}>24/7 Medical Room Ground Floor MH-1</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Quiet Hours Regulation</span>
                  <span className={styles.previewDocMeta}>10:00 PM to 6:00 AM Daily</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: University Information */}
      <section className={styles.sectionBlock}>
        <div className={styles.container}>
          <div className={styles.blockGrid}>
            <div className={styles.blockTextCol}>
              <div className={styles.blockTag}>CAMPUS DIRECTORIES</div>
              <h2 className={styles.blockHeading}>Discover the information behind your university.</h2>
              <p className={styles.blockDesc}>
                Whether you need to submit an official form, locate a professor&apos;s cabin, or contact an academic school,
                Copilot provides institutional directory records in seconds.
              </p>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Look up faculty cabins, designations, and departmental affiliations in SCOPE and SENSE.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Find office locations for Dean of Academics, Student Welfare, and Examination Cell.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Locate university transport routes, shuttle schedules, and campus facilities.</span>
                </li>
              </ul>

              <div className={styles.samplePromptList}>
                <div className={styles.samplePromptLabel}>Try asking:</div>
                <button
                  className={styles.promptChip}
                  onClick={() => handleLaunchWithPrompt("Where is Dr. Hari Seetha's cabin and what is her designation?")}
                >
                  <span>&quot;Where is Dr. Hari Seetha&apos;s cabin?&quot;</span>
                  <ArrowRight size={13} className={styles.promptChipIcon} />
                </button>
                <button
                  className={styles.promptChip}
                  onClick={() => handleLaunchWithPrompt("Where is the Office of Student Welfare (DSW) located?")}
                >
                  <span>&quot;Where is the Student Welfare office located?&quot;</span>
                  <ArrowRight size={13} className={styles.promptChipIcon} />
                </button>
              </div>
            </div>

            <div className={styles.blockVisualCol}>
              <div className={styles.visualCard}>
                <div className={styles.visualCardHeader}>
                  <MapPin size={16} color="#38BDF8" />
                  <span className={styles.visualCardTitle}>Verified Institutional Directory</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>School of Computer Science (SCOPE)</span>
                  <span className={styles.previewDocMeta}>Academic Block 1 • 2nd Floor</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Dean of Academic Affairs</span>
                  <span className={styles.previewDocMeta}>Admin Block • Room 104</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Controller of Examinations (CoE)</span>
                  <span className={styles.previewDocMeta}>Admin Block • Ground Floor</span>
                </div>
                <div className={styles.previewDocRow}>
                  <span className={styles.previewDocName}>Student Welfare &amp; Clubs</span>
                  <span className={styles.previewDocMeta}>Student Activity Center (SAC)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Ask Naturally */}
      <section className={styles.askNaturallySection}>
        <div className={styles.container}>
          <div className={styles.askHeader}>
            <div className={styles.blockTag}>CONVERSATIONAL DISCOVERY</div>
            <h2 className={styles.askTitle}>Ask naturally, without digging through PDFs.</h2>
            <p className={styles.askSubtitle}>
              Compare manual campus information searching with the direct conversational clarity of VIT-AP Copilot.
            </p>
          </div>

          <div className={styles.comparisonGrid}>
            {/* The Old Way */}
            <div className={`${styles.comparisonBox} ${styles.comparisonBoxBad}`}>
              <div className={styles.comparisonHeader}>
                <span className={`${styles.comparisonLabel} ${styles.labelBad}`}>Searching Manually</span>
                <XCircle size={18} color="#F87171" />
              </div>
              <ul className={styles.comparisonSteps}>
                <li className={styles.comparisonStepItem}>
                  <XCircle size={15} className={styles.stepIconRed} />
                  <span>Download 180-page curriculum PDF from the student portal.</span>
                </li>
                <li className={styles.comparisonStepItem}>
                  <XCircle size={15} className={styles.stepIconRed} />
                  <span>Scroll through dozens of tables searching for prerequisite course codes.</span>
                </li>
                <li className={styles.comparisonStepItem}>
                  <XCircle size={15} className={styles.stepIconRed} />
                  <span>Ask friends on WhatsApp groups and receive conflicting answers about curfew.</span>
                </li>
                <li className={styles.comparisonStepItem}>
                  <XCircle size={15} className={styles.stepIconRed} />
                  <span>Walk across campus to check faculty cabin numbers on bulletin boards.</span>
                </li>
              </ul>
            </div>

            {/* The Copilot Way */}
            <div className={`${styles.comparisonBox} ${styles.comparisonBoxGood}`}>
              <div className={styles.comparisonHeader}>
                <span className={`${styles.comparisonLabel} ${styles.labelGood}`}>With VIT-AP Copilot</span>
                <CheckCircle2 size={18} color="#38BDF8" />
              </div>
              <ul className={styles.comparisonSteps}>
                <li className={styles.comparisonStepItem}>
                  <CheckCircle2 size={15} className={styles.stepIconGreen} />
                  <span>Ask your question in plain English at any time of day or night.</span>
                </li>
                <li className={styles.comparisonStepItem}>
                  <CheckCircle2 size={15} className={styles.stepIconGreen} />
                  <span>Receive an instant, concise summary synthesized from official records.</span>
                </li>
                <li className={styles.comparisonStepItem}>
                  <CheckCircle2 size={15} className={styles.stepIconGreen} />
                  <span>Verify exact page numbers and document names with one-click source citations.</span>
                </li>
              </ul>

              {/* Chat specimen */}
              <div className={styles.chatSpecimen}>
                <div className={styles.chatSpecimenQuery}>
                  <span style={{ color: '#38BDF8' }}>You:</span>
                  <span>Can I register for Operating Systems if I haven&apos;t cleared Computer Architecture?</span>
                </div>
                <div className={styles.chatSpecimenAnswer}>
                  No. According to the B.Tech CSE Core curriculum, <strong>[CSE2001] Computer Architecture &amp; Organization</strong> is
                  a mandatory prerequisite for <strong>[CSE3001] Operating Systems</strong>. You must successfully complete CSE2001
                  before enrolling in CSE3001.
                  <div className={styles.chatSpecimenCitation}>
                    <FileText size={10} />
                    <span>BTech_CSE_Core_2024.pdf • Page 38</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Closing CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Make university information easier to access.</h2>
            <p className={styles.ctaDesc}>
              Experience conversational academic and campus discovery today with VIT-AP Copilot.
            </p>
            <button className={styles.ctaBtn} onClick={() => navigate('/copilot')}>
              <span>Launch Copilot</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default ForStudentsPage;
