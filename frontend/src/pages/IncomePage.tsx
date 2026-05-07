import { useState } from 'react';
import { useAnalyticsSummary, useDailyTrend } from '../hooks/useAnalytics';
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions';
import KpiCard from '../components/analytics/KpiCard/KpiCard';
import IncomeExpenseChart from '../components/analytics/IncomeExpenseChart/IncomeExpenseChart';
import TransactionTable from '../components/transactions/TransactionTable/TransactionTable';
import styles from './IncomePage.module.css';

type Period = 'Week' | 'Month' | 'Quarter' | 'Year';
const PERIODS: Period[] = ['Week', 'Month', 'Quarter', 'Year'];

function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function periodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let start: Date;
  if (period === 'Week') {
    start = new Date(end);
    start.setDate(end.getDate() - 6);
  } else if (period === 'Month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'Quarter') {
    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return { start: isoDate(start), end: isoDate(end) };
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function periodLabel(period: Period, start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (period === 'Week') {
    const f = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    return `${f(s)} – ${f(e)}`;
  }
  if (period === 'Month') {
    return s.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  if (period === 'Quarter') {
    const q = Math.floor(s.getMonth() / 3) + 1;
    return `Q${q} ${s.getFullYear()}`;
  }
  return s.getFullYear().toString();
}

export default function IncomePage() {
  const [period, setPeriod] = useState<Period>('Month');
  const { start, end } = periodDates(period);

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(start, end);
  const { data: trend = [], isLoading: trendLoading } = useDailyTrend(start, end);
  const { data: txData, isLoading: txLoading } = useTransactions({
    start_date: start,
    end_date: end,
    limit: 500,
  });
  const transactions = txData?.items ?? [];
  const deleteMutation = useDeleteTransaction();


  const savingsRate = summary && summary.total_income > 0
    ? (summary.balance / summary.total_income) * 100
    : 0;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Income <em>&amp; Expenses.</em></h1>
          <p className={styles.sub}>
            {summary?.transaction_count ?? '…'} transactions · {period.toLowerCase()} view
          </p>
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
            {periodLabel(period, start, end)}
          </button>
        </div>
      </div>

      <div className={styles.kpiRow}>
        <KpiCard
          label="Total Income"
          value={summaryLoading ? '…' : fmt(summary?.total_income ?? 0)}
          delta=""
          deltaUp={true}
          sparkData={trend.map(d => d.income)}
        />
        <KpiCard
          label="Total Expenses"
          value={summaryLoading ? '…' : fmt(summary?.total_expenses ?? 0)}
          delta=""
          deltaUp={false}
          sparkData={trend.map(d => d.expenses)}
        />
        <KpiCard
          label="Net Balance"
          value={summaryLoading ? '…' : fmt(summary?.balance ?? 0)}
          delta=""
          deltaUp={(summary?.balance ?? 0) >= 0}
          sparkData={trend.map((_, i, arr) =>
            arr.slice(0, i + 1).reduce((s, x) => s + x.income - x.expenses, 0)
          )}
        />
        <KpiCard
          label="Savings Rate"
          value={summaryLoading ? '…' : `${savingsRate.toFixed(1)}%`}
          delta=""
          deltaUp={savingsRate >= 0}
          sparkData={trend.map(d => d.income > 0 ? ((d.income - d.expenses) / d.income) * 100 : 0)}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Daily income vs expenses</span>
        </div>
        <div className={styles.card}>
          <IncomeExpenseChart data={trend} isLoading={trendLoading} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>All transactions</span>
        </div>
        <TransactionTable
          transactions={transactions}
          isLoading={txLoading}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>
    </div>
  );
}
