import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  MessageSquare,
  Search,
  FileText,
  ChevronDown,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { SiteNavbar } from '../components/SiteNavbar';
import { SiteFooter } from '../components/SiteFooter';
import styles from './HowToUsePage.module.css';

interface FAQItemData {
  q: string;
  a: string;
}

const FAQ_ITEMS: FAQItemData[] = [
  {
    q: 'What is VIT-AP Copilot?',
    a: 'VIT-AP Copilot is an AI-powered conversational university knowledge companion designed specifically for VIT-AP students. It allows you to search course syllabi, university regulations, hostel guidelines, and campus directories using everyday language.'
  },
  {
    q: 'What type of questions can I ask?',
    a: 'You can ask about B.Tech curricula, course prerequisites, credit allocations, attendance rules, medical condonation policies, grade systems, hostel outing timings, curfew regulations, leave application steps, and faculty cabin locations.'
  },
  {
    q: 'Where does the information come from?',
    a: 'Every answer is grounded in official, university-issued documents including approved curriculum handbooks, hostel rules manuals, academic circulars, and departmental faculty lists.'
  },
  {
    q: 'Can I see the original documents?',
    a: 'Yes. Whenever Copilot answers an inquiry, it displays source badges citing the specific document name and page number where that rule or syllabus topic is defined.'
  },
  {
    q: 'What if Copilot cannot find an answer?',
    a: 'If a question cannot be substantiated by the indexed university records, Copilot will clearly tell you that the information is not present in its current knowledge base and direct you to the relevant deanery or student portal.'
  },
  {
    q: 'Can I ask follow-up questions?',
    a: 'Yes! The conversation maintains context within your session. For example, after asking for your branch syllabus, you can ask "Which of these are compulsory Programme Core?" and Copilot will understand the context.'
  },
  {
    q: 'Does Copilot replace official university announcements?',
    a: 'No. While Copilot helps you find published regulations and course information quickly, official circulars from the Registrar, Dean of Academics, and Controller of Examinations published on V-TOP remain the definitive source of campus directives.'
  }
];

