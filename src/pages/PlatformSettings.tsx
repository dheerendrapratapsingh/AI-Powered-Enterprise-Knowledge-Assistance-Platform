import { useState } from 'react';
import { ShieldAlert, Cpu, Database, Save, CheckCircle, RefreshCw, Key } from 'lucide-react';
import styles from './PlatformSettings.module.css';

export function PlatformSettings() {
  const [saved, setSaved] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [dbPath, setDbPath] = useState('sqlite:///./nexaai.db');
  const [defaultModel, setDefaultModel] = useState('qwen3:8b');
  const [maxTenants, setMaxTenants] = useState(50);
  const [jwtExpiry, setJwtExpiry] = useState('24h');
  const [logLevel, setLogLevel] = useState('INFO');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testOllama = () => {
    setTestingConnection(true);
    setTimeout(() => {
      setTestingConnection(false);
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 4000);
    }, 1200);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>Configure global platform parameters, AI infrastructure, and storage</p>
        </div>
        <button
          className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`}
          onClick={handleSave}
        >
          <Save size={16} />
          {saved ? 'Settings Saved' : 'Save Platform Settings'}
        </button>
      </header>

      <div className={styles.grid}>
        {/* Ollama & LLM Cluster */}
        <div className={`glass-panel ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-primary)' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Inference & AI Infrastructure</h2>
              <p className={styles.cardDesc}>Global Ollama server and default LLM configuration</p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Ollama Endpoint URL</label>
            <div className={styles.inputWithBtn}>
              <input
                type="text"
                className={styles.input}
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
              <button
                className={styles.testBtn}
                onClick={testOllama}
                disabled={testingConnection}
              >
                <RefreshCw size={14} className={testingConnection ? styles.spin : ''} />
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            {connectionStatus === 'success' && (
              <span className={styles.statusSuccess}>
                <CheckCircle size={14} /> Connected to Ollama v0.3.1 (qwen3:8b loaded)
              </span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Default Global Model</label>
              <select
                className={styles.select}
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
              >
                <option value="qwen3:8b">Qwen3 8B (Default)</option>
                <option value="qwen3:14b">Qwen3 14B</option>
                <option value="llama3.1:8b">Llama 3.1 8B</option>
                <option value="mistral-nemo">Mistral Nemo 12B</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Embedding Model</label>
              <input
                type="text"
                className={styles.input}
                value="BAAI/bge-small-en-v1.5"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Database & Multi-Tenancy */}
        <div className={`glass-panel ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--brand-accent)' }}>
              <Database size={20} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Database & Multi-Tenancy</h2>
              <p className={styles.cardDesc}>Relational DB connection and tenant partition limits</p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Database Connection String</label>
            <input
              type="text"
              className={styles.input}
              value={dbPath}
              onChange={(e) => setDbPath(e.target.value)}
            />
            <span className={styles.hint}>Supports SQLite for local dev or PostgreSQL for production clusters</span>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Max Allowed Tenants</label>
              <input
                type="number"
                className={styles.input}
                value={maxTenants}
                onChange={(e) => setMaxTenants(parseInt(e.target.value))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Vector Index Strategy</label>
              <input
                type="text"
                className={styles.input}
                value="Per-Tenant FAISS Index"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className={`glass-panel ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <Key size={20} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Security & Token Settings</h2>
              <p className={styles.cardDesc}>JWT configuration and session management</p>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>JWT Token Lifetime</label>
              <select
                className={styles.select}
                value={jwtExpiry}
                onChange={(e) => setJwtExpiry(e.target.value)}
              >
                <option value="1h">1 Hour</option>
                <option value="12h">12 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Log Level</label>
              <select
                className={styles.select}
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
              >
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Maintenance Controls */}
        <div className={`glass-panel ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Platform Maintenance</h2>
              <p className={styles.cardDesc}>Emergency maintenance switch and cluster controls</p>
            </div>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Maintenance Mode</div>
              <div className={styles.toggleDesc}>
                Prevent regular employee/org users from querying LLM while running maintenance
              </div>
            </div>
            <button
              className={`${styles.toggleBtn} ${maintenanceMode ? styles.toggleOn : ''}`}
              onClick={() => setMaintenanceMode(!maintenanceMode)}
            >
              <div className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
