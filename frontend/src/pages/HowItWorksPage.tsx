import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Database,
  Search,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { SiteNavbar } from '../components/SiteNavbar';
import { SiteFooter } from '../components/SiteFooter';
import styles from './HowItWorksPage.module.css';

interface WalkthroughStage {
  id: number;
  stageNum: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  keypoints: string[];
  icon: typeof UploadCloud;
  visualTitle: string;
  visualInputLabel: string;
  visualInputValue: string;
  visualOutputLabel: string;
  visualOutputValue: string;
  metric: string;
}

const STAGES: WalkthroughStage[] = [
  {
    id: 1,
    stageNum: 'STAGE 01',
    name: 'Ingestion & Crawl',
    title: 'Dual-Stream Document Ingestion & Portal Crawling',
    subtitle: 'ACQUISITION LAYER',
    description:
      'VIT-AP Copilot ingests institutional records through two controlled paths: administrative PDF uploads (academic syllabi, hostel handbooks, regulatory circulars) and an automated crawler that mirrors vitap.ac.in official notice boards.',
    keypoints: [
      'Sha-256 cryptographic hashing prevents duplicate indexing.',
      'Domain isolation strictly confines ingestion to approved university domains.',
      'Automated change detection triggers incremental vector re-indexing.'
    ],
    icon: UploadCloud,
    visualTitle: 'INGESTION_PIPELINE.LOG',
    visualInputLabel: 'Source Ingestion Stream',
    visualInputValue: 'PDF: BTech_CSE_Core_Curriculum_2024.pdf [876 KB] via Admin Portal',
    visualOutputLabel: 'Pipeline Event',
    visualOutputValue: 'STATUS: VALIDATED [SHA256: 8f4b9c1d...] -> Queued for Spatial Parser',
    metric: '86 Active Documents Verified'
  },
  {
    id: 2,
    stageNum: 'STAGE 02',
    name: 'Coordinate Extraction',
    title: 'Coordinate-Aware Spatial PDF Extraction',
    subtitle: 'PARSING & CHUNKING',
    description:
      'Standard PDF extraction corrupts two-column university documents by reading left-to-right across columns. Our coordinate parser segments text boxes around the central vertical gutter (x=295pt) into 500-token semantic chunks with 75-token sliding overlaps.',
    keypoints: [
      'Preserves course codes, credits, and prerequisites without cross-column corruption.',
      'Maintains exact page numbers and spatial coordinates for citation verification.',
      'Cleans redundant headers, footers, and page numbers while retaining table matrices.'
    ],
    icon: FileText,
    visualTitle: 'SPATIAL_COORDINATE_EXTRACTOR.PY',
    visualInputLabel: 'Raw PDF Geometry',
    visualInputValue: 'Page 14: Left Column [x: 36..290] | Right Column [x: 295..576]',
    visualOutputLabel: 'Extracted Chunk #14-B',
    visualOutputValue: '[CSE2001] Computer Architecture & Org | 3 Credits | Prereq: CSE1001',
    metric: 'Zero Column Interlacing'
  },
  {
    id: 3,
    stageNum: 'STAGE 03',
    name: 'Dense Embedding',
    title: '384-Dimensional Dense Vector Generation',
    subtitle: 'REPRESENTATION LAYER',
    description:
      'Extracted text chunks are processed through sentence-transformers/all-MiniLM-L6-v2. Each segment is transformed into a dense 384-dimensional vector and indexed into an in-memory FAISS FlatIP structure with L2 unit normalization.',
    keypoints: [
      'Captures semantic intent so different phrasings of the same question match accurately.',
      'L2 normalization reduces cosine similarity computation to simple inner dot products.',
      'Vector indices are paired with persistent SQLite metadata records.'
    ],
    icon: Database,
    visualTitle: 'EMBEDDING_TRANSFORMER.VECTOR',
    visualInputLabel: 'Normalized Chunk Payload',
    visualInputValue: 'Syllabus clause: "Minimum 75% attendance is mandatory to appear for FAT."',
    visualOutputLabel: 'Vector Projection (384 Dimensions)',
    visualOutputValue: '[-0.0421, 0.0891, 0.0114, -0.0763, ... 380 more floats] (FAISS Indexed)',
    metric: '384-Dim Vector Embeddings'
  },
  {
    id: 4,
    stageNum: 'STAGE 04',
    name: 'Semantic Retrieval',
    title: 'Sub-50ms Semantic Cache & Vector Search',
    subtitle: 'RETRIEVAL ENGINE',
    description:
      'When a student types a query, it is first evaluated against the in-memory semantic cache. If cosine similarity is >= 0.88, the answer is served in < 20ms. Otherwise, FAISS executes dense nearest-neighbor search to retrieve the top 3-5 grounded chunks.',
    keypoints: [
      'Sub-20ms instant cache response for high-frequency queries (curfew, attendance).',
      'Dense vector similarity ensures colloquial student queries find formal regulatory clauses.',
      'Reranking filters chunks with marginal similarity below relevance thresholds.'
    ],
    icon: Search,
    visualTitle: 'FAISS_SEARCH_EXECUTION',
    visualInputLabel: 'Student Query',
    visualInputValue: '"Can I sit for final exam if my attendance is 72% with medical certificate?"',
    visualOutputLabel: 'Top Retrieved Chunk',
    visualOutputValue: 'Match: Academic Regulations Sec 4.2 (Score: 0.924) - Medical condonation policy',
    metric: 'Top-5 Ranked Grounded Chunks'
  },
  {
    id: 5,
    stageNum: 'STAGE 05',
    name: 'Context Verification',
    title: 'Domain Guardrail & Strict Prompt Bounding',
    subtitle: 'VERIFICATION LAYER',
    description:
      'Before generation, the query and context are tested by safety and domain guardrails. Non-institutional queries are redirected, while the generative prompt strictly restricts the LLM to facts explicitly present in the retrieved chunks.',
    keypoints: [
      'Eliminates AI hallucinations by banning ungrounded external assumptions.',
      'Campus domain boundary checks prevent off-topic or prompt injection misuse.',
      'Explicit fallback directs unindexed questions to the appropriate deanery or portal.'
    ],
    icon: ShieldCheck,
    visualTitle: 'DOMAIN_GUARDRAIL_ANALYZER',
    visualInputLabel: 'Context Grounding Test',
    visualInputValue: 'Chunks verified: [Academic_Regs_2023.pdf, Medical_Leave_Policy.pdf]',
    visualOutputLabel: 'Verification Result',
    visualOutputValue: 'CONFIRMED: Policy states 70-74% condonable with Medical Board approval',
    metric: 'Strict Institutional Grounding'
  },
  {
    id: 6,
    stageNum: 'STAGE 06',
    name: 'Grounded Synthesis',
    title: 'Dual-Brain Streaming Synthesis & Source Citations',
    subtitle: 'GENERATION & ATTRIBUTION',
    description:
      'Google Gemini 3.5 Flash streams the contextual response in real time (with automated failover to local Ollama). Every statement is backed by clickable source badges showing the document name and verified page number.',
    keypoints: [
      'Instant Time-To-First-Token (~320ms) for snappy conversational feedback.',
      'Zero downtime via seamless local Ollama fallback if cloud connectivity drops.',
      'Interactive source citations link users directly to verified university records.'
    ],
    icon: Cpu,
    visualTitle: 'STREAMING_SYNTHESIS_OUTPUT',
    visualInputLabel: 'Model Synthesis Protocol',
    visualInputValue: 'Gemini 3.5 Flash (Streaming WebSocket / SSE) -> Attributed Chunks',
    visualOutputLabel: 'Final Grounded Output',
    visualOutputValue: '"Yes, attendance between 70% and 75% may be condoned on medical grounds with valid documentation submitted to the Dean of Academic Affairs within 3 days. [Source: Academic Regulations 2023, Page 19]"',
    metric: '100% Verifiable Source Attribution'
  }
];