export function HowToUsePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'academic' | 'hostel' | 'university'>('academic');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleLaunchWithPrompt = (prompt: string) => {
    navigate(`/copilot?prompt=${encodeURIComponent(prompt)}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
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
              <span>STUDENT GUIDE &amp; FAQS</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Getting answers starts <br />
              <span className={styles.heroHeadlineGradient}>with a question.</span>
            </h1>

            <p className={styles.heroDescription}>
              Using VIT-AP Copilot is simple. Ask, explore, verify, and continue the conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: Four Simple Steps */}
      <section className={styles.stepsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>HOW IT WORKS</div>
            <h2 className={styles.sectionTitle}>Four Simple Steps</h2>
            <p className={styles.sectionSubtitle}>
              From typing a query to verifying official source documents.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {/* Step 1 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>01</div>
              <h3 className={styles.stepTitle}>Open Copilot</h3>
              <p className={styles.stepBody}>
                Launch the application from any phone, laptop, or browser connected to the internet.
              </p>
              <div className={styles.stepVisualMock}>
                <span>Click &quot;Launch Copilot&quot; &rarr; Instant Workspace</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>02</div>
              <h3 className={styles.stepTitle}>Ask Your Question</h3>
              <p className={styles.stepBody}>
                Enter a natural-language question about your academics, hostel regulations, or university information.
              </p>
              <div className={styles.stepVisualMock}>
                <span>&quot;What are the Sunday outing return hours?&quot;</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>03</div>
              <h3 className={styles.stepTitle}>Explore the Response</h3>
              <p className={styles.stepBody}>
                Read the synthesized answer, broken down into readable points with key rules highlighted.
              </p>
              <div className={styles.stepVisualMock}>
                <span>&bull; Gate closure: 6:00 PM<br />&bull; Extension: Permission required</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>04</div>
              <h3 className={styles.stepTitle}>Check the Sources</h3>
              <p className={styles.stepBody}>
                Where references are available, inspect the supporting institutional documents and page citations.
              </p>
              <div className={styles.stepVisualMock}>
                <span>[Source: Hostel_Handbook.pdf • Page 12]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Example Questions */}
      <section className={styles.examplesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>WHAT CAN I ASK?</div>
            <h2 className={styles.sectionTitle}>Example Questions</h2>
            <p className={styles.sectionSubtitle}>
              Select a category to see realistic questions you can ask Copilot right now.
            </p>
          </div>

          <div className={styles.examplesNav}>
            <button
              className={`${styles.exampleTabBtn} ${activeCategory === 'academic' ? styles.exampleTabActive : ''}`}
              onClick={() => setActiveCategory('academic')}
            >
              Academic Inquiries
            </button>
            <button
              className={`${styles.exampleTabBtn} ${activeCategory === 'hostel' ? styles.exampleTabActive : ''}`}
              onClick={() => setActiveCategory('hostel')}
            >
              Hostel &amp; Outings
            </button>
            <button
              className={`${styles.exampleTabBtn} ${activeCategory === 'university' ? styles.exampleTabActive : ''}`}
              onClick={() => setActiveCategory('university')}
            >
              University &amp; Faculty
            </button>
          </div>

          <div className={styles.examplesGrid}>
            {activeCategory === 'academic' && (
              <>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Curriculum</div>
                    <div className={styles.exampleCardText}>&quot;Explain the B.Tech CSE syllabus and semester structure.&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("Explain the B.Tech CSE syllabus and semester structure.")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Programme Details</div>
                    <div className={styles.exampleCardText}>&quot;Find the CSBS programme curriculum and industry partner details.&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("Find the CSBS programme curriculum and industry partner details.")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Policies</div>
                    <div className={styles.exampleCardText}>&quot;What are the minimum attendance criteria for FAT exam eligibility?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("What are the minimum attendance criteria for FAT exam eligibility?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Prerequisites</div>
                    <div className={styles.exampleCardText}>&quot;What courses must I complete before enrolling in Compiler Design?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("What courses must I complete before enrolling in Compiler Design?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </>
            )}

            {activeCategory === 'hostel' && (
              <>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Outing Timings</div>
                    <div className={styles.exampleCardText}>&quot;Explain the hostel outing rules and Sunday return timings.&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("Explain the hostel outing rules and Sunday return timings.")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Leave Application</div>
                    <div className={styles.exampleCardText}>&quot;What are the hostel leave procedures for weekend home visits?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("What are the hostel leave procedures for weekend home visits?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Mess &amp; Facilities</div>
                    <div className={styles.exampleCardText}>&quot;What are the meal timings in the university hostel mess?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("What are the meal timings in the university hostel mess?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Discipline</div>
                    <div className={styles.exampleCardText}>&quot;What is the quiet hours policy in the student hostels?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("What is the quiet hours policy in the student hostels?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </>
            )}

            {activeCategory === 'university' && (
              <>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Regulations</div>
                    <div className={styles.exampleCardText}>&quot;Find the academic regulations regarding course withdrawal.&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("Find the academic regulations regarding course withdrawal.")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Faculty</div>
                    <div className={styles.exampleCardText}>&quot;Where can I find faculty information and cabin numbers?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("Where can I find faculty information and cabin numbers?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Deaneries</div>
                    <div className={styles.exampleCardText}>&quot;Where is the Dean of Academics office located?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("Where is the Dean of Academics office located?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className={styles.exampleCard}>
                  <div>
                    <div className={styles.exampleCardCategory}>Emergency</div>
                    <div className={styles.exampleCardText}>&quot;What are the contacts for campus security and health clinic?&quot;</div>
                  </div>
                  <button
                    className={styles.exampleTryBtn}
                    onClick={() => handleLaunchWithPrompt("What are the contacts for campus security and health clinic?")}
                  >
                    <span>Try this prompt</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Tips for Better Results */}
      <section className={styles.tipsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>BEST PRACTICES</div>
            <h2 className={styles.sectionTitle}>Tips for Better Results</h2>
            <p className={styles.sectionSubtitle}>
              Get the most accurate answers by following these simple inquiry suggestions.
            </p>
          </div>

          <div className={styles.tipsGrid}>
            <div className={styles.tipCard}>
              <div className={styles.tipIconWrap}>
                <Lightbulb size={18} />
              </div>
              <h3 className={styles.tipTitle}>Ask Specific Questions</h3>
              <p className={styles.tipDesc}>
                Instead of &quot;Tell me about exams&quot;, ask &quot;What are the rules regarding missed FAT exams due to medical reasons?&quot;
              </p>
            </div>

            <div className={styles.tipCard}>
              <div className={styles.tipIconWrap}>
                <BookOpen size={18} />
              </div>
              <h3 className={styles.tipTitle}>Mention Your Programme</h3>
              <p className={styles.tipDesc}>
                Different programmes have different credit matrices. State &quot;in B.Tech CSE Core&quot; or &quot;for CSBS&quot; for precision.
              </p>
            </div>

            <div className={styles.tipCard}>
              <div className={styles.tipIconWrap}>
                <Compass size={18} />
              </div>
              <h3 className={styles.tipTitle}>Mention Semester When Relevant</h3>
              <p className={styles.tipDesc}>
                Course offerings vary by semester. Adding &quot;in 3rd semester&quot; helps Copilot locate the exact semester bucket.
              </p>
            </div>

            <div className={styles.tipCard}>
              <div className={styles.tipIconWrap}>
                <MessageSquare size={18} />
              </div>
              <h3 className={styles.tipTitle}>Ask Follow-up Questions</h3>
              <p className={styles.tipDesc}>
                The chat remembers the context of your inquiry. You can ask &quot;What about its lab component?&quot; naturally.
              </p>
            </div>

            <div className={styles.tipCard}>
              <div className={styles.tipIconWrap}>
                <FileText size={18} />
              </div>
              <h3 className={styles.tipTitle}>Check Source References</h3>
              <p className={styles.tipDesc}>
                Inspect the cited document and page numbers at the bottom of the response to verify the official university text.
              </p>
            </div>

            <div className={styles.tipCard}>
              <div className={styles.tipIconWrap}>
                <Search size={18} />
              </div>
              <h3 className={styles.tipTitle}>Rephrase if Information Is Missing</h3>
              <p className={styles.tipDesc}>
                If your initial question doesn&apos;t match, try using official terminology like &quot;curriculum&quot;, &quot;outing policy&quot;, or &quot;course code&quot;.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Frequently Asked Questions */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>FREQUENTLY ASKED QUESTIONS</div>
            <h2 className={styles.sectionTitle}>Common Student Inquiries</h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to know about how VIT-AP Copilot operates and serves campus information.
            </p>
          </div>

          <div className={styles.faqContainer}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                  <div className={styles.faqQuestionRow} onClick={() => toggleFaq(idx)}>
                    <span className={styles.faqQuestion}>{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={styles.faqIcon}
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                    />
                  </div>
                  {isOpen && <div className={styles.faqAnswer}>{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5: Final CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Ready to give it a try?</h2>
            <p className={styles.ctaDesc}>
              Ask a question about your syllabus, hostel regulations, or faculty cabin locations now.
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

export default HowToUsePage;
