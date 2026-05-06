import type { CategoryBreakdown } from '../../../types';
import styles from './TopCategories.module.css';

interface TopCategoriesProps {
  categories: CategoryBreakdown[];
  isLoading?: boolean;
}

const PALETTE = [
  'oklch(0.55 0.10 250)',
  'oklch(0.62 0.10 155)',
  'oklch(0.65 0.10 30)',
  'oklch(0.70 0.10 80)',
  'oklch(0.65 0.08 330)',
  'oklch(0.60 0.10 200)',
  'oklch(0.55 0.10 0)',
];

const R = 44;
const CIRC = 2 * Math.PI * R;

interface DonutProps {
  categories: CategoryBreakdown[];
  total: number;
}

function DonutChart({ categories, total }: DonutProps) {
  let offset = 0;
  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 120 120" className={styles.donutSvg} style={{ transform: 'rotate(-90deg)' }}>
        {categories.map((cat, i) => {
          const dash = (cat.total / total) * CIRC;
          const el = (
            <circle
              key={i}
              cx="60" cy="60" r={R}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth="20"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutVal}>
          ${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
        </span>
        <span className={styles.donutSub}>total</span>
      </div>
    </div>
  );
}

export default function TopCategories({ categories, isLoading }: TopCategoriesProps) {
  const total = categories.reduce((s, c) => s + c.total, 0);
  const top = categories.slice(0, 7);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>Top categories</div>
        <div className={styles.cardMeta}>By total spend</div>
      </div>

      {isLoading && <div className={styles.empty}>Loading…</div>}

      {!isLoading && categories.length === 0 && (
        <div className={styles.empty}>No expense data yet.</div>
      )}

      {!isLoading && categories.length > 0 && (
        <div className={styles.body}>
          <DonutChart categories={top} total={total} />
          <ul className={styles.list}>
            {top.map((cat, i) => (
              <li key={i} className={styles.row}>
                <span className={styles.dot} style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className={styles.catName}>{cat.category ?? 'Uncategorised'}</span>
                <span className={styles.catVal}>${cat.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
