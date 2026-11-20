import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Globe,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  X,
  Mail,
  Key,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import styles from './PlatformOrgs.module.css';
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  setOrgAdminPassword,
  deleteOrganization,
  type OrganizationItem
} from '../services/platform';

export function PlatformOrgs() {
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);

  // Provisioning Modal
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionName, setProvisionName] = useState('');
  const [provisionDomain, setProvisionDomain] = useState('');
  const [provisionAdminEmail, setProvisionAdminEmail] = useState('');
  const [provisioning, setProvisioning] = useState(false);

  // Edit / RBAC Modal
  const [editingOrg, setEditingOrg] = useState<OrganizationItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editAdminEmails, setEditAdminEmails] = useState<string[]>([]);
  const [newAdminInput, setNewAdminInput] = useState('');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState('');
  const [adminPasswordsMap, setAdminPasswordsMap] = useState<Record<string, string>>({});
  const [activeResetEmail, setActiveResetEmail] = useState<string | null>(null);
  const [inlinePasswordValue, setInlinePasswordValue] = useState('');
  const [savingPasswordFor, setSavingPasswordFor] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete State
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);

  const loadOrgs = async () => {
    try {
      const data = await getOrganizations();
      setOrgs(data || []);
    } catch (err) {
      console.error("Failed to load organizations:", err);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleOpenEdit = (org: OrganizationItem) => {
    setEditingOrg(org);
    setEditName(org.name);
    setEditDomain(org.domain || '');
    setEditStatus(org.status || 'Active');
    setEditAdminEmails(org.admin_emails ? [...org.admin_emails] : []);
    setNewAdminInput('');
    setNewAdminPasswordInput('');
    setAdminPasswordsMap({});
    setActiveResetEmail(null);
    setInlinePasswordValue('');
  };

  const handleAddAdminEmail = () => {
    const email = newAdminInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }
    if (editAdminEmails.includes(email)) {
      alert("This admin email is already assigned");
      return;
    }
    setEditAdminEmails([...editAdminEmails, email]);
    if (newAdminPasswordInput.trim()) {
      setAdminPasswordsMap(prev => ({ ...prev, [email]: newAdminPasswordInput.trim() }));
    }
    setNewAdminInput('');
    setNewAdminPasswordInput('');
  };

  const handleRemoveAdminEmail = (emailToRemove: string) => {
    setEditAdminEmails(editAdminEmails.filter(e => e !== emailToRemove));
    if (activeResetEmail === emailToRemove) {
      setActiveResetEmail(null);
      setInlinePasswordValue('');
    }
  };

  const handleResetInlinePassword = async (email: string) => {
    if (!editingOrg) return;
    if (!inlinePasswordValue || inlinePasswordValue.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    setSavingPasswordFor(email);
    try {
      await setOrgAdminPassword(editingOrg.id, email, inlinePasswordValue);
      alert(`Password successfully updated for ${email}!`);
      setActiveResetEmail(null);
      setInlinePasswordValue('');
    } catch (err: any) {
      alert(err.message || `Failed to update password for ${email}`);
    } finally {
      setSavingPasswordFor(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    setSavingEdit(true);
    try {
      await updateOrganization(editingOrg.id, {
        name: editName.trim(),
        domain: editDomain.trim() || undefined,
        status: editStatus,
        admin_emails: editAdminEmails,
        admin_passwords: Object.keys(adminPasswordsMap).length ? adminPasswordsMap : undefined
      });
      setEditingOrg(null);
      await loadOrgs();
    } catch (err: any) {
      alert(err.message || "Failed to update organization");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionName.trim()) return;

    setProvisioning(true);
    try {
      const adminList = provisionAdminEmail.trim() ? [provisionAdminEmail.trim().toLowerCase()] : [];
      await createOrganization({
        name: provisionName.trim(),
        domain: provisionDomain.trim() || undefined,
        admin_emails: adminList
      });
      setProvisionName('');
      setProvisionDomain('');
      setProvisionAdminEmail('');
      setShowProvisionModal(false);
      await loadOrgs();
    } catch (err: any) {
      alert(err.message || "Failed to provision organization");
    } finally {
      setProvisioning(false);
    }
  };

  const handleDelete = async (org: OrganizationItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${org.name}"? This removes the tenant, its indexed documents, and all member access.`)) {
      return;
    }

    setDeletingOrgId(org.id);
    try {
      await deleteOrganization(org.id);
      await loadOrgs();
    } catch (err: any) {
      alert(err.message || "Failed to delete organization");
    } finally {
      setDeletingOrgId(null);
    }
  };

  const totalAdminsCount = orgs.reduce((acc, o) => acc + (o.admin_emails?.length || 0), 0);
  const mappedDomainsCount = orgs.filter(o => Boolean(o.domain)).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            <Building2 size={26} color="var(--accent-primary, #6366F1)" />
            <span>Tenant Organizations & RBAC Control</span>
          </h1>
          <p className={styles.subtitle}>
            Manage institutional domains, ground truth segregation, and assign designated Org Admins for each tenant
          </p>
        </div>

        <button className={styles.btnPrimary} onClick={() => setShowProvisionModal(true)}>
          <Plus size={16} />
          <span>Provision New Tenant</span>
        </button>
      </header>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
            <Building2 size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{orgs.length}</span>
            <span className={styles.kpiLabel}>Registered Institutions</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE' }}>
            <Globe size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{mappedDomainsCount}</span>
            <span className={styles.kpiLabel}>Enforced Domain Mappings</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
            <ShieldCheck size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{totalAdminsCount}</span>
            <span className={styles.kpiLabel}>Authorized Org Admins (RBAC)</span>
          </div>
        </div>
      </div>

      {/* Organizations Table */}
      <section>
        <h2 className={styles.sectionTitle}>Provisioned Institutional Realms</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tenant Organization</th>
                <th>Identifier Slug</th>
                <th>Domain Mapping</th>
                <th>Assigned Org Admins (RBAC)</th>
                <th>Knowledge Data</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No organizations provisioned yet.
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className={styles.orgNameCol}>
                        <div className={styles.orgIconWrapper}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{org.name}</div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {org.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {org.slug}
                      </span>
                    </td>
                    <td>
                      {org.domain ? (
                        <span className={styles.domainBadge}>
                          <Globe size={11} />
                          <span>{org.domain}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>— No domain locked —</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.adminBadgeList}>
                        {org.admin_emails && org.admin_emails.length > 0 ? (
                          org.admin_emails.map(email => (
                            <span key={email} className={styles.adminBadge}>
                              <Mail size={10} />
                              <span>{email}</span>
                            </span>
                          ))
                        ) : (
                          <span className={styles.noAdminText}>No Org Admin assigned</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '0.84rem', color: '#FFFFFF', fontWeight: 500 }}>
                          {org.document_count ?? 0} documents
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {org.user_count ?? 0} active members
                        </span>
                      </div>
                    </td>
                    <td>
                      {org.status === 'Inactive' ? (
                        <span className={styles.statusInactive}>Inactive</span>
                      ) : (
                        <span className={styles.statusActive}>
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        {/* Modify Org & RBAC */}
                        <button
                          className={styles.rbacBtn}
                          onClick={() => handleOpenEdit(org)}
                          title="Modify Domain Mapping & Admin Emails (RBAC)"
                        >
                          <ShieldCheck size={14} />
                          <span>Modify RBAC</span>
                        </button>

                        {/* Delete Org */}
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(org)}
                          disabled={deletingOrgId === org.id}
                          title="Delete Organization"
                        >
                          {deletingOrgId === org.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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

      {/* MODAL 1: Edit Org & Modify Admin Emails (RBAC) */}
      {editingOrg && (
        <div className={styles.modalOverlay} onClick={() => setEditingOrg(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  <ShieldCheck size={20} color="var(--accent-primary, #6366F1)" />
                  <span>Modify Tenant & Admin Access (RBAC)</span>
                </h3>
                <p className={styles.modalSubtitle}>
                  Configure institutional domain mapping and assign designated Org Admins for {editingOrg.name}.
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setEditingOrg(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Organization Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Domain Mapping (e.g. vitap.ac.in, srm.ac.in)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editDomain}
                  onChange={e => setEditDomain(e.target.value)}
                  placeholder="vitap.ac.in"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tenant Status</label>
                <select
                  className={styles.formInput}
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="Active">Active (Serving Copilot Queries)</option>
                  <option value="Inactive">Inactive (Suspended)</option>
                </select>
              </div>

              {/* RBAC Admin Emails & Password Management */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Designated Org Admins & Password Management (RBAC)
                </label>

                <div style={{ marginBottom: '12px' }}>
                  {editAdminEmails.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '10px', background: 'rgba(10, 15, 30, 0.4)', borderRadius: '8px' }}>
                      No admin emails assigned yet. Add an administrator below.
                    </div>
                  ) : (
                    editAdminEmails.map(email => (
                      <div key={email} className={styles.adminItemCard}>
                        <div className={styles.adminItemTop}>
                          <div className={styles.adminEmailText}>
                            <Mail size={13} color="var(--accent-primary, #6366F1)" />
                            <span>{email}</span>
                          </div>

                          <div className={styles.adminActionPills}>
                            {/* Key / Password Button */}
                            <button
                              type="button"
                              className={styles.keyBtn}
                              onClick={() => {
                                if (activeResetEmail === email) {
                                  setActiveResetEmail(null);
                                  setInlinePasswordValue('');
                                } else {
                                  setActiveResetEmail(email);
                                  setInlinePasswordValue('');
                                }
                              }}
                              title="Set / Reset password for this admin"
                            >
                              <Key size={11} />
                              <span>{activeResetEmail === email ? "Cancel" : "Set Password"}</span>
                              {activeResetEmail === email ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>

                            {/* Remove Admin */}
                            <button
                              type="button"
                              className={styles.chipRemoveBtn}
                              onClick={() => handleRemoveAdminEmail(email)}
                              title="Revoke Org Admin role"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Inline Password Setter */}
                        {activeResetEmail === email && (
                          <div className={styles.resetPassRow}>
                            <Lock size={12} color="#FBBF24" />
                            <input
                              type="password"
                              className={styles.passInput}
                              placeholder="New password (min 6 chars)..."
                              value={inlinePasswordValue}
                              onChange={e => setInlinePasswordValue(e.target.value)}
                            />
                            <button
                              type="button"
                              className={styles.btnSavePass}
                              disabled={savingPasswordFor === email || !inlinePasswordValue || inlinePasswordValue.length < 6}
                              onClick={() => handleResetInlinePassword(email)}
                            >
                              {savingPasswordFor === email ? <Loader2 size={12} className="animate-spin" /> : "Save Password"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Admin Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: 8 }}>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={newAdminInput}
                      onChange={e => setNewAdminInput(e.target.value)}
                      placeholder="e.g. dean@srm.ac.in"
                    />
                    <input
                      type="password"
                      className={styles.formInput}
                      value={newAdminPasswordInput}
                      onChange={e => setNewAdminPasswordInput(e.target.value)}
                      placeholder="Password (default: org123)"
                    />
                    <button
                      type="button"
                      className={styles.btnAddChip}
                      onClick={handleAddAdminEmail}
                      disabled={!newAdminInput.trim()}
                    >
                      + Assign Admin
                    </button>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Type the administrator's email and their password (or leave empty for default <code>org123</code>).
                  </span>
                </div>

                <div className={styles.rbacHelpBox}>
                  🔒 <strong>RBAC Policy:</strong> Users assigned here receive the <code>ORG_ADMIN</code> role. They can log in to <code>/org</code> and <code>/org/knowledge</code> to manage this organization's documents, web crawlers, and AI index.
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setEditingOrg(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={savingEdit}
                >
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{savingEdit ? "Saving Changes..." : "Save RBAC Configuration"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Provision New Tenant */}
      {showProvisionModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProvisionModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  <Building2 size={20} color="var(--accent-primary, #6366F1)" />
                  <span>Provision New Tenant Organization</span>
                </h3>
                <p className={styles.modalSubtitle}>Create a new segregated campus or university knowledge realm.</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowProvisionModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvision}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Organization Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={provisionName}
                  onChange={e => setProvisionName(e.target.value)}
                  placeholder="e.g. SRM University AP"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Domain Mapping (Optional)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={provisionDomain}
                  onChange={e => setProvisionDomain(e.target.value)}
                  placeholder="e.g. srm.ac.in"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Initial Org Admin Email (RBAC)</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={provisionAdminEmail}
                  onChange={e => setProvisionAdminEmail(e.target.value)}
                  placeholder="e.g. org@srm.ac.in"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowProvisionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={provisioning || !provisionName.trim()}
                >
                  {provisioning ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>{provisioning ? "Provisioning..." : "Create Tenant"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
