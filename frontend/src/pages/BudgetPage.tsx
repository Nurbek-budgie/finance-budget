import { useState } from 'react';
import { useCategoryBreakdown, useAllExpenseCategories } from '../hooks/useAnalytics';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '../hooks/useBudgets';
import BudgetBar from '../components/analytics/BudgetBar/BudgetBar';
import CategoryCombobox from '../components/common/CategoryCombobox/CategoryCombobox';
import styles from './BudgetPage.module.css';

type Period = 'Week' | 'Month' | 'Quarter' | 'Year';
const PERIODS: Period[] = ['Week', 'Month', 'Quarter', 'Year'];

const PERIOD_LABELS: Record<Period, string> = {
  Week: 'weekly', Month: 'monthly', Quarter: 'quarterly', Year: 'yearly',
};

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function periodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  if (period === 'Week') {
    start = new Date(end); start.setDate(end.getDate() - 6);
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

export default function BudgetPage() {
  const [period, setPeriod] = useState<Period>('Month');
  const { start, end } = periodDates(period);

  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: categories = [], isLoading: catLoading } = useCategoryBreakdown(start, end, 'expense');
  const { data: allCategories = [] } = useAllExpenseCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const now = new Date();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Join budgets with actual spending
  const budgetRows = budgets
    .map(b => ({
      ...b,
      actual: categories.find(c => c.category?.toLowerCase() === b.category.toLowerCase())?.total ?? 0,
    }))
    .sort((a, b) => (b.actual / b.limit_amount) - (a.actual / a.limit_amount));

  // All-time expense category names for the combobox
  const allCategoryNames = allCategories
    .map(c => c.category)
    .filter((c): c is string => !!c);

  // Categories with spend but no budget
  const budgetedNames = new Set(budgets.map(b => b.category.toLowerCase()));
  const unbudgeted = categories.filter(
    c => c.category && !budgetedNames.has(c.category.toLowerCase()) && c.total > 0
  );

  // Summary stats
  const totalBudgeted = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgetRows.reduce((s, b) => s + b.actual, 0);
  const overallPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    const cat = newCategory.trim();
    const lim = parseFloat(newLimit);
    if (!cat || isNaN(lim) || lim <= 0) return;
    createBudget.mutate({ category: cat, limit_amount: lim, period: PERIOD_LABELS[period] });
    setNewCategory('');
    setNewLimit('');
  }

  const isLoading = budgetsLoading || catLoading;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Budget <em>vs Actual.</em></h1>
          <p className={styles.sub}>
            {budgets.length} budget{budgets.length !== 1 ? 's' : ''} · {period.toLowerCase()} view
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
            {monthLabel}
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {budgets.length > 0 && (
        <div className={styles.strip}>
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Budgeted</span>
            <span className={styles.stripValue}>{fmt(totalBudgeted)}</span>
          </div>
          <div className={styles.stripDivider} />
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Spent</span>
            <span className={styles.stripValue}>{fmt(totalSpent)}</span>
          </div>
          <div className={styles.stripDivider} />
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Remaining</span>
            <span className={`${styles.stripValue} ${totalBudgeted - totalSpent < 0 ? styles.neg : styles.pos}`}>
              {fmt(Math.abs(totalBudgeted - totalSpent))}
              {totalBudgeted - totalSpent < 0 ? ' over' : ' left'}
            </span>
          </div>
          <div className={styles.stripDivider} />
          <div className={styles.stripItem}>
            <span className={styles.stripLabel}>Overall</span>
            <span className={`${styles.stripValue} ${overallPct > 100 ? styles.neg : ''}`}>{overallPct}%</span>
          </div>
        </div>
      )}

      {/* Add budget form */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Set a budget</span>
        </div>
        <form className={styles.addForm} onSubmit={handleAddBudget}>
          <CategoryCombobox
            value={newCategory}
            onChange={setNewCategory}
            suggestions={allCategoryNames}
            budgetedNames={budgetedNames}
            placeholder="Category (e.g. Food)"
            disabled={createBudget.isPending}
          />
          <div className={styles.amountWrap}>
            <span className={styles.currency}>$</span>
            <input
              className={styles.inputAmount}
              placeholder="Limit"
              type="number"
              min="1"
              value={newLimit}
              onChange={e => setNewLimit(e.target.value)}
              disabled={createBudget.isPending}
            />
          </div>
          <button
            type="submit"
            className={styles.addBtn}
            disabled={createBudget.isPending || !newCategory.trim() || !newLimit}
          >
            {createBudget.isPending ? 'Adding…' : '+ Add budget'}
          </button>
        </form>
      </div>

      {/* Budget rows */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Budgets</span>
          {!isLoading && <span className={styles.sectionMeta}>{budgetRows.length} tracked</span>}
        </div>
        <div className={styles.card}>
          {isLoading ? (
            <div className={styles.empty}>Loading…</div>
          ) : budgetRows.length === 0 ? (
            <div className={styles.empty}>No budgets yet. Add one above to start tracking.</div>
          ) : (
            budgetRows.map(b => (
              <BudgetBar
                key={b.id}
                id={b.id}
                category={b.category}
                limit={b.limit_amount}
                actual={b.actual}
                period={b.period}
                onEdit={(id, limit_amount) => updateBudget.mutate({ id, limit_amount })}
                onDelete={(id) => deleteBudget.mutate(id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Unbudgeted categories */}
      {unbudgeted.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Unbudgeted spending</span>
            <span className={styles.sectionMeta}>{unbudgeted.length} categories</span>
          </div>
          <div className={styles.card}>
            {unbudgeted.map((cat, i) => (
              <div key={i} className={styles.unbudgetedRow}>
                <span className={styles.unbudgetedName}>{cat.category}</span>
                <span className={styles.unbudgetedMeta}>{cat.count} txn{cat.count !== 1 ? 's' : ''}</span>
                <span className={styles.unbudgetedAmount}>{fmt(cat.total)}</span>
                <button
                  className={styles.setBudgetBtn}
                  onClick={() => setNewCategory(cat.category ?? '')}
                >
                  + Set budget
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
