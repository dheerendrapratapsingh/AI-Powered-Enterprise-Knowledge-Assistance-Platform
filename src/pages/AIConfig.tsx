import { useState } from 'react';
import { Cpu, Sliders, Globe, MessageSquare, Save, RotateCcw } from 'lucide-react';
import styles from './AIConfig.module.css';

interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  language: string;
  citationMode: 'always' | 'when_available' | 'never';
  workflowDetection: boolean;
  relatedQuestions: boolean;
  strictGrounding: boolean;
  topK: number;
  chunkSize: number;
}

const DEFAULTS: AISettings = {
  model: 'qwen3:8b',
  temperature: 0.3,
  maxTokens: 1024,
  language: 'English',
  citationMode: 'always',
  workflowDetection: true,
  relatedQuestions: true,
  strictGrounding: true,
  topK: 5,
  chunkSize: 500,
};

export function AIConfig() {
  const [settings, setSettings] = useState<AISettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => setSettings(DEFAULTS);

  const update = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
    setSaved(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Configuration</h1>
          <p className={styles.subtitle}>Configure how the AI assistant behaves for your organization</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.resetBtn} onClick={reset}><RotateCcw size={15} /> Reset Defaults</button>
          <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`} onClick={save}>
            <Save size={15} /> {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className={styles.sections}>
        {/* Model */}
        <div className={`glass-panel ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ color: 'var(--brand-primary)', background: 'rgba(99,102,241,0.1)' }}><Cpu size={18} /></div>
            <div>
              <h2 className={styles.sectionTitle}>Language Model</h2>
              <p className={styles.sectionDesc}>The AI model powering your knowledge assistant</p>
            </div>
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ai-model">Model</label>
              <select id="ai-model" className={styles.select} value={settings.model} onChange={e => update('model', e.target.value)}>
                <option value="qwen3:8b">Qwen3 8B (Recommended)</option>
                <option value="qwen3:14b">Qwen3 14B (Higher accuracy)</option>
                <option value="llama3.1:8b">Llama 3.1 8B</option>
              </select>
              <span className={styles.hint}>Running locally via Ollama. Ensure the model is pulled.</span>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ai-temp">Temperature: <strong>{settings.temperature}</strong></label>
                <input id="ai-temp" type="range" min="0" max="1" step="0.05"
                  className={styles.slider}
                  value={settings.temperature}
                  onChange={e => update('temperature', parseFloat(e.target.value))}
                />
                <div className={styles.sliderHints}><span>Precise</span><span>Creative</span></div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ai-tokens">Max Response Tokens: <strong>{settings.maxTokens}</strong></label>
                <input id="ai-tokens" type="range" min="256" max="4096" step="128"
                  className={styles.slider}
                  value={settings.maxTokens}
                  onChange={e => update('maxTokens', parseInt(e.target.value))}
                />
                <div className={styles.sliderHints}><span>256</span><span>4096</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Retrieval */}
        <div className={`glass-panel ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ color: 'var(--brand-accent)', background: 'rgba(14,165,233,0.1)' }}><Sliders size={18} /></div>
            <div>
              <h2 className={styles.sectionTitle}>Retrieval Settings</h2>
              <p className={styles.sectionDesc}>Control how documents are retrieved for answering queries</p>
            </div>
          </div>
          <div className={styles.fields}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ai-topk">Top-K Chunks: <strong>{settings.topK}</strong></label>
                <input id="ai-topk" type="range" min="1" max="15" step="1"
                  className={styles.slider}
                  value={settings.topK}
                  onChange={e => update('topK', parseInt(e.target.value))}
                />
                <span className={styles.hint}>Number of document chunks retrieved per query</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ai-chunk">Chunk Size: <strong>{settings.chunkSize} tokens</strong></label>
                <input id="ai-chunk" type="range" min="200" max="1000" step="50"
                  className={styles.slider}
                  value={settings.chunkSize}
                  onChange={e => update('chunkSize', parseInt(e.target.value))}
                />
                <span className={styles.hint}>Applies to newly uploaded documents</span>
              </div>
            </div>
            <div className={styles.toggle}>
              <div>
                <div className={styles.toggleLabel}>Strict Grounding</div>
                <div className={styles.toggleDesc}>Refuse to answer if no relevant context found in documents</div>
              </div>
              <button id="strict-grounding-toggle" className={`${styles.toggleBtn} ${settings.strictGrounding ? styles.toggleOn : ''}`}
                onClick={() => update('strictGrounding', !settings.strictGrounding)}>
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>
        </div>

        {/* Response */}
        <div className={`glass-panel ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.1)' }}><MessageSquare size={18} /></div>
            <div>
              <h2 className={styles.sectionTitle}>Response Behavior</h2>
              <p className={styles.sectionDesc}>Customize what the AI includes in responses</p>
            </div>
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="citation-mode">Citation Mode</label>
              <select id="citation-mode" className={styles.select} value={settings.citationMode} onChange={e => update('citationMode', e.target.value as AISettings['citationMode'])}>
                <option value="always">Always show citations</option>
                <option value="when_available">Show when available</option>
                <option value="never">Never show citations</option>
              </select>
            </div>
            {[
              { key: 'workflowDetection' as const, label: 'Workflow Detection', desc: 'Detect process-oriented questions and respond with step-by-step workflows' },
              { key: 'relatedQuestions' as const, label: 'Related Questions', desc: 'Suggest follow-up questions after each response' },
            ].map(opt => (
              <div key={opt.key} className={styles.toggle}>
                <div>
                  <div className={styles.toggleLabel}>{opt.label}</div>
                  <div className={styles.toggleDesc}>{opt.desc}</div>
                </div>
                <button className={`${styles.toggleBtn} ${settings[opt.key] ? styles.toggleOn : ''}`}
                  onClick={() => update(opt.key, !settings[opt.key])}>
                  <div className={styles.toggleThumb} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className={`glass-panel ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)' }}><Globe size={18} /></div>
            <div>
              <h2 className={styles.sectionTitle}>Language & Locale</h2>
              <p className={styles.sectionDesc}>AI response language settings</p>
            </div>
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ai-lang">Response Language</label>
              <select id="ai-lang" className={styles.select} value={settings.language} onChange={e => update('language', e.target.value)}>
                {['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese'].map(l => <option key={l}>{l}</option>)}
              </select>
              <span className={styles.hint}>AI will respond in this language regardless of the query language</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