export function HowItWorksPage() {
  const navigate = useNavigate();
  const [currentStageId, setCurrentStageId] = useState<number>(1);

  const currentStage = STAGES.find((s) => s.id === currentStageId) || STAGES[0];

  const handleNext = () => {
    if (currentStageId < STAGES.length) {
      setCurrentStageId(currentStageId + 1);
    }
  };

  const handlePrev = () => {
    if (currentStageId > 1) {
      setCurrentStageId(currentStageId - 1);
    }
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
              <span>LIFECYCLE OF A CAMPUS QUERY</span>
            </div>

            <h1 className={styles.heroHeadline}>
              How VIT-AP Copilot Works, <br />
              <span className={styles.heroHeadlineGradient}>From Document to Answer.</span>
            </h1>

            <p className={styles.heroDescription}>
              Step inside the 6-stage engineering pipeline that transforms complex university circulars and syllabi
              into deterministic, verifiable conversational answers.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section className={styles.simulatorSection}>
        <div className={styles.container}>
          <div className={styles.simulatorWrapper}>
            {/* Simulator Header */}
            <div className={styles.simulatorHeader}>
              <div className={styles.simulatorTitleWrap}>
                <span className={styles.simPulseDot}></span>
                <span className={styles.simTitle}>Pipeline Execution Simulator</span>
              </div>
              <span className={styles.simBadge}>{currentStage.metric}</span>
            </div>

            {/* Stage Navigation Tabs */}
            <div className={styles.stageNavRow}>
              {STAGES.map((s) => {
                const isActive = s.id === currentStageId;
                return (
                  <div
                    key={s.id}
                    className={`${styles.stageTab} ${isActive ? styles.stageTabActive : ''}`}
                    onClick={() => setCurrentStageId(s.id)}
                  >
                    <div className={styles.stageTabNum}>{s.stageNum}</div>
                    <div className={styles.stageTabLabel}>{s.name}</div>
                  </div>
                );
              })}
            </div>

            {/* Stage Body */}
            <div className={styles.simulatorBody}>
              {/* Left Column: Stage Details */}
              <div className={styles.stageInfoCol}>
                <div className={styles.stageSubhead}>{currentStage.subtitle}</div>
                <h2 className={styles.stageHeading}>{currentStage.title}</h2>
                <p className={styles.stageDescription}>{currentStage.description}</p>

                <ul className={styles.stageKeypoints}>
                  {currentStage.keypoints.map((point, idx) => (
                    <li key={idx} className={styles.stageKeypoint}>
                      <span className={styles.stageDot}></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.stageControls}>
                  <button
                    className={styles.stageNavBtn}
                    onClick={handlePrev}
                    disabled={currentStageId === 1}
                  >
                    <ArrowLeft size={14} />
                    <span>Previous Stage</span>
                  </button>
                  <button
                    className={styles.stageNavBtn}
                    onClick={handleNext}
                    disabled={currentStageId === STAGES.length}
                  >
                    <span>Next Stage</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Right Column: Visualization Box */}
              <div className={styles.stageVisualPanel}>
                <div className={styles.visualPanelHeader}>
                  <div className={styles.visualPanelTitle}>
                    <Terminal size={13} color="#38BDF8" />
                    <span>{currentStage.visualTitle}</span>
                  </div>
                  <span className={styles.visualPanelStatus}>PASS &bull; VERIFIED</span>
                </div>

                <div className={styles.visualDisplay}>
                  <div className={styles.ioBox}>
                    <div className={styles.ioLabel}>{currentStage.visualInputLabel}</div>
                    <div>{currentStage.visualInputValue}</div>
                  </div>

                  <div className={styles.ioBox}>
                    <div className={styles.ioLabel}>{currentStage.visualOutputLabel}</div>
                    <div className={styles.ioData}>{currentStage.visualOutputValue}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full 6-Stage Timeline Breakdown */}
      <section className={styles.walkthroughSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>Architecture Breakdown</div>
            <h2 className={styles.sectionTitle}>The Complete 6-Stage Flow</h2>
            <p className={styles.sectionSubtitle}>
              A comprehensive overview of every transformation layer in the VIT-AP Copilot ingestion and query cycle.
            </p>
          </div>

          <div className={styles.timelineGrid}>
            {STAGES.map((s) => {
              const IconComp = s.icon;
              return (
                <div key={s.id} className={styles.timelineCard}>
                  <div className={styles.timelineCardHeader}>
                    <span className={styles.timelineStageNum}>{s.stageNum}</span>
                    <div className={styles.timelineIconWrap}>
                      <IconComp size={18} />
                    </div>
                  </div>
                  <h3 className={styles.timelineTitle}>{s.name}</h3>
                  <p className={styles.timelineText}>{s.description}</p>
                  <div className={styles.timelineDetailRow}>
                    <CheckCircle2 size={13} color="#38BDF8" />
                    <span>{s.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Ready to Test the System?</h2>
            <p className={styles.ctaText}>
              Launch Copilot and query your course syllabi, hostel curfew rules, or faculty cabins with verified citations.
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
export default HowItWorksPage;
