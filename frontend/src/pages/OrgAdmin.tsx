import { useState, useEffect, useRef } from 'react';
import { Database, Users, CheckCircle2, FileText, Trash2, Loader2, UploadCloud } from 'lucide-react';
import styles from './PlatformAdmin.module.css';
import { getDocuments, uploadDocument, deleteDocument } from '../services/admin';

export function OrgAdmin() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(() => {
      fetchDocs();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    
    setUploading(true);
    try {
      await uploadDocument(formData);
      await fetchDocs();
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      await fetchDocs();
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Organization Dashboard</h1>
          <p className={styles.subtitle}>Manage your organization's AI assistant</p>
        </div>
        <div className={styles.headerActions}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            accept=".pdf,.txt,.docx"
          />
          <button className={styles.primaryButton} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={16} className="animate-spin" style={{marginRight: 8}}/> : <UploadCloud size={16} style={{marginRight: 8}}/>}
            {uploading ? "Uploading..." : "Add Knowledge"}
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.kpiGrid}>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--brand-primary)'}}>
                <Database size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{documents.length}</span>
                <span className={styles.kpiLabel}>Documents Indexed</span>
              </div>
            </div>
          </div>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--brand-accent)'}}>
                <Users size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>2</span>
                <span className={styles.kpiLabel}>Active Users</span>
              </div>
            </div>
          </div>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--success)'}}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>100%</span>
                <span className={styles.kpiLabel}>System Uptime</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', marginTop: '2rem' }}>
          <div>
            <h2 className={styles.sectionTitle}>Knowledge Base</h2>
            <div className={`glass-panel ${styles.tableContainer}`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Filename</th>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Chunks</th>
                    <th style={{ textAlign: 'right', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No documents uploaded yet.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} color="var(--brand-primary)" />
                            {doc.filename}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem',
                            background: doc.status === 'READY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: doc.status === 'READY' ? 'var(--success)' : 'var(--brand-accent)'
                          }}>
                            {doc.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>{doc.chunk_count} chunks</td>
                        <td style={{ textAlign: 'right', padding: '1rem' }}>
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              color: 'var(--error)', 
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '4px'
                            }}
                            title="Delete Document"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
