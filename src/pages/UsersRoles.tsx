import { useState } from 'react';
import { Users, Plus, Search, Shield, UserCheck, Mail, MoreHorizontal, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge, type UserStatus } from '../components/StatusBadge';
import styles from './UsersRoles.module.css';

type UserRole = 'org_admin' | 'engineer' | 'employee' | 'hr';

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  joinedAt: string;
  lastActive: string;
}

const MOCK_USERS: OrgUser[] = [
  { id: 'u1', name: 'Himanvi Reddy', email: 'himanvi@acmecorp.com', role: 'org_admin', department: 'Engineering', status: 'active', joinedAt: '2026-01-10', lastActive: 'Today' },
  { id: 'u2', name: 'Dheerendra Singh', email: 'dheerendra@acmecorp.com', role: 'engineer', department: 'Engineering', status: 'active', joinedAt: '2026-01-15', lastActive: 'Today' },
  { id: 'u3', name: 'Narasimha Rao', email: 'narasimha@acmecorp.com', role: 'engineer', department: 'AI/ML', status: 'active', joinedAt: '2026-02-01', lastActive: '2 hours ago' },
  { id: 'u4', name: 'Ananya Sharma', email: 'ananya@acmecorp.com', role: 'hr', department: 'Human Resources', status: 'active', joinedAt: '2026-03-15', lastActive: '1 day ago' },
  { id: 'u5', name: 'Ravi Kumar', email: 'ravi@acmecorp.com', role: 'employee', department: 'Product', status: 'active', joinedAt: '2026-04-01', lastActive: '3 days ago' },
  { id: 'u6', name: 'Priya Nair', email: 'priya@acmecorp.com', role: 'employee', department: 'Design', status: 'invited', joinedAt: '2026-09-20', lastActive: 'Never' },
  { id: 'u7', name: 'Sanjay Mehta', email: 'sanjay@acmecorp.com', role: 'employee', department: 'Finance', status: 'inactive', joinedAt: '2026-05-10', lastActive: '45 days ago' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  org_admin: 'Org Admin',
  engineer: 'Engineer',
  employee: 'Employee',
  hr: 'HR',
};

const ROLE_COLORS: Record<UserRole, string> = {
  org_admin: '#a78bfa',
  engineer: '#60a5fa',
  employee: '#a3a3a3',
  hr: '#f9a8d4',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  org_admin: 'Full access: manage knowledge, users, and AI config.',
  engineer: 'Access to technical documents and deployment workflows.',
  employee: 'Standard access to general organization knowledge.',
  hr: 'Access to HR policies, employee handbooks, and people data.',
};

export function UsersRoles() {
  const [users, setUsers] = useState<OrgUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [form, setForm] = useState({ email: '', role: 'employee', department: '' });
  const [formError, setFormError] = useState('');

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleInvite = () => {
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!form.email.includes('@')) { setFormError('Enter a valid email.'); return; }
    const exists = users.some(u => u.email === form.email);
    if (exists) { setFormError('User already exists.'); return; }
    const newUser: OrgUser = {
      id: `u${Date.now()}`,
      name: form.email.split('@')[0],
      email: form.email,
      role: form.role as UserRole,
      department: form.department || 'Unassigned',
      status: 'invited',
      joinedAt: new Date().toISOString().slice(0, 10),
      lastActive: 'Never',
    };
    setUsers(prev => [newUser, ...prev]);
    setShowInvite(false);
    setForm({ email: '', role: 'employee', department: '' });
    setFormError('');
  };

  const removeUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const roleStats = Object.entries(ROLE_LABELS).map(([role, label]) => ({
    role: role as UserRole,
    label,
    count: users.filter(u => u.role === (role as UserRole)).length,
    color: ROLE_COLORS[role as UserRole],
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Users & Roles</h1>
          <p className={styles.subtitle}>{users.filter(u => u.status === 'active').length} active members in your organization</p>
        </div>
        <button id="invite-user-btn" className={styles.primaryBtn} onClick={() => setShowInvite(true)}>
          <Plus size={16} /> Invite User
        </button>
      </header>

      {/* Role summary cards */}
      <div className={styles.roleCards}>
        {roleStats.map(r => (
          <div key={r.role} className={`glass-panel ${styles.roleCard}`} onClick={() => setFilterRole(filterRole === r.role ? 'all' : r.role)} style={{ cursor: 'pointer', borderColor: filterRole === r.role ? `${r.color}44` : undefined, background: filterRole === r.role ? `${r.color}08` : undefined }}>
            <div className={styles.roleCardIcon} style={{ color: r.color, background: `${r.color}15` }}>
              <Shield size={18} />
            </div>
            <div className={styles.roleCardCount} style={{ color: r.color }}>{r.count}</div>
            <div className={styles.roleCardLabel}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={15} /> Members
        </button>
        <button className={`${styles.tab} ${activeTab === 'roles' ? styles.tabActive : ''}`} onClick={() => setActiveTab('roles')}>
          <Shield size={15} /> Role Permissions
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                id="users-search"
                className={styles.searchInput}
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              id="users-role-filter"
              className={styles.filterSelect}
              value={filterRole}
              onChange={e => setFilterRole(e.target.value as typeof filterRole)}
            >
              <option value="all">All Roles</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div className={`glass-panel ${styles.tableWrap}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar} style={{ background: `${ROLE_COLORS[user.role]}33`, color: ROLE_COLORS[user.role] }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.userName}>{user.name}</div>
                          <div className={styles.userEmail}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.rolePill} style={{ color: ROLE_COLORS[user.role], background: `${ROLE_COLORS[user.role]}15`, borderColor: `${ROLE_COLORS[user.role]}30` }}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className={styles.muted}>{user.department}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td className={styles.muted}>{user.lastActive}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn} title="Send email"><Mail size={14} /></button>
                        <button className={styles.iconBtn} title="More"><MoreHorizontal size={14} /></button>
                        <button className={styles.iconBtn} title="Remove" onClick={() => removeUser(user.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className={styles.emptyRow}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.rolesGrid}>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} className={`glass-panel ${styles.roleDetailCard}`}>
              <div className={styles.roleDetailHeader}>
                <div className={styles.roleDetailIcon} style={{ color: ROLE_COLORS[role as UserRole], background: `${ROLE_COLORS[role as UserRole]}15` }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className={styles.roleDetailName}>{label}</div>
                  <div className={styles.roleDetailCount}>{users.filter(u => u.role === role).length} members</div>
                </div>
              </div>
              <p className={styles.roleDetailDesc}>{ROLE_DESCRIPTIONS[role as UserRole]}</p>
              <div className={styles.rolePermissions}>
                {[
                  { label: 'AI Chat', allowed: true },
                  { label: 'Document Upload', allowed: role === 'org_admin' },
                  { label: 'Manage Users', allowed: role === 'org_admin' },
                  { label: 'View Analytics', allowed: role === 'org_admin' || role === 'hr' },
                  { label: 'AI Config', allowed: role === 'org_admin' },
                ].map(p => (
                  <div key={p.label} className={styles.permission}>
                    <div className={`${styles.permDot} ${p.allowed ? styles.permAllowed : styles.permDenied}`} />
                    <span style={{ color: p.allowed ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => { setShowInvite(false); setFormError(''); }} title="Invite User">
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-email">Email Address *</label>
            <input id="invite-email" className={styles.input} type="email" placeholder="name@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-role">Role *</label>
            <select id="invite-role" className={styles.input}
              value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-dept">Department</label>
            <input id="invite-dept" className={styles.input} placeholder="e.g. Engineering"
              value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          {formError && <div className={styles.error}>{formError}</div>}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowInvite(false); setFormError(''); }}>Cancel</button>
            <button id="invite-submit" className={styles.primaryBtn} onClick={handleInvite}>Send Invite</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
