import { Building2, Users, Activity, ChevronRight, Settings } from 'lucide-react';
import styles from './PlatformAdmin.module.css';

export function PlatformAdmin() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Overview</h1>
          <p className={styles.subtitle}>Manage your enterprise AI ecosystem</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton}>
            + New Organization
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.kpiGrid}>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--brand-primary)'}}>
                <Building2 size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>24</span>
                <span className={styles.kpiLabel}>Organizations</span>
              </div>
            </div>
          </div>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--success)'}}>
                <Activity size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>18</span>
                <span className={styles.kpiLabel}>Active Now</span>
              </div>
            </div>
          </div>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--brand-accent)'}}>
                <Users size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>12.4K</span>
                <span className={styles.kpiLabel}>Total Queries</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Organizations</h2>
        <div className={`glass-panel ${styles.tableContainer}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Users</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Acme Corp', users: 124, status: 'Active' },
                { name: 'TechNova', users: 87, status: 'Active' },
                { name: 'FinEdge', users: 203, status: 'Active' },
                { name: 'HealthSync', users: 45, status: 'Onboarding' }
              ].map((org) => (
                <tr key={org.name}>
                  <td>
                    <div className={styles.orgNameCell}>
                      <div className={styles.orgAvatar}>{org.name.substring(0, 1)}</div>
                      <span className={styles.orgName}>{org.name}</span>
                    </div>
                  </td>
                  <td>{org.users}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${org.status === 'Active' ? styles.statusActive : styles.statusPending}`}>
                      {org.status}
                    </span>
                  </td>
                  <td>
                    <button className={styles.iconButton}>
                      <Settings size={18} />
                    </button>
                    <button className={styles.iconButton}>
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
