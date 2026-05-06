import { useState } from 'react';
import type { StagedTransaction } from '../../../types';
import CategoryBadge from '../CategoryBadge/CategoryBadge';
import styles from './StagedReviewTable.module.css';

interface Props {
  staged: StagedTransaction[];
  onApprove: (ids: string[] | null, approveAll: boolean) => void;
  onReject: (ids: string[]) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function fmtAmount(amount: number, type: string): string {
  const sign = type === 'income' ? '+' : '-';
  return sign + '$' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StagedReviewTable({ staged, onApprove, onReject, isApproving, isRejecting }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pending = staged.filter(s => s.status === 'pending');

  function toggleAll() {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map(s => s.id)));
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (!pending.length) return null;

  const selArr = Array.from(selected);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <span className={styles.sectionTitle}>Review staged transactions</span>
          <span className={styles.count}>{pending.length}</span>
        </div>
        <div className={styles.bulkActions}>
          {selArr.length > 0 && (
            <>
              <button
                className={styles.approveBtn}
                onClick={() => { onApprove(selArr, false); setSelected(new Set()); }}
                disabled={isApproving}
              >
                Approve {selArr.length} selected
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => { onReject(selArr); setSelected(new Set()); }}
                disabled={isRejecting}
              >
                Reject selected
              </button>
            </>
          )}
          <button
            className={styles.approveAllBtn}
            onClick={() => onApprove(null, true)}
            disabled={isApproving}
          >
            {isApproving ? 'Approving…' : 'Approve all'}
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.size === pending.length && pending.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th>Date</th>
              <th>Merchant</th>
              <th>Amount</th>
              <th>Suggested Category</th>
              <th>Confidence</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pending.map((tx) => (
              <tr key={tx.id} className={selected.has(tx.id) ? styles.selectedRow : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(tx.id)}
                    onChange={() => toggle(tx.id)}
                  />
                </td>
                <td className={styles.date}>{fmtDate(tx.date)}</td>
                <td className={styles.desc}>{tx.description}</td>
                <td className={`${styles.amount} ${tx.transaction_type === 'income' ? styles.pos : styles.neg}`}>
                  {fmtAmount(tx.amount, tx.transaction_type)}
                </td>
                <td><CategoryBadge category={tx.suggested_category} /></td>
                <td>
                  <div className={styles.confBar}>
                    <div
                      className={styles.confFill}
                      style={{ width: `${Math.round(tx.confidence_score * 100)}%` }}
                    />
                    <span className={styles.confLabel}>{Math.round(tx.confidence_score * 100)}%</span>
                  </div>
                </td>
                <td className={styles.rowActions}>
                  <button
                    className={styles.approveRowBtn}
                    onClick={() => onApprove([tx.id], false)}
                    title="Approve"
                    disabled={isApproving}
                  >
                    ✓
                  </button>
                  <button
                    className={styles.rejectRowBtn}
                    onClick={() => onReject([tx.id])}
                    title="Reject"
                    disabled={isRejecting}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
