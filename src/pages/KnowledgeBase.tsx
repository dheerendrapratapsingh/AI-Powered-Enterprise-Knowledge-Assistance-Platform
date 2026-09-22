import { useState, useCallback } from 'react';
import {
  FileText, Trash2, RefreshCw, Search, Filter,
  ChevronDown, Clock, Database, CheckCircle2, XCircle, Upload
} from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { StatusBadge, type DocStatus } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import styles from './KnowledgeBase.module.css';

interface KnowledgeDoc {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'csv' | 'md';
  size: string;
  status: DocStatus;
  uploadedAt: string;
  chunks: number;
  accessRoles: string[];
  uploadedBy: string;
}

const MOCK_DOCS: KnowledgeDoc[] = [
  { id: 'd1', name: 'Employee Handbook 2026.pdf', type: 'pdf', size: '4.2 MB', status: 'indexed', uploadedAt: '2026-09-10', chunks: 284, accessRoles: ['All'], uploadedBy: 'Himanvi R.' },
  { id: 'd2', name: 'Developer Deployment Guide.pdf', type: 'pdf', size: '2.1 MB', status: 'indexed', uploadedAt: '2026-09-10', chunks: 142, accessRoles: ['Engineers'], uploadedBy: 'Himanvi R.' },
  { id: 'd3', name: 'Production Deployment SOP.docx', type: 'docx', size: '890 KB', status: 'indexed', uploadedAt: '2026-09-11', chunks: 67, accessRoles: ['Engineers', 'DevOps'], uploadedBy: 'Himanvi R.' },
  { id: 'd4', name: 'Leave & HR Policies.pdf', type: 'pdf', size: '1.3 MB', status: 'indexed', uploadedAt: '2026-09-12', chunks: 98, accessRoles: ['All'], uploadedBy: 'Himanvi R.' },
  { id: 'd5', name: 'Q3 Security Guidelines.pdf', type: 'pdf', size: '3.7 MB', status: 'embedding', uploadedAt: '2026-09-20', chunks: 0, accessRoles: ['All'], uploadedBy: 'Himanvi R.' },
  { id: 'd6', name: 'Onboarding Checklist.docx', type: 'docx', size: '210 KB', status: 'chunking', uploadedAt: '2026-09-21', chunks: 0, accessRoles: ['All'], uploadedBy: 'Himanvi R.' },
  { id: 'd7', name: 'Tech Stack Overview.md', type: 'md', size: '45 KB', status: 'extracting', uploadedAt: '2026-09-22', chunks: 0, accessRoles: ['Engineers'], uploadedBy: 'Himanvi R.' },
  { id: 'd8', name: 'Legacy Benefits Data.csv', type: 'csv', size: '120 KB', status: 'failed', uploadedAt: '2026-09-15', chunks: 0, accessRoles: ['HR'], uploadedBy: 'Himanvi R.' },
];

const TYPE_COLORS: Record<string, string> = {
  pdf: '#f87171', docx: '#60a5fa', txt: '#a3a3a3', csv: '#4ade80', md: '#c084fc',
};

const PIPELINE_STEPS: DocStatus[] = ['uploaded', 'extracting', 'chunking', 'embedding', 'indexed'];

const STEP_ICONS: Record<DocStatus, React.ReactNode> = {
  uploaded: <Upload size={14} />,
  extracting: <FileText size={14} />,
  chunking: <Database size={14} />,
  embedding: <RefreshCw size={14} />,
  indexed: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
};

