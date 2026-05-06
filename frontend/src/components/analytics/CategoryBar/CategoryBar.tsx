import type { CategoryBreakdown } from '../../../types';
import styles from './CategoryBar.module.css';

const PALETTE = [
  '#4A90D9', '#E8834A', '#5CB87A', '#9B72D0',
  '#E8C84A', '#E86B6B', '#4AB8C8',
];

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

interface Props {
  categories: CategoryBreakdown[];
  isLoading: boolean;
}

export default function CategoryBar({ categories, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeleton} style={{ width: `${85 - i * 10}%` }} />
        ))}
      </div>
    );
  }

  const expenses = categories.filter(c => c.total > 0);
  if (!expenses.length) {
    return <div className={styles.empty}>No spending data for this period.</div>;
  }

  const max = expenses[0].total;
  const total = expenses.reduce((s, c) => s + c.total, 0);

  return (
    <div className={styles.list}>
      {expenses.map((cat, i) => {
        const label = cat.category ?? 'Uncategorized';
        const color = hashColor(label);
        const pct = total > 0 ? (cat.total / total) * 100 : 0;
        const barW = max > 0 ? (cat.total / max) * 100 : 0;
        return (
          <div key={i} className={styles.row}>
            <div className={styles.meta}>
              <span className={styles.dot} style={{ background: color }} />
              <span className={styles.label}>{label}</span>
              <span className={styles.count}>{cat.count} txn{cat.count !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${barW}%`, background: color }}
              />
            </div>
            <div className={styles.nums}>
              <span className={styles.amount}>{fmt(cat.total)}</span>
              <span className={styles.pct}>{pct.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
