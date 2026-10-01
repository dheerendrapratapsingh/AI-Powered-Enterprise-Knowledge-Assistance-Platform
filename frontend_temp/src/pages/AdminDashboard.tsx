import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../services/admin';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 5000); // Polling for processing status
    return () => clearInterval(interval);
  }, []);

  const fetchDocs = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);
    
    try {
      await uploadDocument(formData);
      setFile(null);
      setName('');
      setCategory('');
      fetchDocs();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      fetchDocs();
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#2d3748', margin: 0 }}>Knowledge Administration</h1>
        <button onClick={onLogout} style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Logout</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', alignSelf: 'start' }}>
          <h3 style={{ marginTop: 0, color: '#2d3748' }}>Upload Document</h3>
          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#4a5568' }}>Document Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#4a5568' }}>Category (e.g. Academic, Hostel)</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#4a5568' }}>File (PDF, TXT, MD)</label>
              <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required accept=".pdf,.txt,.md" style={{ width: '100%' }} />
            </div>
            <button type="submit" disabled={uploading || !file} style={{ width: '100%', padding: '0.75rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}>
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </form>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#2d3748' }}>Document Processing Status</h3>
          {loading ? <p style={{ color: '#718096' }}>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', color: '#4a5568' }}>Name</th>
                  <th style={{ padding: '0.75rem', color: '#4a5568' }}>Category</th>
                  <th style={{ padding: '0.75rem', color: '#4a5568' }}>Status</th>
                  <th style={{ padding: '0.75rem', color: '#4a5568' }}>Chunks</th>
                  <th style={{ padding: '0.75rem', color: '#4a5568' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: any) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '1rem 0.75rem', color: '#2d3748', fontWeight: 500 }}>{doc.name}</td>
                    <td style={{ padding: '1rem 0.75rem', color: '#718096' }}>{doc.category || '-'}</td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: doc.status === 'READY' ? '#c6f6d5' : doc.status === 'FAILED' ? '#fed7d7' : '#feebc8',
                        color: doc.status === 'READY' ? '#22543d' : doc.status === 'FAILED' ? '#822727' : '#7b341e'
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#718096' }}>{doc.chunk_count}</td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <button 
                        onClick={() => handleDelete(doc.id)} 
                        style={{ padding: '0.4rem 0.8rem', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#a0aec0' }}>No documents uploaded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
