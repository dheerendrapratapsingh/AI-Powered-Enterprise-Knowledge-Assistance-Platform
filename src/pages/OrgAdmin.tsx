import { Database, Users, CheckCircle2 } from 'lucide-react';
import styles from './PlatformAdmin.module.css'; // Reusing similar styles for grid/cards

export function OrgAdmin() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Acme Corp Dashboard</h1>
          <p className={styles.subtitle}>Manage your organization's AI assistant</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton}>
            + Add Knowledge
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
                <span className={styles.kpiValue}>12,482</span>
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
                <span className={styles.kpiValue}>248</span>
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
                <span className={styles.kpiValue}>91%</span>
                <span className={styles.kpiLabel}>Answer Accuracy</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <h2 className={styles.sectionTitle}>Most Asked Questions</h2>
            <div className={`glass-panel ${styles.tableContainer}`}>
              <table className={styles.table}>
                <tbody>
                  <tr>
                    <td>1. How do I apply for leave?</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>423</td>
                  </tr>
                  <tr>
                    <td>2. How do I deploy a project?</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>217</td>
                  </tr>
                  <tr>
                    <td>3. Who handles backend deployment?</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>182</td>
                  </tr>
                  <tr>
                    <td>4. How do I access VPN?</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>161</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className={styles.sectionTitle}>Knowledge Health</h2>
            <div className={`glass-panel`} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500 }}>Documents Indexed</span>
                  <span style={{ color: 'var(--text-muted)' }}>92%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', backgroundColor: 'var(--success)' }}></div>
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500 }}>Processing Queue</span>
                  <span style={{ color: 'var(--text-muted)' }}>4%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '4%', height: '100%', backgroundColor: 'var(--brand-accent)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500 }}>Failed Uploads</span>
                  <span style={{ color: 'var(--text-muted)' }}>4%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '4%', height: '100%', backgroundColor: 'var(--error)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
