import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Topbar.module.css';

const ROUTE_LABELS: Record<string, [string, string]> = {
  '/':             ['Overview',  'Dashboard'],
  '/transactions': ['Data',      'Transactions'],
  '/categories':   ['Overview',  'Categories'],
  '/upload':       ['Data',      'Uploads'],
  '/income':       ['Overview',  'Income & Expenses'],
  '/budget':       ['Overview',  'Budget vs Actual'],
};

type Panel = 'notifications' | 'settings' | null;

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [section, page] = ROUTE_LABELS[pathname] ?? ['App', 'Page'];
  const [open, setOpen] = useState<Panel>(null);
  const ref = useRef<HTMLElement>(null);
  const isTransactions = pathname === '/transactions';
  const searchValue = isTransactions ? (searchParams.get('q') ?? '') : '';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(panel: Panel) {
    setOpen(prev => prev === panel ? null : panel);
  }

  return (
    <header className={styles.topbar} ref={ref}>
      <div className={styles.crumbs}>
        <span>{section}</span>
        <span className={styles.sep}>›</span>
        <strong>{page}</strong>
      </div>

      <div className={`${styles.search} ${isTransactions ? styles.searchActive : ''}`}
        onClick={() => isTransactions && (document.getElementById('topbar-search') as HTMLInputElement)?.focus()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        {isTransactions ? (
          <input
            id="topbar-search"
            className={styles.searchInput}
            placeholder="Search transactions, merchants…"
            value={searchValue}
            onChange={e => {
              const q = e.target.value;
              const params = new URLSearchParams(searchParams);
              if (q) params.set('q', q); else params.delete('q');
              navigate(`/transactions?${params.toString()}`, { replace: true });
            }}
          />
        ) : (
          <span className={styles.searchPlaceholder}>Search transactions, merchants…</span>
        )}
        {!searchValue && <kbd className={styles.kbd}>⌘K</kbd>}
      </div>

      <div className={styles.btnWrap}>
        <button
          className={`${styles.iconBtn} ${open === 'notifications' ? styles.iconBtnActive : ''}`}
          aria-label="Notifications"
          onClick={() => toggle('notifications')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {open === 'notifications' && (
          <div className={styles.panel}>
            <div className={styles.panelHead}>Notifications</div>
            <div className={styles.panelEmpty}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              No notifications yet
            </div>
          </div>
        )}
      </div>

      <div className={styles.btnWrap}>
        <button
          className={`${styles.iconBtn} ${open === 'settings' ? styles.iconBtnActive : ''}`}
          aria-label="Settings"
          onClick={() => toggle('settings')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        {open === 'settings' && (
          <div className={styles.panel}>
            <div className={styles.panelHead}>Settings</div>
            <div className={styles.panelItem}>
              <span>Theme</span>
              <span className={styles.soon}>soon</span>
            </div>
            <div className={styles.panelItem}>
              <span>Export data</span>
              <span className={styles.soon}>soon</span>
            </div>
            <div className={styles.panelItem}>
              <span>Currency</span>
              <span className={styles.soon}>soon</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.avatar}>NK</div>
    </header>
  );
}
