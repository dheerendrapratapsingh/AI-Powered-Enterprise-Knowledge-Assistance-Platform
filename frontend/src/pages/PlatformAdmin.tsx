import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Globe, 
  X,
  Trash2
} from 'lucide-react';
import styles from './PlatformAdmin.module.css';
import { 
  getPlatformStats, 
  getOrganizations, 
  createOrganization, 
  deleteOrganization,
  type PlatformStats, 
  type OrganizationItem 
} from '../services/platform';

export function PlatformAdmin() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
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

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to permanently delete tenant "${orgName}"? This will remove the institutional platform, its indexed documents, and all member associations.`)) {
      return;
    }

    setDeletingOrgId(orgId);
    try {
      await deleteOrganization(orgId);
      await loadData();
    } catch (err: any) {
      alert(err.message || `Failed to delete organization "${orgName}"`);
    } finally {
      setDeletingOrgId(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Administration</h1>
          <p className={styles.subtitle}>Ecosystem health, multi-tenant organizations, and global telemetry</p>
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Provision Tenant</span>
        </button>
      </header>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`glass-card ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper} style={{ background: 'rgba(85, 119, 255, 0.15)', color: 'var(--accent-primary)' }}>
            <Building2 size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{stats?.total_organizations ?? 1}</span>
            <span className={styles.kpiLabel}>Tenant Organizations</span>
          </div>
        </div>

        <div className={`glass-card ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper} style={{ background: 'rgba(54, 214, 245, 0.15)', color: 'var(--accent-cyan)' }}>
            <Users size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{stats?.total_users ?? 0}</span>
            <span className={styles.kpiLabel}>Registered Members</span>
          </div>
        </div>

        <div className={`glass-card ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper} style={{ background: 'rgba(152, 117, 255, 0.15)', color: 'var(--accent-violet)' }}>
            <Activity size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{stats?.total_queries ?? 0}</span>
            <span className={styles.kpiLabel}>Queries Processed</span>
          </div>
        </div>

        <div className={`glass-card ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{stats?.system_uptime ?? "99.9%"}</span>
            <span className={styles.kpiLabel}>System Availability</span>
          </div>
        </div>
      </div>

      {/* Organizations Table */}
      <section>
        <h2 className={styles.sectionTitle}>Active Institutional Tenants</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Identifier Slug</th>
                <th>Domain Mapping</th>
                <th>Documents</th>
                <th>Active Users</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No organizations provisioned yet.
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Building2 size={16} color="var(--accent-primary)" />
                        <span style={{ fontWeight: 600 }}>{org.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {org.slug}
                      </span>
                    </td>
                    <td>
                      {org.domain ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)' }}>
                          <Globe size={13} />
                          <span style={{ fontSize: '0.84rem' }}>{org.domain}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {org.document_count ?? 0} docs
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {org.user_count ?? 0} users
                      </span>
                    </td>
                    <td>
                      <span className={styles.statusActive}>
                        <CheckCircle2 size={12} /> {org.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteOrg(org.id, org.name)}
                          disabled={deletingOrgId === org.id}
                          title={`Delete ${org.name} Tenant`}
                        >
                          {deletingOrgId === org.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          <span>{deletingOrgId === org.id ? "Deleting..." : "Delete"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Provision Organization Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 className={styles.modalTitle}>Provision New Tenant</h3>
                <p className={styles.modalSubtitle}>Create a segregated campus or organizational knowledge realm.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrg}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Organization Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. VIT-AP University"
                  className={styles.formInput}
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Institutional Email Domain (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. vitap.ac.in"
                  className={styles.formInput}
                  value={newOrgDomain}
                  onChange={e => setNewOrgDomain(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={creating || !newOrgName.trim()}
                >
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  <span>{creating ? "Provisioning..." : "Create Tenant"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
