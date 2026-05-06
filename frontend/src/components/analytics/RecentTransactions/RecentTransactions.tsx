import type { Transaction } from '../../../types';
import styles from './RecentTransactions.module.css';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

function fmt(n: number, type: string): string {
  const abs = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return type === 'income' ? `+$${abs}` : `-$${abs}`;
}

function initials(description: string): string {
  return description
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_COLOR: Record<string, string> = {
  income:  'oklch(0.60 0.08 230)',
  expense: 'oklch(0.60 0.13 28)',
};

export default function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>Recent transactions</div>
        <button className={styles.viewAll}>View all</button>
      </div>

      {isLoading && <div className={styles.empty}>Loading…</div>}

      {!isLoading && recent.length === 0 && (
        <div className={styles.empty}>No transactions yet. Upload a CSV to get started.</div>
      )}

      {!isLoading && recent.length > 0 && (
        <ul className={styles.list}>
          {recent.map((tx) => {
            const color = TYPE_COLOR[tx.transaction_type] ?? 'var(--muted)';
            return (
              <li key={tx.id} className={styles.row}>
                <div className={styles.logo} style={{ background: color + '22', color }}>
                  {initials(tx.description)}
                </div>
                <div className={styles.info}>
                  <div className={styles.name}>{tx.description}</div>
                  <div className={styles.meta}>
                    <span className={styles.catTag}>
                      <span className={styles.catDot} style={{ background: color }} />
                      {tx.transaction_type}
                    </span>
                    <span className={styles.date}>{formatDate(tx.date)}</span>
                  </div>
                </div>
                <div className={`${styles.amount} ${tx.transaction_type === 'income' ? styles.pos : styles.neg}`}>
                  {fmt(tx.amount, tx.transaction_type)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
