import { NavLink, useNavigate } from 'react-router-dom';
import { useAnalyticsSummary } from '../../../hooks/useAnalytics';
import styles from './Sidebar.module.css';

function Ico({ children }: { children: React.ReactNode }) {
  return (
    <svg className={styles.ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { data: summary } = useAnalyticsSummary();
  const txCount = summary?.transaction_count ?? null;

  return (
    <aside className={styles.sb}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>L</span>
        <span className={styles.brandName}>Ledger<em>.</em></span>
      </div>

      <nav className={styles.navGroup}>
        <span className={styles.navLabel}>Overview</span>

        <NavLink to="/" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Ico><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></Ico>
          Dashboard
        </NavLink>

        <NavLink to="/income" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Ico><path d="M12 2v20M17 7l-5-5-5 5M17 17l-5 5-5-5"/></Ico>
          Income &amp; Expenses
        </NavLink>

        <NavLink to="/categories" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Ico><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></Ico>
          Categories
        </NavLink>

        <NavLink to="/budget" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Ico><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ico>
          Budget vs Actual
        </NavLink>
      </nav>

      <nav className={styles.navGroup}>
        <span className={styles.navLabel}>Data</span>

        <NavLink to="/transactions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Ico><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="0.5" fill="currentColor"/><circle cx="3" cy="12" r="0.5" fill="currentColor"/><circle cx="3" cy="18" r="0.5" fill="currentColor"/></Ico>
          Transactions
          {txCount !== null && <span className={styles.count}>{txCount}</span>}
        </NavLink>

        <NavLink to="/upload" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Ico><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Ico>
          Uploads
          <span className={styles.count}>4</span>
        </NavLink>
      </nav>

      <div className={styles.uploadBox} onClick={() => navigate('/upload')} style={{ cursor: 'pointer' }}>
        <div className={styles.uploadIco}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <span className={styles.uploadTitle}>Upload statement</span>
        <span className={styles.uploadSub}>CSV · TSV · XLSX</span>
      </div>
    </aside>
  );
}
