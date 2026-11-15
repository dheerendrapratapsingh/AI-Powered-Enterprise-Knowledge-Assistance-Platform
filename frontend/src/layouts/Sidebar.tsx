import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Bot, 
  MessageSquare, 
  Database, 
  Building2, 
  LayoutDashboard, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getCurrentUser, logout } from '../services/auth';
import styles from './Sidebar.module.css';

interface SidebarProps {
  role: 'platform' | 'org' | 'employee';
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser()
      .then(u => setUser(u))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const formatRole = (r?: string) => {
    if (!r) return role;
    if (r === 'ADMIN') return 'Platform Admin';
    if (r === 'ORG_ADMIN') return 'Org Admin';
    return 'Student Member';
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Sidebar Header */}
      <div className={styles.header}>
        <div className={styles.brand} title="VIT-AP Copilot">
          <div className={styles.logoIcon}>
            <Bot size={20} color="#FFFFFF" />
          </div>
          {!collapsed && (
            <div className={styles.brandInfo}>
              <span className={styles.brandTitle}>VIT-AP Copilot</span>
              <span className={styles.brandTenant}>VIT-AP University</span>
            </div>
          )}
        </div>

        <button 
          className={styles.collapseBtn} 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={styles.nav}>
        {role === 'employee' && (
          <>
            {!collapsed && <div className={styles.navSection}>AI Workspace</div>}
            <NavLink to="/chat" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="AI Assistant">
              <MessageSquare size={18} className={styles.linkIcon} />
              {!collapsed && <span>AI Copilot Chat</span>}
            </NavLink>
            <NavLink to="/search" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="Curriculum & Policy Search">
              <Sparkles size={18} className={styles.linkIcon} />
              {!collapsed && <span>Knowledge Search</span>}
            </NavLink>
          </>
        )}

        {role === 'org' && (
          <>
            {!collapsed && <div className={styles.navSection}>Organization Portal</div>}
            <NavLink to="/org" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="Knowledge Overview">
              <LayoutDashboard size={18} className={styles.linkIcon} />
              {!collapsed && <span>Org Dashboard</span>}
            </NavLink>
            <NavLink to="/org/knowledge" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="Document Knowledge Base">
              <Database size={18} className={styles.linkIcon} />
              {!collapsed && <span>Document Base</span>}
            </NavLink>
            <NavLink to="/chat" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="Test Copilot">
              <MessageSquare size={18} className={styles.linkIcon} />
              {!collapsed && <span>Test AI Chat</span>}
            </NavLink>
          </>
        )}

        {role === 'platform' && (
          <>
            {!collapsed && <div className={styles.navSection}>Platform Ecosystem</div>}
            <NavLink to="/platform" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="Platform Dashboard">
              <LayoutDashboard size={18} className={styles.linkIcon} />
              {!collapsed && <span>Global Overview</span>}
            </NavLink>
            <NavLink to="/platform/orgs" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="Tenant Organizations">
              <Building2 size={18} className={styles.linkIcon} />
              {!collapsed && <span>Tenants / Orgs</span>}
            </NavLink>
            <NavLink to="/org" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="University Knowledge">
              <Database size={18} className={styles.linkIcon} />
              {!collapsed && <span>Knowledge Admin</span>}
            </NavLink>
            <NavLink to="/chat" className={({isActive}) => isActive ? styles.activeLink : styles.link} title="Student Chat">
              <MessageSquare size={18} className={styles.linkIcon} />
              {!collapsed && <span>Copilot Portal</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Profile Section */}
      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            {getInitial()}
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || "Active Member"}</span>
              <span className={styles.userRoleBadge}>{formatRole(user?.role)}</span>
            </div>
          )}
          <button 
            className={styles.logoutBtn} 
            onClick={handleLogout} 
            title="Sign out of Copilot"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
