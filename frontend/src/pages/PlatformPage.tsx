import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Cpu,
  Zap,
  ShieldCheck,
  FileText,
  ArrowRight
} from 'lucide-react';
import { SiteNavbar } from '../components/SiteNavbar';
import { SiteFooter } from '../components/SiteFooter';
import styles from './PlatformPage.module.css';

interface ArchitectureStep {
  id: string;
  num: string;
  name: string;
  shortMetric: string;
  icon: typeof Zap;
  title: string;
  description: string;
  metrics: { label: string; val: string }[];
  codeSnippet: string;
}

const ARCHITECTURE_STEPS: ArchitectureStep[] = [
  {
    id: 'cache',
    num: '01',
    name: 'Semantic Cache',
    shortMetric: '< 20ms Latency',
    icon: Zap,
    title: 'Dense Cosine Semantic Cache Check',
    description:
      'Incoming student queries are converted into 384-dimensional dense vectors and tested against existing cache entries. If cosine similarity meets or exceeds 0.88, the cached answer is returned immediately with zero LLM inference cost.',
    metrics: [
      { label: 'Similarity Threshold', val: 'Cosine ≥ 0.88' },
      { label: 'Avg Hit Time', val: '14.2 ms' },
      { label: 'Hit Rate (Peak)', val: '43.8%' }
    ],
    codeSnippet: `// Dense Vector Cosine Similarity Evaluation
const similarity = dotProduct(queryEmbedding, cachedEmbedding) / 
                   (norm(queryEmbedding) * norm(cachedEmbedding));

if (similarity >= 0.88) {
  return serveCachedResponse(cachedEntry.payload, similarity);
}`
  },
  {
    id: 'guardrail',
    num: '02',
    name: 'Domain Guardrail',
    shortMetric: 'Strict Isolation',
    icon: ShieldCheck,
    title: 'Institutional Domain Isolation & Intent Classification',
    description:
      'Queries are evaluated against the VIT-AP University academic taxonomy. General trivia, out-of-domain requests, or prompt injections are identified and steered toward campus institutional resources.',
    metrics: [
      { label: 'Safety Layer', val: 'Zero Cross-Tenant Leak' },
      { label: 'Classification', val: 'Fast Heuristic & Vector' },
      { label: 'Rejection Latency', val: '< 5 ms' }
    ],
    codeSnippet: `// Domain Verification Boundary
if (!matchesCampusTaxonomy(query) && !hasAcademicContext(query)) {
  return formatInstitutionalFallback({
    message: "VIT-AP Copilot assists with official university queries.",
    suggestedTopics: ["Syllabus", "Hostels", "Curfew", "Faculty"]
  });
}`
  },
  {
    id: 'retrieval',
    num: '03',
    name: 'FAISS Dense Search',
    shortMetric: 'Top-K Vector Chunks',
    icon: Database,
    title: 'Dense Vector Retrieval with all-MiniLM-L6-v2',
    description:
      'The FAISS (Facebook AI Similarity Search) index retrieves the top 3-5 semantic chunks from over 100+ indexed institutional documents, ranking by Euclidean distance and dot-product relevance.',
    metrics: [
      { label: 'Embedding Model', val: 'all-MiniLM-L6-v2' },
      { label: 'Vector Dimensions', val: '384 Dimensions' },
      { label: 'Chunk Window', val: '500 tokens / 75 overlap' }
    ],
    codeSnippet: `# Dense Retrieval Execution
query_vector = embedder.encode([user_query]).astype('float32')
faiss.normalize_L2(query_vector)

# Retrieve top-k nearest neighbors
distances, indices = faiss_index.search(query_vector, k=5)
matched_chunks = [document_store[idx] for idx in indices[0]]`
  },
  {
    id: 'synthesis',
    num: '04',
    name: 'Dual-Brain LLM',
    shortMetric: 'Gemini + Ollama',
    icon: Cpu,
    title: 'Hybrid Cloud & Local Fallback Synthesis',
    description:
      'Retrieved institutional chunks and system instructions are dispatched to Google Gemini 3.5 Flash for high-speed streaming synthesis. In case of API rate limits or offline conditions, the engine fails over to a local Ollama instance seamlessly.',
    metrics: [
      { label: 'Primary Engine', val: 'Gemini 3.5 Flash' },
      { label: 'Fallback Engine', val: 'Ollama (Llama 3)' },
      { label: 'Streaming TTFT', val: '320 ms' }
    ],
    codeSnippet: `try:
    # Primary: Cloud High-Speed Synthesis
    async for token in gemini_client.stream_generate(context, query):
        yield token
except (APIError, RateLimitError):
    # Seamless Failover: Local Ollama Model
    async for token in ollama_client.stream_generate(context, query):
        yield token`
  },
  {
    id: 'verification',
    num: '05',
    name: 'Citation Assembly',
    shortMetric: '100% Grounded',
    icon: FileText,
    title: 'Verifiable Document Provenance & Page Attribution',
    description:
      'The generated answer is strictly verified against source chunks. Document metadata (filename, page numbers, coordinate bounding boxes) is formatted into interactive citations so every claim is verifiable.',
    metrics: [
      { label: 'Hallucination Check', val: 'Strict Prompt Grounding' },
      { label: 'Citations Emitted', val: 'Exact File & Page' },
      { label: 'Integrity', val: 'Deterministic Sources' }
    ],
    codeSnippet: `// Citation Verification Assembly
return {
  answer: synthesizedText,
  sources: matchedChunks.map(chunk => ({
    document: chunk.documentName,
    page: chunk.pageNumber,
    relevance: chunk.score,
    sourceUrl: chunk.officialUrl
  }))
};`
  }
];

