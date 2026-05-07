import type { Transaction } from '../../../types';
import CategoryBadge from '../CategoryBadge/CategoryBadge';
import styles from './TransactionTable.module.css';

interface Props {
  transactions: Transaction[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function fmtAmount(amount: number, type: string): string {
  const sign = type === 'income' ? '+' : '-';
  return sign + '$' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TransactionTable({ transactions, isLoading, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className={styles.empty}>
        <span className={styles.loader} />
        Loading transactions…
      </div>
    );
  }

  if (!transactions.length) {
    return <div className={styles.empty}>No transactions found for this period.</div>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Merchant</th>
            <th>Category</th>
            <th className={styles.right}>Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className={styles.date}>{fmtDate(tx.date)}</td>
              <td className={styles.desc}>{tx.description}</td>
              <td><CategoryBadge category={tx.category} /></td>
              <td className={`${styles.amount} ${tx.transaction_type === 'income' ? styles.pos : styles.neg}`}>
                {fmtAmount(tx.amount, tx.transaction_type)}
              </td>
              <td className={styles.actions}>
                {onDelete && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => { if (window.confirm(`Delete "${tx.description}"?`)) onDelete(tx.id); }}
                    title="Delete transaction"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
