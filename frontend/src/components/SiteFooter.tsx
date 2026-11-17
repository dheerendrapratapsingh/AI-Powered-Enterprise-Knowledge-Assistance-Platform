import { NavLink } from 'react-router-dom';
import { Bot } from 'lucide-react';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTopRow}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <div className={styles.brandEmblemSmall}>
                <Bot size={16} color="#FFFFFF" />
              </div>
              <span className={styles.brandTitle}>VIT-AP Copilot</span>
            </div>
            <p className={styles.brandDesc}>
              An intelligent university knowledge companion created for VIT-AP students.
              Explore course syllabi, university regulations, hostel guidelines, and campus directories in one place.
            </p>
            <div className={styles.syncBadge}>
              <span className={styles.syncDot}></span>
              <span>Grounded in Official VIT-AP Documents</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className={styles.navCol}>
            <h5 className={styles.navTitle}>Navigation</h5>
            <NavLink to="/" className={styles.footerLink}>Home</NavLink>
            <NavLink to="/for-students" className={styles.footerLink}>For Students</NavLink>
            <NavLink to="/how-to-use" className={styles.footerLink}>How to Use</NavLink>
            <NavLink to="/knowledge-base" className={styles.footerLink}>Knowledge Base</NavLink>
            <NavLink to="/copilot" className={styles.footerLink}>Launch Copilot</NavLink>
          </div>

          {/* Institutional Sources */}
          <div className={styles.navCol}>
            <h5 className={styles.navTitle}>Available Knowledge</h5>
            <NavLink to="/knowledge-base" className={styles.footerLinkStatic}>B.Tech CSE Core Syllabus</NavLink>
            <NavLink to="/knowledge-base" className={styles.footerLinkStatic}>B.Tech CSBS Syllabus</NavLink>
            <NavLink to="/knowledge-base" className={styles.footerLinkStatic}>Hostel Outing Regulations</NavLink>
            <NavLink to="/knowledge-base" className={styles.footerLinkStatic}>Academic Regulations &amp; FFCS</NavLink>
            <NavLink to="/knowledge-base" className={styles.footerLinkStatic}>Faculty Cabin Directory</NavLink>
          </div>

          {/* Student Access Portals */}
          <div className={styles.navCol}>
            <h5 className={styles.navTitle}>Campus Resources</h5>
            <NavLink to="/copilot" className={styles.footerLink}>Launch Student Chat</NavLink>
            <a href="https://vtop.vitap.ac.in" target="_blank" rel="noreferrer" className={styles.footerLink}>
              V-TOP Student Portal ↗
            </a>
            <a href="https://vitap.ac.in" target="_blank" rel="noreferrer" className={styles.footerLink}>
              VIT-AP Official Website ↗
            </a>
            <NavLink to="/login" className={styles.footerLink}>Administrative Login</NavLink>
          </div>
        </div>

        {/* Bottom Row */}
        <div className={styles.footerBottomRow}>
          <span className={styles.copyrightText}>
            © 2026 VIT-AP Copilot. Created for the VIT-AP University student community.
          </span>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot}></span>
            <span>Student Knowledge Base Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
