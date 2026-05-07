import { useState } from 'react';
import type { DailyTrend } from '../../../types';
import styles from './IncomeExpenseChart.module.css';

interface Props {
  data: DailyTrend[];
  isLoading: boolean;
}

interface Tooltip {
  x: number;
  y: number;
  date: string;
  income: number;
  expenses: number;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

const H = 180;
const BAR_GAP = 2;
const GROUP_GAP = 6;

export default function IncomeExpenseChart({ data, isLoading }: Props) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={styles.skel}
            style={{ height: `${30 + Math.random() * 120}px` }}
          />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <div className={styles.empty}>No data for this period.</div>;
  }

  const maxVal = Math.sqrt(Math.max(...data.flatMap(d => [d.income, d.expenses]), 1));

  const labelEvery = data.length <= 7 ? 1 : data.length <= 31 ? Math.ceil(data.length / 8) : Math.ceil(data.length / 6);

  const barW = 6;
  const groupW = barW * 2 + BAR_GAP + GROUP_GAP;
  const totalW = groupW * data.length;
  const useMonthFormat = data.length <= 7 || data.length > 31;

  const labels = data
    .map((d, i) => {
      if (i % labelEvery !== 0) return null;
      const labelDate = new Date(d.date + 'T00:00:00');
      const text = useMonthFormat
        ? labelDate.toLocaleString('en-US', { month: 'short', day: 'numeric' })
        : labelDate.getDate().toString();
      const pct = ((i * groupW + barW) / totalW) * 100;
      return { text, pct, key: d.date };
    })
    .filter(Boolean) as { text: string; pct: number; key: string }[];

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${totalW} ${H}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setTooltip(null)}
      >
        {data.map((d, i) => {
          const x = i * groupW;
          const incH = Math.max((Math.sqrt(d.income) / maxVal) * H, d.income > 0 ? 2 : 0);
          const expH = Math.max((Math.sqrt(d.expenses) / maxVal) * H, d.expenses > 0 ? 2 : 0);

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={H - incH}
                width={barW}
                height={incH}
                rx={2}
                className={styles.incBar}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, date: d.date, income: d.income, expenses: d.expenses });
                }}
              />
              <rect
                x={x + barW + BAR_GAP}
                y={H - expH}
                width={barW}
                height={expH}
                rx={2}
                className={styles.expBar}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, date: d.date, income: d.income, expenses: d.expenses });
                }}
              />
            </g>
          );
        })}
      </svg>

      <div className={styles.xAxis}>
        {labels.map(({ text, pct, key }) => (
          <span key={key} className={styles.label} style={{ left: `${pct}%` }}>
            {text}
          </span>
        ))}
      </div>

      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className={styles.ttDate}>{fmtDate(tooltip.date)}</div>
          <div className={styles.ttRow}>
            <span className={styles.ttInc}>Income</span>
            <span>{fmt(tooltip.income)}</span>
          </div>
          <div className={styles.ttRow}>
            <span className={styles.ttExp}>Expenses</span>
            <span>{fmt(tooltip.expenses)}</span>
          </div>
        </div>
      )}

      <div className={styles.legend}>
        <span className={styles.legInc} />Income
        <span className={styles.legExp} />Expenses
      </div>
    </div>
  );
}
