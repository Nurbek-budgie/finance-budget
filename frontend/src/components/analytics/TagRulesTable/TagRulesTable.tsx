import { useState } from 'react';
import type { TagRule } from '../../../types';
import styles from './TagRulesTable.module.css';

interface Props {
  rules: TagRule[];
  isLoading: boolean;
  onCreate: (keyword: string, category: string) => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
}

export default function TagRulesTable({ rules, isLoading, onCreate, onDelete, isCreating }: Props) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const k = keyword.trim();
    const c = category.trim();
    if (!k || !c) return;
    onCreate(k, c);
    setKeyword('');
    setCategory('');
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.addRow} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          placeholder="Keyword (e.g. Netflix)"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          disabled={isCreating}
        />
        <input
          className={styles.input}
          placeholder="Category (e.g. Entertainment)"
          value={category}
          onChange={e => setCategory(e.target.value)}
          disabled={isCreating}
        />
        <button
          type="submit"
          className={styles.addBtn}
          disabled={isCreating || !keyword.trim() || !category.trim()}
        >
          {isCreating ? 'Adding…' : '+ Add rule'}
        </button>
      </form>

      {isLoading ? (
        <div className={styles.empty}>Loading rules…</div>
      ) : rules.length === 0 ? (
        <div className={styles.empty}>
          No rules yet. Add a keyword above to auto-categorize future uploads.
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Category</th>
                <th>Priority</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td className={styles.keyword}>{rule.keyword}</td>
                  <td className={styles.category}>{rule.category}</td>
                  <td className={styles.priority}>{rule.priority}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => onDelete(rule.id)}
                      title="Delete rule"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
