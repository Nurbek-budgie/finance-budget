import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions';
import TransactionTable from '../components/transactions/TransactionTable/TransactionTable';
import styles from './TransactionsPage.module.css';

type Period = 'Week' | 'Month' | 'Quarter' | 'Year';
const PERIODS: Period[] = ['Week', 'Month', 'Quarter', 'Year'];
const PAGE_SIZE = 50;

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
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

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState<Period>('Month');
  const [page, setPage] = useState(0);

  const search = searchParams.get('q') ?? '';
  const { start, end } = periodDates(period);

  const { data, isLoading } = useTransactions({
    start_date: start,
    end_date: end,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: search || undefined,
  });

  const transactions = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = (page + 1) * PAGE_SIZE < total;

  const deleteMutation = useDeleteTransaction();

  const now = new Date();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Reset to page 0 when search changes
  useEffect(() => { setPage(0); }, [search]);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setPage(0);
  }

  function handleSearch(value: string) {
    setSearchParams(value ? { q: value } : {}, { replace: true });
  }

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Transactions<em>.</em></h1>
          <p className={styles.sub}>
            {isLoading ? '…' : total} transactions · {period.toLowerCase()} view
            {search && ` · "${search}"`}
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.seg}>
            {PERIODS.map((p) => (
              <button
                key={p}
                className={period === p ? styles.segOn : ''}
                onClick={() => handlePeriodChange(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button className={styles.datePicker}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {monthLabel}
          </button>

          <button className={styles.uploadBtn} onClick={() => navigate('/upload')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload
          </button>
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        isLoading={isLoading}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {!isLoading && total > 0 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
