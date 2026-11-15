import { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  UploadCloud, 
  Search, 
  Layers, 
  AlertCircle,
  Globe,
  FileText,
  Play,
  Pause,
  Square,
  RefreshCw,
  Sliders,
  ExternalLink,
  Terminal,
  FileUp
} from 'lucide-react';
import styles from './OrgAdmin.module.css';
import { 
  getDocuments, 
  uploadDocument, 
  deleteDocument,
  reprocessDocument,
  replaceDocument,
  getCrawlConfig,
  saveCrawlConfig,
  startCrawl,
  pauseCrawl,
  resumeCrawl,
  stopCrawl,
  getCrawlJobs,
  getCrawlJobLogs,
  getCrawledPages
} from '../services/admin';
import { getOrgStats, type OrgStats } from '../services/platform';

export function OrgAdmin() {
  const [activeTab, setActiveTab] = useState<'manual' | 'crawler'>('manual');
  
  // Manual Ingestion State
  const [documents, setDocuments] = useState<any[]>([]);
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Academics');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [targetReplaceDocId, setTargetReplaceDocId] = useState<string | null>(null);

  // Crawler State
  const [crawlConfig, setCrawlConfig] = useState<any>({
    seed_url: 'https://vitap.ac.in/',
    allowed_domains: ['vitap.ac.in'],
    max_depth: 3,
    max_pages: 100,
    discover_pdfs: true,
    discover_docs: true,
    schedule: 'manual',
    rate_limit_delay: 1.0,
    is_active: true
  });
  const [allowedDomainsStr, setAllowedDomainsStr] = useState('vitap.ac.in');
  const [activeJob, setActiveJob] = useState<any>(null);
  const [crawlerLogs, setCrawlerLogs] = useState<string[]>([]);
  const [crawledPages, setCrawledPages] = useState<any[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [crawlerActionPending, setCrawlerActionPending] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch docs & platform stats
  const fetchDocs = async () => {
    try {
      const [docs, stats] = await Promise.all([
        getDocuments(),
        getOrgStats().catch(() => null)
      ]);
      setDocuments(docs || []);
      if (stats) setOrgStats(stats);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  // Fetch crawler state
  const fetchCrawlerState = async () => {
    try {
      const [cfg, jobs, pagesData] = await Promise.all([
        getCrawlConfig().catch(() => null),
        getCrawlJobs().catch(() => []),
        getCrawledPages({ limit: 30 }).catch(() => ({ pages: [] }))
      ]);

      if (cfg) {
        setCrawlConfig(cfg);
        if (Array.isArray(cfg.allowed_domains)) {
          setAllowedDomainsStr(cfg.allowed_domains.join(', '));
        }
      }

      if (jobs && jobs.length > 0) {
        const latestJob = jobs[0];
        setActiveJob(latestJob);
        // If job is running or recent, fetch logs
        const logsRes = await getCrawlJobLogs(latestJob.id).catch(() => ({ logs: [] }));
        setCrawlerLogs(logsRes.logs || []);
      }

      if (pagesData && pagesData.pages) {
        setCrawledPages(pagesData.pages);
      }
    } catch (err) {
      console.error("Failed to fetch crawler state", err);
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchCrawlerState();

    const interval = setInterval(() => {
      if (activeTab === 'manual') {
        fetchDocs();
      } else {
        fetchCrawlerState();
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'crawler' && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [crawlerLogs, activeTab]);

  // Upload handler (supports multiple files)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("category", selectedCategory);
        formData.append("source_type", "manual");
        formData.append("version", "1.0");
        await uploadDocument(formData);
      }
      await fetchDocs();
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Replace file handler
  const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !targetReplaceDocId) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      await replaceDocument(targetReplaceDocId, formData);
      await fetchDocs();
    } catch (err: any) {
      alert(err.message || "Failed to replace document");
    } finally {
      setTargetReplaceDocId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleReprocess = async (id: string, name: string) => {
    try {
      await reprocessDocument(id);
      await fetchDocs();
    } catch (err: any) {
      alert(err.message || `Failed to reprocess ${name}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" and all its vector embeddings?`)) return;
    try {
      await deleteDocument(id);
      await fetchDocs();
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  // Crawler Controls
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const domains = allowedDomainsStr.split(',').map(d => d.trim()).filter(Boolean);
      const payload = {
        ...crawlConfig,
        allowed_domains: domains.length ? domains : ['vitap.ac.in']
      };
      await saveCrawlConfig(payload);
      alert("Crawler configuration saved successfully!");
      fetchCrawlerState();
    } catch (err: any) {
      alert(err.message || "Failed to save crawler configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleStartCrawl = async () => {
    setCrawlerActionPending(true);
    try {
      await startCrawl();
      await fetchCrawlerState();
    } catch (err: any) {
      alert(err.message || "Failed to start crawler");
    } finally {
      setCrawlerActionPending(false);
    }
  };

  const handlePauseCrawl = async () => {
    if (!activeJob) return;
    setCrawlerActionPending(true);
    try {
      await pauseCrawl(activeJob.id);
      await fetchCrawlerState();
    } catch (err: any) {
      alert(err.message || "Failed to pause crawl");
    } finally {
      setCrawlerActionPending(false);
    }
  };

  const handleResumeCrawl = async () => {
    if (!activeJob) return;
    setCrawlerActionPending(true);
    try {
      await resumeCrawl(activeJob.id);
      await fetchCrawlerState();
    } catch (err: any) {
      alert(err.message || "Failed to resume crawl");
    } finally {
      setCrawlerActionPending(false);
    }
  };

  const handleStopCrawl = async () => {
    if (!activeJob) return;
    if (!confirm("Are you sure you want to stop the active crawl job?")) return;
    setCrawlerActionPending(true);
    try {
      await stopCrawl(activeJob.id);
      await fetchCrawlerState();
    } catch (err: any) {
      alert(err.message || "Failed to stop crawl");
    } finally {
      setCrawlerActionPending(false);
    }
  };

  const getExtensionColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.35)' };
      case 'xlsx':
      case 'xls': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.35)' };
      case 'docx': 
      case 'doc': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.35)' };
      case 'csv': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.35)' };
      case 'pptx':
      case 'ppt': return { bg: 'rgba(249, 115, 22, 0.15)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.35)' };
      case 'html':
      case 'htm': return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22D3EE', border: 'rgba(6, 182, 212, 0.35)' };
      default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.35)' };
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const filteredDocs = documents.filter(doc => {
    return (doc.name || doc.filename || '').toLowerCase().includes(search.toLowerCase());
  });

  const isCrawlRunning = activeJob?.status === 'RUNNING';
  const isCrawlPaused = activeJob?.status === 'PAUSED';

  return (
    <div className={styles.container}>
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        style={{ display: 'none' }} 
        multiple
        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.txt,.md,.html,.htm"
      />
      <input 
        type="file" 
        ref={replaceInputRef} 
        onChange={handleReplaceUpload} 
        style={{ display: 'none' }} 
        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.txt,.md,.html,.htm"
      />

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge Management & Ingestion</h1>
          <p className={styles.subtitle}>Dual-channel ingestion: upload university documents or run automated official website crawls</p>
        </div>

        <div className={styles.tabNav}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <FileText size={16} />
            <span>Manual Ingestion</span>
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'crawler' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('crawler')}
          >
            <Globe size={16} />
            <span>Website Crawler</span>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* TAB 1: MANUAL DOCUMENT INGESTION                             */}
      {/* ============================================================ */}
      {activeTab === 'manual' && (
        <>
          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(85, 119, 255, 0.15)', color: 'var(--accent-primary, #6366F1)' }}>
                <Database size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{documents.length}</span>
                <span className={styles.kpiLabel}>Documents Ingested</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan, #06B6D4)' }}>
                <Layers size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{totalChunks}</span>
                <span className={styles.kpiLabel}>FAISS Vector Chunks</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald, #10B981)' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{orgStats?.system_uptime ?? "99.9%"}</span>
                <span className={styles.kpiLabel}>RAG Ingestion Health</span>
              </div>
            </div>
          </div>

          {/* Upload Dropzone & Category Config */}
          <div className={styles.uploadSection}>
            <div className={styles.uploadMetaRow}>
              <span className={styles.metaLabel}>Assign Category for Uploads:</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.metaSelect}
              >
                <option value="Academics">Academics & Regulations</option>
                <option value="Curriculum">Curriculum & Syllabi</option>
                <option value="Hostel Rules">Hostel & Campus Life</option>
                <option value="Faculty Directory">Faculty & Staff Directory</option>
                <option value="Examinations">Examinations & Grading</option>
                <option value="General">General Policies</option>
              </select>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Multi-file batch uploads enabled
              </span>
            </div>

            <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
              <div className={styles.uploadIconCircle}>
                <UploadCloud size={28} />
              </div>
              <h3 className={styles.uploadTitle}>
                {uploading ? "Extracting, Chunking & Indexing Embeddings..." : "Drop university documents or click to browse"}
              </h3>
              <p className={styles.uploadDesc}>
                Supports PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, and HTML. Tables, multi-column curricula, and bylaws are parsed into dense semantic chunks with coordinate awareness.
              </p>

              <div className={styles.supportedPills}>
                <span className={styles.fileTypeBadge}>PDF (Curricula & Handbooks)</span>
                <span className={styles.fileTypeBadge}>DOCX (Regulations)</span>
                <span className={styles.fileTypeBadge}>XLSX (Faculty Directories)</span>
                <span className={styles.fileTypeBadge}>PPTX (Presentations)</span>
                <span className={styles.fileTypeBadge}>CSV / TSV</span>
                <span className={styles.fileTypeBadge}>HTML</span>
                <span className={styles.fileTypeBadge}>Markdown / Plain Text</span>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <section className={styles.tableSection}>
            <div className={styles.tableToolbar}>
              <div className={styles.searchBox}>
                <Search size={15} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search documents by name or category..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing {filteredDocs.length} of {documents.length} indexed documents
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Source</th>
                    <th>Category</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Chunks</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No documents found in knowledge base.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => {
                      const ext = (doc.filename || doc.name).split('.').pop()?.toUpperCase() || 'FILE';
                      const styleColors = getExtensionColor(doc.filename || doc.name);
                      const isCrawlerSource = doc.source_type === 'crawler';

                      return (
                        <tr key={doc.id}>
                          <td>
                            <div className={styles.docNameCol}>
                              <span 
                                className={styles.docExtBadge}
                                style={{ 
                                  background: styleColors.bg, 
                                  color: styleColors.text, 
                                  border: `1px solid ${styleColors.border}` 
                                }}
                              >
                                {ext}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{doc.name || doc.filename}</span>
                                {doc.source_url && (
                                  <a 
                                    href={doc.source_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ fontSize: '0.72rem', color: 'var(--accent-cyan, #06B6D4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}
                                  >
                                    <ExternalLink size={10} />
                                    <span>{doc.source_url.length > 55 ? doc.source_url.substring(0, 52) + '...' : doc.source_url}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {isCrawlerSource ? (
                              <span className={`${styles.sourceBadge} ${styles.sourceBadgeCrawler}`}>
                                <Globe size={11} /> Crawler
                              </span>
                            ) : (
                              <span className={`${styles.sourceBadge} ${styles.sourceBadgeManual}`}>
                                <FileText size={11} /> Manual
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {doc.category || 'General'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                              v{doc.version || '1.0'}
                            </span>
                          </td>
                          <td>
                            {doc.status === 'READY' && (
                              <span className={styles.statusReady}>
                                <CheckCircle2 size={12} /> Indexed
                              </span>
                            )}
                            {(doc.status === 'INDEXING' || doc.status === 'PROCESSING') && (
                              <span className={styles.statusIndexing}>
                                <Loader2 size={12} className="animate-spin" /> {doc.status}
                              </span>
                            )}
                            {doc.status === 'FAILED' && (
                              <span className={styles.statusFailed} title={doc.error_message || "Ingestion error"}>
                                <AlertCircle size={12} /> Failed
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                              {doc.chunk_count || 0} chunks
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionBtns}>
                              {/* Reprocess */}
                              <button 
                                className={styles.actionBtn}
                                onClick={() => handleReprocess(doc.id, doc.name || doc.filename)}
                                title="Reprocess & Re-index document"
                              >
                                <RefreshCw size={14} />
                              </button>

                              {/* Replace version */}
                              {!isCrawlerSource && (
                                <button 
                                  className={styles.actionBtn}
                                  onClick={() => {
                                    setTargetReplaceDocId(doc.id);
                                    replaceInputRef.current?.click();
                                  }}
                                  title="Replace with new version"
                                >
                                  <FileUp size={14} />
                                </button>
                              )}

                              {/* Delete */}
                              <button 
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                onClick={() => handleDelete(doc.id, doc.name || doc.filename)}
                                title="Delete from knowledge base"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: AUTOMATED WEBSITE CRAWLER                            */}
      {/* ============================================================ */}
      {activeTab === 'crawler' && (
        <>
          {/* Crawler Live Control Bar */}
          <div className={styles.crawlerControlsBar}>
            <div className={styles.crawlerStatusBlock}>
              <div 
                className={`${styles.statusIndicatorDot} ${
                  isCrawlRunning ? styles.dotRunning : 
                  isCrawlPaused ? styles.dotPaused : 
                  activeJob?.status === 'FAILED' ? styles.dotFailed : styles.dotIdle
                }`} 
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Crawler Status: {activeJob ? activeJob.status : 'IDLE'}</span>
                  {isCrawlRunning && <Loader2 size={14} className="animate-spin" style={{ color: '#10B981' }} />}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Target: {crawlConfig.seed_url} | Discovered: {activeJob?.urls_discovered || 0} | Crawled: {activeJob?.pages_crawled || 0}
                </div>
              </div>
            </div>

            <div className={styles.ctrlBtnGroup}>
              {/* Start Crawl */}
              <button 
                className={`${styles.ctrlBtn} ${styles.btnStart}`}
                onClick={handleStartCrawl}
                disabled={isCrawlRunning || isCrawlPaused || crawlerActionPending}
              >
                <Play size={15} />
                <span>Start Crawl</span>
              </button>

              {/* Pause Crawl */}
              {isCrawlRunning && (
                <button 
                  className={`${styles.ctrlBtn} ${styles.btnPause}`}
                  onClick={handlePauseCrawl}
                  disabled={crawlerActionPending}
                >
                  <Pause size={15} />
                  <span>Pause</span>
                </button>
              )}

              {/* Resume Crawl */}
              {isCrawlPaused && (
                <button 
                  className={`${styles.ctrlBtn} ${styles.btnResume}`}
                  onClick={handleResumeCrawl}
                  disabled={crawlerActionPending}
                >
                  <Play size={15} />
                  <span>Resume</span>
                </button>
              )}

              {/* Stop Crawl */}
              {(isCrawlRunning || isCrawlPaused) && (
                <button 
                  className={`${styles.ctrlBtn} ${styles.btnStop}`}
                  onClick={handleStopCrawl}
                  disabled={crawlerActionPending}
                >
                  <Square size={15} />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>

          {/* Crawler KPI Grid */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan, #06B6D4)' }}>
                <Globe size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{activeJob?.pages_crawled || 0}</span>
                <span className={styles.kpiLabel}>Pages Crawled & Ingested</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
                <FileText size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{activeJob?.documents_indexed || 0}</span>
                <span className={styles.kpiLabel}>PDFs & Docs Ingested</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{activeJob?.urls_discovered || 0}</span>
                <span className={styles.kpiLabel}>URLs Discovered in Queue</span>
              </div>
            </div>
          </div>

          {/* Config & Live Log Split Section */}
          <div className={styles.configGrid}>
            {/* Crawler Configuration */}
            <div className={styles.configCard}>
              <div className={styles.configCardTitle}>
                <Sliders size={18} color="var(--accent-cyan, #06B6D4)" />
                <span>Crawler Parameters & Guardrails</span>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Seed URL (SSRF Protected):</label>
                <input 
                  type="text" 
                  value={crawlConfig.seed_url || ''} 
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, seed_url: e.target.value })}
                  placeholder="https://vitap.ac.in/"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Allowed Domains (Strict Allowlist):</label>
                <input 
                  type="text" 
                  value={allowedDomainsStr} 
                  onChange={(e) => setAllowedDomainsStr(e.target.value)}
                  placeholder="vitap.ac.in, vtop.vitap.ac.in"
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Max Depth (Hops):</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={6}
                    value={crawlConfig.max_depth || 3} 
                    onChange={(e) => setCrawlConfig({ ...crawlConfig, max_depth: parseInt(e.target.value) || 3 })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Max Pages Limit:</label>
                  <input 
                    type="number" 
                    min={10} 
                    max={500}
                    value={crawlConfig.max_pages || 100} 
                    onChange={(e) => setCrawlConfig({ ...crawlConfig, max_pages: parseInt(e.target.value) || 100 })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Crawl Frequency:</label>
                  <select 
                    value={crawlConfig.schedule || 'manual'} 
                    onChange={(e) => setCrawlConfig({ ...crawlConfig, schedule: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="manual">Manual Trigger Only</option>
                    <option value="daily">Daily Auto-Crawl</option>
                    <option value="weekly">Weekly Auto-Crawl</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Politeness Delay (seconds):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5" 
                    max="5.0"
                    value={crawlConfig.rate_limit_delay || 1.0} 
                    onChange={(e) => setCrawlConfig({ ...crawlConfig, rate_limit_delay: parseFloat(e.target.value) || 1.0 })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                <label className={styles.checkboxRow}>
                  <input 
                    type="checkbox" 
                    checked={crawlConfig.discover_pdfs ?? true} 
                    onChange={(e) => setCrawlConfig({ ...crawlConfig, discover_pdfs: e.target.checked })}
                  />
                  <span>Discover & Ingest Linked PDF Documents Automatically</span>
                </label>

                <label className={styles.checkboxRow}>
                  <input 
                    type="checkbox" 
                    checked={crawlConfig.discover_docs ?? true} 
                    onChange={(e) => setCrawlConfig({ ...crawlConfig, discover_docs: e.target.checked })}
                  />
                  <span>Discover & Ingest DOCX, XLSX, PPTX & Data Sheets</span>
                </label>
              </div>

              <button 
                className="btn-primary" 
                onClick={handleSaveConfig}
                disabled={savingConfig}
                style={{ marginTop: 'auto' }}
              >
                {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Sliders size={16} />}
                <span>{savingConfig ? "Saving Configuration..." : "Save Configuration"}</span>
              </button>
            </div>

            {/* Live Crawler Logs Terminal */}
            <div className={styles.terminalContainer}>
              <div className={styles.terminalHeader}>
                <div className={styles.terminalTitle}>
                  <Terminal size={14} color="#38BDF8" />
                  <span>CRAWLER CONSOLE & RUNTIME LOGS</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {crawlerLogs.length} events logged
                </span>
              </div>

              <div className={styles.terminalBody}>
                {crawlerLogs.length === 0 ? (
                  <div style={{ color: '#475569', fontStyle: 'italic' }}>
                    No crawler activity logged yet. Click "Start Crawl" to begin collecting official VIT-AP web resources.
                  </div>
                ) : (
                  crawlerLogs.map((log, idx) => (
                    <div key={idx} className={styles.logLine}>
                      {log}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

          {/* Discovered URLs & Crawled Pages Table */}
          <section className={styles.tableSection}>
            <div className={styles.tableToolbar}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                Discovered Pages & Documents ({crawledPages.length})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ETag and SHA-256 hash checks prevent re-indexing unchanged content
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>URL & Target</th>
                    <th>Title</th>
                    <th>Depth</th>
                    <th>HTTP</th>
                    <th>Content Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {crawledPages.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No pages discovered yet. Start the crawler to inspect discovered university pages.
                      </td>
                    </tr>
                  ) : (
                    crawledPages.map((page) => (
                      <tr key={page.id}>
                        <td>
                          <a 
                            href={page.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: 'var(--accent-cyan, #06B6D4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                          >
                            <ExternalLink size={12} />
                            <span>{page.url.length > 50 ? page.url.substring(0, 48) + '...' : page.url}</span>
                          </a>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                            {page.title ? (page.title.length > 40 ? page.title.substring(0, 38) + '...' : page.title) : 'Untitled Page'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            Hop {page.depth}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.8rem', 
                            color: page.http_status === 200 ? '#34D399' : page.http_status === 304 ? '#60A5FA' : '#F87171' 
                          }}>
                            {page.http_status || '---'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {page.content_type?.split(';')[0] || 'text/html'}
                          </span>
                        </td>
                        <td>
                          {page.status === 'INDEXED' && (
                            <span className={styles.statusReady}>
                              <CheckCircle2 size={12} /> Indexed
                            </span>
                          )}
                          {page.status === 'SKIPPED_UNCHANGED' && (
                            <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                              Unchanged (304)
                            </span>
                          )}
                          {page.status === 'FETCHED' && (
                            <span className={styles.statusIndexing}>
                              Fetched
                            </span>
                          )}
                          {page.status === 'DISCOVERED' && (
                            <span style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '9999px', background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' }}>
                              Queued
                            </span>
                          )}
                          {page.status === 'FAILED' && (
                            <span className={styles.statusFailed} title={page.error_message || ''}>
                              <AlertCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
