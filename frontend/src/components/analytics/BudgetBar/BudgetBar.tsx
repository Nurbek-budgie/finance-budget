import { useState } from 'react';
import styles from './BudgetBar.module.css';

interface Props {
  id: string;
  category: string;
  limit: number;
  actual: number;
  period: string;
  onEdit: (id: string, limit_amount: number) => void;
  onDelete: (id: string) => void;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function BudgetBar({ id, category, limit, actual, period, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(limit));

  const pct = limit > 0 ? actual / limit : 0;
  const fillPct = Math.min(pct, 1) * 100;
  const isOver = pct > 1;
  const isWarning = pct >= 0.85 && pct <= 1;

  const barClass = isOver ? styles.barOver : isWarning ? styles.barWarn : styles.barOk;
  const remaining = limit - actual;

  function handleSave() {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val > 0) onEdit(id, val);
    setEditing(false);
  }

  return (
    <div className={styles.row}>
      <div className={styles.top}>
        <div className={styles.left}>
          <span className={styles.category}>{category}</span>
          <span className={styles.periodBadge}>{period}</span>
        </div>
        <div className={styles.right}>
          {editing ? (
            <div className={styles.editRow}>
              <span className={styles.currency}>$</span>
              <input
                className={styles.editInput}
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus
                type="number"
                min="1"
              />
              <button className={styles.saveBtn} onClick={handleSave}>Save</button>
              <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <div className={styles.amounts}>
              <span className={styles.actual}>{fmt(actual)}</span>
              <span className={styles.separator}>/</span>
              <span className={styles.limit}>{fmt(limit)}</span>
              <button className={styles.iconBtn} onClick={() => { setEditVal(String(limit)); setEditing(true); }} title="Edit">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className={styles.iconBtn} onClick={() => { if (window.confirm(`Remove ${category} budget?`)) onDelete(id); }} title="Delete">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.barTrack}>
        <div className={`${styles.barFill} ${barClass}`} style={{ width: `${fillPct}%` }} />
      </div>

      <div className={styles.footer}>
        <span className={styles.pct}>{Math.round(pct * 100)}% used</span>
        {isOver ? (
          <span className={styles.overAmount}>over by {fmt(Math.abs(remaining))}</span>
        ) : (
          <span className={styles.leftAmount}>{fmt(remaining)} left</span>
        )}
      </div>
    </div>
  );
}
