import { useState, useEffect } from 'react';
import { Building2, Users, Activity, FileText, Plus, Loader2 } from 'lucide-react';
import styles from './PlatformAdmin.module.css';
import { 
  getPlatformStats, 
  getOrganizations, 
  createOrganization, 
  type PlatformStats, 
  type OrganizationItem 
} from '../services/platform';

export function PlatformAdmin() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');

  const loadData = async () => {
    try {
      const [statsData, orgsData] = await Promise.all([
        getPlatformStats(),
        getOrganizations()
      ]);
      setStats(statsData);
      setOrgs(orgsData);
    } catch (err) {
      console.error("Failed to load platform data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreating(true);
    try {
      await createOrganization({
        name: newOrgName.trim(),
        domain: newOrgDomain.trim() || undefined
      });
      setNewOrgName('');
      setNewOrgDomain('');
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Overview</h1>
          <p className={styles.subtitle}>Manage your enterprise AI ecosystem across all tenants</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>
            <Plus size={16} style={{ marginRight: 6 }} /> New Organization
          </button>
        </div>
      </header>

      {/* Modal for creating a new Organization */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-panel" style={{
            background: '#131b2e',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: '24px 28px',
            width: 420,
            maxWidth: '90%'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Add New Organization</h2>
            <form onSubmit={handleCreateOrg}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-muted)' }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford Medical or TechCorp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-muted)' }}>
                  Corporate Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. techcorp.com"
                  value={newOrgDomain}
                  onChange={(e) => setNewOrgDomain(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newOrgName.trim()}
                  className={styles.primaryButton}
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.kpiGrid}>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--brand-primary)'}}>
                <Building2 size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>
                  {loading ? '...' : (stats?.total_organizations ?? 1)}
                </span>
                <span className={styles.kpiLabel}>Active Organizations</span>
              </div>
            </div>
          </div>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--success)'}}>
                <Activity size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>
                  {loading ? '...' : (stats?.total_queries ?? 0)}
                </span>
                <span className={styles.kpiLabel}>AI Queries Served</span>
              </div>
            </div>
          </div>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: 'var(--brand-accent)'}}>
                <Users size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>
                  {loading ? '...' : (stats?.total_users ?? 0)}
                </span>
                <span className={styles.kpiLabel}>Total Users</span>
              </div>
            </div>
          </div>
          <div className="glass-panel">
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{color: '#38bdf8'}}>
                <FileText size={24} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>
                  {loading ? '...' : (stats?.total_documents ?? 0)}
                </span>
                <span className={styles.kpiLabel}>Indexed Documents</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Registered Tenants & Organizations</h2>
        <div className={`glass-panel ${styles.tableContainer}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Domain</th>
                <th>Users</th>
                <th>Knowledge Docs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {loading ? "Loading organizations..." : "No organizations registered yet."}
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className={styles.orgNameCell}>
                        <div className={styles.orgAvatar}>{org.name.substring(0, 1)}</div>
                        <span className={styles.orgName}>{org.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {org.domain || 'N/A'}
                    </td>
                    <td>{org.user_count}</td>
                    <td>{org.document_count}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${org.status === 'Active' ? styles.statusActive : styles.statusPending}`}>
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
