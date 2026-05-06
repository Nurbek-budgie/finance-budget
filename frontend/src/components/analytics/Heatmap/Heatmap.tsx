import { useState } from 'react';
import type { Transaction } from '../../../types';
import styles from './Heatmap.module.css';

interface HeatmapProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HEAT_COLORS = [
  'oklch(0.91 0.035 210)',
  'oklch(0.80 0.065 210)',
  'oklch(0.67 0.09 210)',
  'oklch(0.54 0.11 210)',
  'oklch(0.42 0.13 210)',
];

function heatColor(amount: number, max: number): string {
  const r = amount / max;
  if (r < 0.15) return HEAT_COLORS[0];
  if (r < 0.35) return HEAT_COLORS[1];
  if (r < 0.55) return HEAT_COLORS[2];
  if (r < 0.75) return HEAT_COLORS[3];
  return HEAT_COLORS[4];
}

function textColor(amount: number, max: number): string {
  return amount / max > 0.55 ? 'rgba(255,255,255,0.85)' : 'var(--ink-2)';
}

interface Tip { day: number; x: number; y: number }

export default function Heatmap({ transactions, isLoading }: HeatmapProps) {
  const [tip, setTip] = useState<Tip | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Aggregate expense amounts per day for this month
  const dailySpend: Record<number, number> = {};
  transactions.forEach((t) => {
    if (t.transaction_type !== 'expense') return;
    const d = new Date(t.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const day = d.getDate();
    dailySpend[day] = (dailySpend[day] ?? 0) + t.amount;
  });

  const spendValues = Object.values(dailySpend);
  const maxSpend = spendValues.length ? Math.max(...spendValues) : 1;
  const maxEntry = spendValues.length
    ? Object.entries(dailySpend).reduce((a, b) => (+b[1] > +a[1] ? b : a))
    : null;
  const minEntry = spendValues.length
    ? Object.entries(dailySpend).reduce((a, b) => (+b[1] < +a[1] ? b : a))
    : null;

  const weeksNeeded = Math.ceil((startDow + daysInMonth) / 7);

  const cells: React.ReactNode[] = [];
  cells.push(<div key="corner" />);
  DOW.forEach((d, i) => cells.push(<div key={`dow${i}`} className={styles.dow}>{d}</div>));

  let day = 1;
  for (let week = 0; week < weeksNeeded; week++) {
    cells.push(<div key={`wl${week}`} className={styles.weekLabel}>W{week + 1}</div>);
    for (let d = 0; d < 7; d++) {
      const idx = week * 7 + d;
      const isReal = idx >= startDow && day <= daysInMonth;
      const currentDay = isReal ? day : null;
      if (isReal) day++;

      const amount = currentDay ? (dailySpend[currentDay] ?? 0) : 0;

      cells.push(
        <div
          key={`${week}-${d}`}
          className={`${styles.cell} ${!currentDay ? styles.empty : ''}`}
          style={currentDay && amount > 0
            ? { background: heatColor(amount, maxSpend), color: textColor(amount, maxSpend) }
            : undefined}
          onMouseEnter={currentDay ? (e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setTip({ day: currentDay, x: r.left + r.width / 2, y: r.top });
          } : undefined}
          onMouseLeave={currentDay ? () => setTip(null) : undefined}
        >
          {currentDay && (
            <>
              <span className={styles.dayNum}>{currentDay}</span>
              {amount > 0 && (
                <span className={styles.dayAmt}>${Math.round(amount)}</span>
              )}
            </>
          )}
        </div>
      );
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.headSub}>Each cell = one day &nbsp;·&nbsp; darker = higher spend</span>
        {isLoading ? (
          <span className={styles.headSub}>Loading…</span>
        ) : maxEntry && minEntry ? (
          <span className={styles.pills}>
            <span className={styles.pillHi}>Highest: {monthName} {maxEntry[0]} — ${Math.round(+maxEntry[1])}</span>
            <span className={styles.pillLo}>Lowest: {monthName} {minEntry[0]} — ${Math.round(+minEntry[1])}</span>
          </span>
        ) : (
          <span className={styles.headSub}>No expense data this month</span>
        )}
      </div>

      <div className={styles.cal}>{cells}</div>

      <div className={styles.legend}>
        <span>Less</span>
        <div className={styles.swatches}>
          {HEAT_COLORS.map((c, i) => (
            <span key={i} className={styles.swatch} style={{ background: c }} />
          ))}
        </div>
        <span>More</span>
      </div>

      {tip && (
        <div className={styles.tooltip} style={{ left: tip.x, top: tip.y }}>
          <div className={styles.tipDay}>{monthName} {tip.day}, {year}</div>
          <div className={styles.tipAmt}>${Math.round(dailySpend[tip.day] ?? 0)}</div>
        </div>
      )}
    </div>
  );
}