export function KnowledgeBase() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(MOCK_DOCS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | DocStatus>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: docs.length,
    indexed: docs.filter(d => d.status === 'indexed').length,
    processing: docs.filter(d => ['extracting','chunking','embedding','uploaded'].includes(d.status)).length,
    failed: docs.filter(d => d.status === 'failed').length,
    totalChunks: docs.reduce((a, d) => a + d.chunks, 0),
  };

  const handleFiles = useCallback((files: File[]) => {
    setUploading(true);
    const newDocs: KnowledgeDoc[] = files.map(f => ({
      id: `d${Date.now()}-${Math.random()}`,
      name: f.name,
      type: f.name.split('.').pop() as KnowledgeDoc['type'],
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      status: 'uploaded' as DocStatus,
      uploadedAt: new Date().toISOString().slice(0, 10),
      chunks: 0,
      accessRoles: ['All'],
      uploadedBy: 'You',
    }));
    setDocs(prev => [...newDocs, ...prev]);

    // Simulate pipeline progression
    setTimeout(() => {
      setDocs(prev => prev.map(d => newDocs.find(nd => nd.id === d.id) ? { ...d, status: 'extracting' } : d));
    }, 1200);
    setTimeout(() => {
      setDocs(prev => prev.map(d => newDocs.find(nd => nd.id === d.id) ? { ...d, status: 'chunking' } : d));
    }, 2800);
    setTimeout(() => {
      setDocs(prev => prev.map(d => newDocs.find(nd => nd.id === d.id) ? { ...d, status: 'embedding' } : d));
    }, 4500);
    setTimeout(() => {
      setDocs(prev => prev.map(d => newDocs.find(nd => nd.id === d.id) ? { ...d, status: 'indexed', chunks: Math.floor(Math.random() * 200 + 30) } : d));
      setUploading(false);
    }, 7000);

    setShowUpload(false);
  }, []);

  const deleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  const reprocess = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'extracting', chunks: 0 } : d));
    setTimeout(() => setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'indexed', chunks: Math.floor(Math.random() * 200 + 30) } : d)), 3000);
  };

  const stepIndex = (status: DocStatus) => PIPELINE_STEPS.indexOf(status);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge Base</h1>
          <p className={styles.subtitle}>Manage documents that power your AI assistant</p>
        </div>
        <button id="upload-docs-btn" className={styles.primaryBtn} onClick={() => setShowUpload(true)}>
          <Upload size={16} /> Upload Documents
        </button>
      </header>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total Documents', value: stats.total, color: 'var(--brand-primary)', icon: <FileText size={20} /> },
          { label: 'Indexed', value: stats.indexed, color: 'var(--success)', icon: <CheckCircle2 size={20} /> },
          { label: 'Processing', value: stats.processing, color: '#fbbf24', icon: <Clock size={20} /> },
          { label: 'Total Chunks', value: stats.totalChunks.toLocaleString(), color: 'var(--brand-accent)', icon: <Database size={20} /> },
        ].map(s => (
          <div key={s.label} className={`glass-panel ${styles.statCard}`}>
            <span className={styles.statIcon} style={{ color: s.color }}>{s.icon}</span>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.body}>
        {/* Left: document list */}
        <div className={styles.listCol}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                id="kb-search"
                className={styles.searchInput}
                placeholder="Search documents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterWrap}>
              <Filter size={14} />
              <select
                id="kb-filter"
                className={styles.filterSelect}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              >
                <option value="all">All Status</option>
                {PIPELINE_STEPS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                <option value="failed">Failed</option>
              </select>
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Doc list */}
          <div className={styles.docList}>
            {filtered.map(doc => (
              <div
                key={doc.id}
                className={`${styles.docRow} ${selectedDoc?.id === doc.id ? styles.docRowActive : ''}`}
                onClick={() => setSelectedDoc(doc)}
              >
                <div className={styles.docType} style={{ background: `${TYPE_COLORS[doc.type]}22`, color: TYPE_COLORS[doc.type] }}>
                  .{doc.type}
                </div>
                <div className={styles.docInfo}>
                  <div className={styles.docName}>{doc.name}</div>
                  <div className={styles.docMeta}>{doc.size} · {doc.uploadedAt}</div>
                </div>
                <StatusBadge status={doc.status} />
                <div className={styles.docActions}>
                  {doc.status === 'failed' && (
                    <button className={styles.actionBtn} title="Retry" onClick={e => { e.stopPropagation(); reprocess(doc.id); }}>
                      <RefreshCw size={14} />
                    </button>
                  )}
                  <button className={styles.actionBtn} title="Delete" onClick={e => { e.stopPropagation(); deleteDoc(doc.id); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className={styles.emptyState}>
                <FileText size={40} opacity={0.2} />
                <p>No documents found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: detail / pipeline */}
        <div className={`glass-panel ${styles.detailCol}`}>
          {selectedDoc ? (
            <div className={styles.docDetail}>
              <div className={styles.detailHeader}>
                <div className={styles.docTypeTag} style={{ background: `${TYPE_COLORS[selectedDoc.type]}22`, color: TYPE_COLORS[selectedDoc.type] }}>
                  .{selectedDoc.type}
                </div>
                <h3 className={styles.detailName}>{selectedDoc.name}</h3>
                <StatusBadge status={selectedDoc.status} />
              </div>

              {/* Pipeline visualization */}
              <div className={styles.pipeline}>
                <h4 className={styles.pipelineTitle}>Processing Pipeline</h4>
                {selectedDoc.status === 'failed' ? (
                  <div className={styles.pipelineFailed}>
                    <XCircle size={20} />
                    <span>Processing failed. Retry to reprocess this document.</span>
                  </div>
                ) : (
                  <div className={styles.pipelineSteps}>
                    {PIPELINE_STEPS.map((step, i) => {
                      const current = stepIndex(selectedDoc.status);
                      const done = i < current || selectedDoc.status === 'indexed';
                      const active = i === current && selectedDoc.status !== 'indexed';
                      return (
                        <div key={step} className={`${styles.pipelineStep} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                          <div className={styles.stepIndicator}>
                            {done ? <CheckCircle2 size={16} /> : STEP_ICONS[step]}
                          </div>
                          {i < PIPELINE_STEPS.length - 1 && (
                            <div className={`${styles.stepLine} ${done ? styles.doneLine : ''}`} />
                          )}
                          <span className={styles.stepLabel}>{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className={styles.metaGrid}>
                {[
                  { label: 'File Size', value: selectedDoc.size },
                  { label: 'Uploaded', value: selectedDoc.uploadedAt },
                  { label: 'Uploaded By', value: selectedDoc.uploadedBy },
                  { label: 'Chunks', value: selectedDoc.chunks > 0 ? selectedDoc.chunks.toLocaleString() : '—' },
                  { label: 'Access Roles', value: selectedDoc.accessRoles.join(', ') },
                ].map(m => (
                  <div key={m.label} className={styles.metaItem}>
                    <span className={styles.metaLabel}>{m.label}</span>
                    <span className={styles.metaValue}>{m.value}</span>
                  </div>
                ))}
              </div>

              <div className={styles.detailActions}>
                {selectedDoc.status === 'failed' && (
                  <button className={styles.retryBtn} onClick={() => reprocess(selectedDoc.id)}>
                    <RefreshCw size={14} /> Retry Processing
                  </button>
                )}
                <button className={styles.deleteBtn} onClick={() => deleteDoc(selectedDoc.id)}>
                  <Trash2 size={14} /> Delete Document
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.selectPrompt}>
              <FileText size={48} opacity={0.15} />
              <p>Select a document to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Documents" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FileUpload onFiles={handleFiles} />
          {uploading && (
            <div className={styles.uploadingBanner}>
              <div className={styles.uploadSpinner} />
              Processing documents through the AI pipeline…
            </div>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Documents will be automatically extracted, chunked, embedded and indexed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
