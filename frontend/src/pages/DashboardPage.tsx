import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../components/analytics/KpiCard/KpiCard';
import Heatmap from '../components/analytics/Heatmap/Heatmap';
import TopCategories from '../components/analytics/TopCategories/TopCategories';
import RecentTransactions from '../components/analytics/RecentTransactions/RecentTransactions';
import { useAnalyticsSummary, useDailyTrend, useCategoryBreakdown } from '../hooks/useAnalytics';
import { useTransactions } from '../hooks/useTransactions';
import styles from './DashboardPage.module.css';

type Period = 'Week' | 'Month' | 'Quarter' | 'Year';
const PERIODS: Period[] = ['Week', 'Month', 'Quarter', 'Year'];

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function periodDates(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'Week') {
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return { start, end };
  }
  if (period === 'Month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
  }
  if (period === 'Quarter') {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return { start: qStart, end };
  }
  // Year
  return { start: new Date(now.getFullYear(), 0, 1), end };
}

function prevPeriodDates(period: Period): { start: Date; end: Date } {
  const { start, end } = periodDates(period);
  const diff = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - diff - 86400000),
    end: new Date(start.getTime() - 86400000),
  };
}

function calcDelta(current: number, previous: number): { label: string; up: boolean } {
  if (previous === 0) return { label: '—', up: true };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { label: `${sign}${pct.toFixed(1)}%`, up: pct >= 0 };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('Month');

  const { start, end } = periodDates(period);
  const prev = prevPeriodDates(period);

  const startStr = isoDate(start);
  const endStr = isoDate(end);
  const prevStartStr = isoDate(prev.start);
  const prevEndStr = isoDate(prev.end);

  // 60-day window for sparklines (covers current + prev month)
  const trendStart = isoDate(new Date(start.getTime() - 30 * 86400000));

  const { data: summary, isLoading: summaryLoading, isError: summaryError } =
    useAnalyticsSummary(startStr, endStr);

  const { data: prevSummary } = useAnalyticsSummary(prevStartStr, prevEndStr);

  const { data: trendData = [] } = useDailyTrend(trendStart, endStr);

  const { data: categories = [], isLoading: catLoading } =
    useCategoryBreakdown(startStr, endStr);

  const { data: txData, isLoading: txLoading } =
    useTransactions({ start_date: startStr, end_date: endStr, limit: 500 });
  const transactions = txData?.items ?? [];

  // Sparklines: last 7 data points from trend
  const last7 = trendData.slice(-7);
  const sparkIncome   = last7.map(d => d.income);
  const sparkExpenses = last7.map(d => d.expenses);
  const sparkBalance  = last7.map((_d, i, arr) => {
    const slice = arr.slice(0, i + 1);
    return slice.reduce((s, x) => s + x.income - x.expenses, 0);
  });
  const sparkSavings  = last7.map(d =>
    d.income > 0 ? ((d.income - d.expenses) / d.income) * 100 : 0
  );

  // Deltas vs previous period
  const incomeDelta    = calcDelta(summary?.total_income ?? 0, prevSummary?.total_income ?? 0);
  const expensesDelta  = calcDelta(summary?.total_expenses ?? 0, prevSummary?.total_expenses ?? 0);
  const balanceDelta   = calcDelta(summary?.balance ?? 0, prevSummary?.balance ?? 0);
  const savingsRate    = summary && summary.total_income > 0
    ? (summary.balance / summary.total_income) * 100 : 0;
  const prevSavings    = prevSummary && prevSummary.total_income > 0
    ? (prevSummary.balance / prevSummary.total_income) * 100 : 0;
  const savingsDelta   = calcDelta(savingsRate, prevSavings);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const yearLabel = now.getFullYear();

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>
            {monthName} <em>at a glance.</em>
          </h1>
          <p className={styles.sub}>Day-by-day spending intensity</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.seg}>
            {PERIODS.map((p) => (
              <button
                key={p}
                className={period === p ? styles.segOn : ''}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button className={styles.datePicker}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {monthName} {yearLabel}
          </button>

          <button className={styles.uploadBtn} onClick={() => navigate('/upload')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload
          </button>
        </div>
      </div>

      {summaryError && (
        <div className={styles.error}>Could not reach backend — is it running on port 8000?</div>
      )}

      <div className={styles.kpiRow}>
        <KpiCard
          label="Total Income"
          value={summaryLoading ? '…' : fmt(summary?.total_income ?? 0)}
          delta={incomeDelta.label}
          deltaUp={incomeDelta.up}
          sparkData={sparkIncome.length ? sparkIncome : [0]}
        />
        <KpiCard
          label="Total Expenses"
          value={summaryLoading ? '…' : fmt(summary?.total_expenses ?? 0)}
          delta={expensesDelta.label}
          deltaUp={!expensesDelta.up}
          sparkData={sparkExpenses.length ? sparkExpenses : [0]}
        />
        <KpiCard
          label="Net Balance"
          value={summaryLoading ? '…' : fmt(summary?.balance ?? 0)}
          delta={balanceDelta.label}
          deltaUp={balanceDelta.up}
          sparkData={sparkBalance.length ? sparkBalance : [0]}
        />
        <KpiCard
          label="Savings Rate"
          value={summaryLoading ? '…' : `${savingsRate.toFixed(1)}%`}
          delta={savingsDelta.label}
          deltaUp={savingsDelta.up}
          sparkData={sparkSavings.length ? sparkSavings : [0]}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Daily spend</span>
        </div>
        <div className={styles.card}>
          <Heatmap transactions={transactions} isLoading={txLoading} />
        </div>
      </div>

      <div className={styles.grid2}>
        <TopCategories categories={categories} isLoading={catLoading} />
        <RecentTransactions transactions={transactions} isLoading={txLoading} />
      </div>
    </div>
  );
}
