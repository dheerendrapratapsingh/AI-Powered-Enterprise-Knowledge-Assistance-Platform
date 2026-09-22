import { useState } from 'react';
import { Building2, Users, MoreHorizontal, Plus, Search, Settings, ChevronRight, Globe, Activity } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge, type OrgStatus } from '../components/StatusBadge';
import styles from './PlatformOrgs.module.css';

interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string;
  users: number;
  documents: number;
  queries: number;
  status: OrgStatus;
  plan: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
}

const MOCK_ORGS: Organization[] = [
  { id: 'o1', name: 'Acme Corp', slug: 'acme-corp', industry: 'Technology', users: 248, documents: 1240, queries: 4280, status: 'active', plan: 'enterprise', createdAt: '2026-01-12' },
  { id: 'o2', name: 'TechNova', slug: 'technova', industry: 'Software', users: 87, documents: 430, queries: 1820, status: 'active', plan: 'professional', createdAt: '2026-02-05' },
  { id: 'o3', name: 'FinEdge', slug: 'finedge', industry: 'Finance', users: 203, documents: 980, queries: 3640, status: 'active', plan: 'enterprise', createdAt: '2026-03-01' },
  { id: 'o4', name: 'HealthSync', slug: 'healthsync', industry: 'Healthcare', users: 45, documents: 190, queries: 310, status: 'onboarding', plan: 'starter', createdAt: '2026-08-22' },
  { id: 'o5', name: 'RetailX', slug: 'retailx', industry: 'Retail', users: 0, documents: 0, queries: 0, status: 'suspended', plan: 'professional', createdAt: '2026-05-17' },
];

const PLAN_COLORS: Record<string, string> = {
  starter: '#38bdf8',
  professional: '#a78bfa',
  enterprise: '#6366f1',
};

const INDUSTRIES = ['Technology', 'Software', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Other'];

export function PlatformOrgs() {
  const [orgs, setOrgs] = useState<Organization[]>(MOCK_ORGS);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', industry: 'Technology', plan: 'professional' });
  const [formError, setFormError] = useState('');

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.industry.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!form.name.trim()) { setFormError('Organization name is required.'); return; }
    if (!form.slug.trim()) { setFormError('Slug is required.'); return; }
    const exists = orgs.some(o => o.slug === form.slug);
    if (exists) { setFormError('Slug already exists.'); return; }
    const newOrg: Organization = {
      id: `o${Date.now()}`,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      industry: form.industry,
      users: 0,
      documents: 0,
      queries: 0,
      status: 'onboarding',
      plan: form.plan as Organization['plan'],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setOrgs(prev => [newOrg, ...prev]);
    setShowCreate(false);
    setForm({ name: '', slug: '', industry: 'Technology', plan: 'professional' });
    setFormError('');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Organizations</h1>
          <p className={styles.subtitle}>{orgs.length} organizations on the platform</p>
        </div>
        <button className={styles.primaryBtn} id="create-org-btn" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Organization
        </button>
      </header>

      {/* Stats strip */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total Orgs', value: orgs.length, icon: <Building2 size={18} />, color: 'var(--brand-primary)' },
          { label: 'Active', value: orgs.filter(o => o.status === 'active').length, icon: <Activity size={18} />, color: 'var(--success)' },
          { label: 'Total Users', value: orgs.reduce((a, o) => a + o.users, 0).toLocaleString(), icon: <Users size={18} />, color: 'var(--brand-accent)' },
          { label: 'Total Queries', value: orgs.reduce((a, o) => a + o.queries, 0).toLocaleString(), icon: <Globe size={18} />, color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="glass-panel">
            <div className={styles.statCard}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <div>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          id="org-search"
          className={styles.searchInput}
          placeholder="Search organizations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={`glass-panel ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Industry</th>
              <th>Plan</th>
              <th>Users</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(org => (
              <tr key={org.id}>
                <td>
                  <div className={styles.orgCell}>
                    <div className={styles.orgAvatar}>{org.name[0]}</div>
                    <div>
                      <div className={styles.orgName}>{org.name}</div>
                      <div className={styles.orgSlug}>{org.slug}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.muted}>{org.industry}</td>
                <td>
                  <span className={styles.planBadge} style={{ color: PLAN_COLORS[org.plan], borderColor: `${PLAN_COLORS[org.plan]}33`, background: `${PLAN_COLORS[org.plan]}11` }}>
                    {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                  </span>
                </td>
                <td>{org.users}</td>
                <td>{org.documents.toLocaleString()}</td>
                <td><StatusBadge status={org.status} /></td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} title="Settings"><Settings size={16} /></button>
                    <button className={styles.iconBtn} title="View"><ChevronRight size={16} /></button>
                    <button className={styles.iconBtn} title="More"><MoreHorizontal size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.emptyRow}>No organizations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setFormError(''); }} title="Create New Organization">
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-org-name">Organization Name *</label>
            <input id="new-org-name" className={styles.input} placeholder="e.g. Acme Corp"
              value={form.name}
              onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));
              }}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-org-slug">Slug *</label>
            <input id="new-org-slug" className={styles.input} placeholder="acme-corp"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-org-industry">Industry</label>
            <select id="new-org-industry" className={styles.input}
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-org-plan">Plan</label>
            <select id="new-org-plan" className={styles.input}
              value={form.plan}
              onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          {formError && <div className={styles.error}>{formError}</div>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowCreate(false); setFormError(''); }}>Cancel</button>
            <button id="create-org-submit" className={styles.primaryBtn} onClick={handleCreate}>Create Organization</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
