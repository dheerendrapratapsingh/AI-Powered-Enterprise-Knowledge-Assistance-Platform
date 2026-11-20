import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Search, 
  UploadCloud, 
  FileText, 
  Globe, 
  CheckCircle2, 
  Eye, 
  RefreshCw, 
  FileUp, 
  Trash2, 
  ExternalLink, 
  X, 
  Layers, 
  Plus, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import styles from './DocumentBase.module.css';
import { 
  getDocuments, 
  uploadDocument, 
  deleteDocument, 
  reprocessDocument, 
  replaceDocument, 
  getDocumentChunks,
  getKnowledgeStats 
} from '../services/admin';
import { getOrgStats, type OrgStats } from '../services/platform';

export function DocumentBase() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null);
  const [knowledgeStats, setKnowledgeStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'crawler'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Academics');
  const [uploading, setUploading] = useState(false);

  // Replacement target
  const [targetReplaceDocId, setTargetReplaceDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Chunk Drawer
  const [inspectedDoc, setInspectedDoc] = useState<any | null>(null);
  const [inspectedChunks, setInspectedChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const fetchDocs = async () => {
    try {
      const [docs, stats, kStats] = await Promise.all([
        getDocuments(),
        getOrgStats().catch(() => null),
        getKnowledgeStats().catch(() => null)
      ]);
      setDocuments(docs || []);
      if (stats) setOrgStats(stats);
      if (kStats) setKnowledgeStats(kStats);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 4500);
    return () => clearInterval(interval);
  }, []);

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
        formData.append("category", uploadCategory);
        formData.append("source_type", "manual");
        formData.append("version", "1.0");
        await uploadDocument(formData);
      }
      await fetchDocs();
      setShowUploadZone(false);
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

  const handleInspectChunks = async (doc: any) => {
    setInspectedDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await getDocumentChunks(doc.id);
      setInspectedChunks(res.chunks || []);
    } catch (err) {
      alert("Failed to load document chunks");
    } finally {
      setLoadingChunks(false);
    }
  };

  const getExtensionColor = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'docx':
      case 'doc': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' };
      case 'xlsx':
      case 'xls':
      case 'csv': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'pptx':
      case 'ppt': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'md':
      case 'txt': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' };
      case 'html':
      case 'htm': return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22D3EE', border: 'rgba(6, 182, 212, 0.3)' };
      default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#CBD5E1', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  // Categories list
  const categories = Array.from(new Set(documents.map(d => d.category || 'General'))).sort();

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const docName = (doc.name || doc.filename || '').toLowerCase();
    const docCategory = (doc.category || '').toLowerCase();
    const docUrl = (doc.source_url || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = docName.includes(query) || docCategory.includes(query) || docUrl.includes(query);
    const matchesSource = 
      sourceFilter === 'all' ? true : 
      sourceFilter === 'manual' ? doc.source_type !== 'crawler' : 
      doc.source_type === 'crawler';
    const matchesCategory = selectedCategory === 'all' ? true : doc.category === selectedCategory;

    return matchesSearch && matchesSource && matchesCategory;
  });

  const totalChunks = knowledgeStats?.total_chunks ?? documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const manualCount = documents.filter(d => d.source_type !== 'crawler').length;
  const crawlerCount = documents.filter(d => d.source_type === 'crawler').length;

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

      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            <Database size={26} color="var(--accent-primary, #6366F1)" />
            <span>Document Knowledge Base</span>
          </h1>
          <p className={styles.subtitle}>
            Manage, inspect, and search all verified university documents, handbooks, syllabi, and crawled web pages
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            className={styles.btnPrimary}
            onClick={() => setShowUploadZone(!showUploadZone)}
          >
            <Plus size={16} />
            <span>{showUploadZone ? "Hide Upload Zone" : "Upload Documents"}</span>
            {showUploadZone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </header>

      {/* Stats Chips Row */}
      <div className={styles.statsRow}>
        <div className={styles.statChip}>
          <Database size={16} color="var(--accent-primary, #6366F1)" />
          <span>Documents:</span>
          <span className={styles.statVal}>{documents.length}</span>
        </div>

        <div className={styles.statChip}>
          <Layers size={16} color="var(--accent-cyan, #06B6D4)" />
          <span>Vector Chunks:</span>
          <span className={styles.statVal}>{totalChunks}</span>
        </div>

        <div className={styles.statChip}>
          <FileText size={16} color="#A5B4FC" />
          <span>Manual Docs:</span>
          <span className={styles.statVal}>{manualCount}</span>
        </div>

        <div className={styles.statChip}>
          <Globe size={16} color="#67E8F9" />
          <span>Crawled Pages:</span>
          <span className={styles.statVal}>{crawlerCount}</span>
        </div>

        <div className={styles.statChip}>
          <CheckCircle2 size={16} color="#34D399" />
          <span>RAG Status:</span>
          <span className={styles.statVal} style={{ color: '#34D399' }}>{orgStats?.system_uptime ?? "100% Active"}</span>
        </div>
      </div>

      {/* Collapsible Upload Zone */}
      {showUploadZone && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadMetaRow}>
            <span className={styles.metaLabel}>Assign Category for Upload:</span>
            <select 
              value={uploadCategory} 
              onChange={(e) => setUploadCategory(e.target.value)}
              className={styles.metaSelect}
            >
              <option value="Academics">Academics & Regulations</option>
              <option value="Curriculum">Curriculum & Syllabi</option>
              <option value="Hostel Rules">Hostel & Campus Life</option>
              <option value="Faculty Directory">Faculty & Staff Directory</option>
              <option value="Examinations">Examinations & Grading</option>
              <option value="Transport">Transport & Bus Routes</option>
              <option value="General">General Policies</option>
            </select>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94A3B8)', marginLeft: 'auto' }}>
              Multi-file batch uploads enabled
            </span>
          </div>

          <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
            <div className={styles.uploadIconCircle}>
              <UploadCloud size={26} />
            </div>
            <h3 className={styles.uploadTitle}>
              {uploading ? "Extracting, Chunking & Embedding Vectors..." : "Drop university documents or click to browse"}
            </h3>
            <p className={styles.uploadDesc}>
              Supports PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, and HTML. Tables, handbooks, and schedules are parsed into coordinate-aware dense chunks.
            </p>

            <div className={styles.supportedPills}>
              <span className={styles.fileTypeBadge}>PDF Handbooks</span>
              <span className={styles.fileTypeBadge}>DOCX Regulations</span>
              <span className={styles.fileTypeBadge}>XLSX Directories</span>
              <span className={styles.fileTypeBadge}>Markdown & TXT</span>
              <span className={styles.fileTypeBadge}>CSV Schedules</span>
              <span className={styles.fileTypeBadge}>HTML</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Document Table Section */}
      <section className={styles.tableSection}>
        <div className={styles.tableToolbar}>
          <div className={styles.filterGroup}>
            {/* Search Box */}
            <div className={styles.searchBox}>
              <Search size={15} color="var(--text-muted, #64748B)" />
              <input 
                type="text" 
                placeholder="Search documents by name, category, or url..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Source Toggle */}
            <div className={styles.sourceToggle}>
              <button 
                className={`${styles.sourceToggleBtn} ${sourceFilter === 'all' ? styles.sourceToggleBtnActive : ''}`}
                onClick={() => setSourceFilter('all')}
              >
                All ({documents.length})
              </button>
              <button 
                className={`${styles.sourceToggleBtn} ${sourceFilter === 'manual' ? styles.sourceToggleBtnActive : ''}`}
                onClick={() => setSourceFilter('manual')}
              >
                Manual ({manualCount})
              </button>
              <button 
                className={`${styles.sourceToggleBtn} ${sourceFilter === 'crawler' ? styles.sourceToggleBtnActive : ''}`}
                onClick={() => setSourceFilter('crawler')}
              >
                Crawler ({crawlerCount})
              </button>
            </div>

            {/* Category Dropdown Filter */}
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94A3B8)' }}>
            Showing <strong>{filteredDocs.length}</strong> of <strong>{documents.length}</strong> indexed documents
          </div>
        </div>

        {/* The Documents Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Source</th>
                <th>Category</th>
                <th>Status</th>
                <th>FAISS Chunks</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted, #64748B)' }}>
                    No documents matching your search/filter criteria.
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
                            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{doc.name || doc.filename}</span>
                            {doc.source_url && (
                              <a 
                                href={doc.source_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ 
                                  fontSize: '0.72rem', 
                                  color: 'var(--accent-cyan, #06B6D4)', 
                                  textDecoration: 'none', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 3, 
                                  marginTop: 2 
                                }}
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94A3B8)' }}>
                          {doc.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.statusReady}>
                          <CheckCircle2 size={12} /> Ready
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary, #94A3B8)', fontWeight: 600 }}>
                          {doc.chunk_count || 0} chunks
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          {/* Inspect Chunks */}
                          <button 
                            className={styles.actionBtn}
                            onClick={() => handleInspectChunks(doc)}
                            title="Inspect Vector Chunks"
                          >
                            <Eye size={14} color="var(--accent-cyan, #06B6D4)" />
                          </button>

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

      {/* Inspect Chunks Slide-Over Drawer */}
      {inspectedDoc && (
        <div className={styles.drawerOverlay} onClick={() => setInspectedDoc(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 className={styles.drawerTitle}>Vector Chunks Deep-Dive</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)' }}>
                  {inspectedDoc.name || inspectedDoc.filename} ({inspectedChunks.length} Chunks Embedded)
                </span>
              </div>
              <button className={styles.drawerCloseBtn} onClick={() => setInspectedDoc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {loadingChunks ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #64748B)' }}>
                  Loading vector embeddings...
                </div>
              ) : inspectedChunks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #64748B)' }}>
                  No vector chunks found for this document. Try clicking "Reprocess".
                </div>
              ) : (
                inspectedChunks.map((chunk, idx) => (
                  <div key={chunk.id || idx} className={styles.chunkItemCard}>
                    <div className={styles.chunkItemTop}>
                      <span>CHUNK #{idx + 1}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)' }}>
                        ID: {chunk.id?.substring(0, 8)}...
                      </span>
                    </div>

                    <div className={styles.chunkItemText}>
                      {chunk.text}
                    </div>

                    <div className={styles.chunkStatsRow}>
                      <span>Length: {chunk.text?.length || 0} chars</span>
                      <span>Words: {chunk.text ? chunk.text.split(/\s+/).length : 0}</span>
                      {chunk.meta?.section && <span>Section: {chunk.meta.section}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
