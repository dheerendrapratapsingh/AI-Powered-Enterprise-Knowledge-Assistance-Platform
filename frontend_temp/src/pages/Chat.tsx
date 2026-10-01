import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from '../components/chat/MessageBubble';
import { sendMessage } from '../services/chat';

export default function Chat({ initialQuestion, onBack }: { initialQuestion?: string, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(text, conversationId || undefined);
      if (response.conversation_id && !conversationId) {
        setConversationId(response.conversation_id);
      }
      
      const aiMsg = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg = { role: 'assistant', content: `Error: ${err.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} style={{ marginRight: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#4a5568' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem' }}>VIT-AP Copilot</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {messages.map((m, idx) => (
          <MessageBubble key={idx} message={m} />
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#718096' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend(input);
            }}
            placeholder="Ask a question..."
            style={{ flex: 1, padding: '1rem', fontSize: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            style={{ padding: '0 2rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.6 : 1 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
