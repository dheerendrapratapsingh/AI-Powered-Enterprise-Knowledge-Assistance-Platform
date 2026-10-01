import React from 'react';

export default function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
      <div style={{ 
        maxWidth: '75%', 
        padding: '1.25rem', 
        borderRadius: '12px',
        background: isUser ? '#3182ce' : '#ffffff',
        color: isUser ? 'white' : '#2d3748',
        boxShadow: isUser ? 'none' : '0 4px 6px rgba(0,0,0,0.05)',
        border: isUser ? 'none' : '1px solid #e2e8f0'
      }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{message.content}</div>
        
        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#718096', marginBottom: '0.5rem' }}>Sources:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {message.sources.map((src: any, idx: number) => (
                <div key={idx} style={{ fontSize: '0.8rem', background: '#edf2f7', color: '#4a5568', padding: '0.4rem 0.8rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.4rem' }}>📄</span> 
                  {src.document_name} {src.page ? `(Page ${src.page})` : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