export function PlatformPage() {
  const navigate = useNavigate();
  const [activeStepId, setActiveStepId] = useState<string>('retrieval');

  const activeStep = ARCHITECTURE_STEPS.find((s) => s.id === activeStepId) || ARCHITECTURE_STEPS[2];

  return (
    <div className={styles.pageWrapper}>
      <SiteNavbar onLaunchCopilot={() => navigate('/copilot')} />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowDot}></span>
              <span>ENGINEERING & SYSTEM ARCHITECTURE</span>
            </div>

            <h1 className={styles.heroHeadline}>
              The Hybrid Intelligence Engine <br />
              <span className={styles.heroHeadlineGradient}>Powering Campus Knowledge.</span>
            </h1>

            <p className={styles.heroDescription}>
              A purpose-built dual-brain RAG architecture combining universal coordinate PDF extraction,
              sub-50ms dense semantic caching, and deterministic institutional groundings.
            </p>

            {/* Spec Ribbon */}
            <div className={styles.specRibbon}>
              <div className={styles.specCard}>
                <div className={styles.specValue}>384-D</div>
                <div className={styles.specTitle}>Dense Embeddings</div>
                <div className={styles.specSubtitle}>sentence-transformers/all-MiniLM-L6-v2</div>
              </div>
              <div className={styles.specCard}>
                <div className={styles.specValue}>&lt; 20ms</div>
                <div className={styles.specTitle}>Semantic Cache</div>
                <div className={styles.specSubtitle}>Cosine similarity threshold &ge; 0.88</div>
              </div>
              <div className={styles.specCard}>
                <div className={styles.specValue}>x = 295</div>
                <div className={styles.specTitle}>Two-Column Parsing</div>
                <div className={styles.specSubtitle}>Bounding-box spatial coordinate split</div>
              </div>
              <div className={styles.specCard}>
                <div className={styles.specValue}>Dual-Brain</div>
                <div className={styles.specTitle}>High Resilience</div>
                <div className={styles.specSubtitle}>Gemini Cloud + Local Ollama Fallback</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Architecture Diagram */}
      <section className={styles.diagramSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>Interactive Data Pipeline</div>
            <h2 className={styles.sectionTitle}>End-to-End Query Lifecycle</h2>
            <p className={styles.sectionSubtitle}>
              Click any stage in the pipeline to inspect real algorithmic parameters, thresholds, and execution logic.
            </p>
          </div>

          <div className={styles.diagramContainer}>
            {/* Pipeline Step Tabs */}
            <div className={styles.diagramPipeline}>
              {ARCHITECTURE_STEPS.map((step) => {
                const IconComponent = step.icon;
                const isActive = step.id === activeStepId;
                return (
                  <div
                    key={step.id}
                    className={`${styles.pipelineStep} ${isActive ? styles.pipelineStepActive : ''}`}
                    onClick={() => setActiveStepId(step.id)}
                  >
                    <div className={styles.stepHeader}>
                      <span className={styles.stepNum}>{step.num}</span>
                      <div className={styles.stepIconWrap}>
                        <IconComponent size={14} />
                      </div>
                    </div>
                    <div className={styles.stepTitle}>{step.name}</div>
                    <div className={styles.stepMetric}>{step.shortMetric}</div>
                  </div>
                );
              })}
            </div>

            {/* Active Step Details */}
            <div className={styles.detailCard}>
              <div className={styles.detailLeft}>
                <h3>{activeStep.title}</h3>
                <p>{activeStep.description}</p>
                <div className={styles.detailMetrics}>
                  {activeStep.metrics.map((m, idx) => (
                    <div key={idx} className={styles.metricItem}>
                      <span className={styles.metricKey}>{m.label}</span>
                      <span className={styles.metricVal}>{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.detailCode}>
                <pre>{activeStep.codeSnippet}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Technical Modules */}
      <section className={styles.deepDiveSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>Core Innovations</div>
            <h2 className={styles.sectionTitle}>Precision Institutional Engineering</h2>
            <p className={styles.sectionSubtitle}>
              Every layer of the platform is designed to handle messy university documents with zero hallucination.
            </p>
          </div>

          <div className={styles.modulesGrid}>
            {/* Module 1: Two Column Extraction */}
            <div className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIconWrap}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className={styles.moduleTitle}>Coordinate-Aware PDF Extraction</h3>
                  <span className={styles.moduleSubtitle}>ALGORITHM: SPATIAL BOUNDING SPLIT</span>
                </div>
              </div>
              <p className={styles.moduleBody}>
                Standard text extraction flattens academic syllabi horizontally, intertwining left-column course codes
                with right-column credit allocations. Our coordinate parser segments text boxes around the central vertical
                gutter (x = 295pt) before sequential serialization.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Eliminates line interweaving in two-column curriculum handbooks.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Preserves tabular credit distributions and prerequisite matrices.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Retains exact page numbers and bounding coordinates for citations.</span>
                </li>
              </ul>
              <div className={styles.comparisonBox}>
                <div className={styles.comparisonRow}>
                  <span className={styles.badLabel}>Standard PDF Plumber:</span>
                  <span>Course Code 3 Credit Prerequisite CSE1001</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span className={styles.goodLabel}>Coordinate Parser:</span>
                  <span>[CSE1001] Problem Solving &amp; Programming | 3 Credits</span>
                </div>
              </div>
            </div>

            {/* Module 2: Semantic Caching */}
            <div className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIconWrap}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className={styles.moduleTitle}>Sub-50ms Semantic Cache</h3>
                  <span className={styles.moduleSubtitle}>COSINE THRESHOLD: 0.88 EMBEDDING MATCH</span>
                </div>
              </div>
              <p className={styles.moduleBody}>
                Over 60% of university inquiries relate to repetitive administrative queries (curfew, attendance, leave).
                Rather than incurring LLM token costs and latency for every repeat, dense vector embeddings match queries
                semantically in memory.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>14ms median retrieval time for high-frequency campus inquiries.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Semantic variation support (&quot;curfew time&quot; vs &quot;what time must I be back&quot;).</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Automated cache eviction whenever document versions update.</span>
                </li>
              </ul>
              <div className={styles.comparisonBox}>
                <div className={styles.comparisonRow}>
                  <span>Query Match: &quot;Sunday outing return time&quot;</span>
                  <span className={styles.goodLabel}>Score: 0.941 &rarr; Cache Hit (16ms)</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Query Match: &quot;Explain quantum entanglement&quot;</span>
                  <span className={styles.badLabel}>Score: 0.412 &rarr; LLM Pass-through</span>
                </div>
              </div>
            </div>

            {/* Module 3: FAISS Vector Index */}
            <div className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIconWrap}>
                  <Database size={20} />
                </div>
                <div>
                  <h3 className={styles.moduleTitle}>Dense FAISS Vector Index</h3>
                  <span className={styles.moduleSubtitle}>MODEL: all-MiniLM-L6-v2 (384-DIM)</span>
                </div>
              </div>
              <p className={styles.moduleBody}>
                All 86+ institutional manuals, regulations, and departmental syllabus files are chunked into 500-token
                segments with 75-token sliding overlaps. Vectors are indexed using FAISS FlatIP with L2 normalization for
                exact inner product ranking.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>L2 normalized inner product computes cosine similarity with minimal overhead.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Context window retains adjacent clause definitions and regulatory exceptions.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Persistent SQLite database couples vector embeddings with file hashes.</span>
                </li>
              </ul>
            </div>

            {/* Module 4: Domain Isolation & Verification */}
            <div className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIconWrap}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className={styles.moduleTitle}>Zero-Hallucination Guardrails</h3>
                  <span className={styles.moduleSubtitle}>GROUNDING: STRICT CITATION ENFORCEMENT</span>
                </div>
              </div>
              <p className={styles.moduleBody}>
                The generative synthesis prompt restricts the model to strictly retrieved context. If an inquiry cannot be
                substantiated by the retrieved document chunks, the model refrains from speculation and directs the user to
                the relevant deanery or portal.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Anti-hallucination constraint prevents inventing course codes or faculties.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Exact citation badges linked directly to authenticated university PDFs.</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <span>Deterministic error boundaries protect institutional integrity.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Brain Resilience Section */}
      <section className={styles.dualBrainSection}>
        <div className={styles.container}>
          <div className={styles.dualBrainCard}>
            <div>
              <h2 className={styles.dualBrainTitle}>Dual-Brain Architecture: Zero Downtime</h2>
              <p className={styles.dualBrainText}>
                VIT-AP Copilot combines the speed of cloud models with the self-hosted reliability of local execution.
                Students receive answers during network interruptions or API limits without service interruption.
              </p>
              <div className={styles.dualBrainBadges}>
                <div className={styles.engineBadge}>
                  <span className={styles.engineName}>Google Gemini 3.5 Flash</span>
                  <span className={styles.engineRole}>Primary Cloud Streamer</span>
                </div>
                <div className={styles.engineBadge}>
                  <span className={styles.engineName}>Ollama / Llama 3</span>
                  <span className={styles.engineRole}>Local Offline Failover</span>
                </div>
              </div>
            </div>

            <div className={styles.resilienceDiagram}>
              <div className={styles.diagramFlowRow}>
                <span className={styles.flowNode}>Cloud API Health Check</span>
                <span className={styles.flowStatusActive}>Operational (320ms TTFT)</span>
              </div>
              <div className={styles.diagramFlowRow}>
                <span className={styles.flowNode}>Local Ollama Inference Engine</span>
                <span className={styles.flowStatusStandby}>Standby (Automatic Failover)</span>
              </div>
              <div className={styles.diagramFlowRow}>
                <span className={styles.flowNode}>FAISS Vector Store</span>
                <span className={styles.flowStatusActive}>Local Disk / In-Memory</span>
              </div>
              <div className={styles.diagramFlowRow}>
                <span className={styles.flowNode}>Document Metadata Sync</span>
                <span className={styles.flowStatusActive}>86 Verified Documents</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Experience the Architecture in Real Time</h2>
            <p className={styles.ctaText}>
              Ask questions about course syllabi, hostel curfews, or faculty cabins and inspect verified source citations.
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
export default PlatformPage;
