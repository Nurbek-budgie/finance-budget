import { useState } from 'react';
import { useCategoryBreakdown } from '../hooks/useAnalytics';
import { useTagRules, useCreateTagRule, useDeleteTagRule } from '../hooks/useTagRules';
import CategoryBar from '../components/analytics/CategoryBar/CategoryBar';
import TagRulesTable from '../components/analytics/TagRulesTable/TagRulesTable';
import styles from './CategoriesPage.module.css';

type Period = 'Week' | 'Month' | 'Quarter' | 'Year';
const PERIODS: Period[] = ['Week', 'Month', 'Quarter', 'Year'];

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

export default function CategoriesPage() {
  const [period, setPeriod] = useState<Period>('Month');
  const { start, end } = periodDates(period);

  const { data: categories = [], isLoading: catLoading } = useCategoryBreakdown(start, end, 'expense');
  const { data: rules = [], isLoading: rulesLoading } = useTagRules();
  const createRule = useCreateTagRule();
  const deleteRule = useDeleteTagRule();

  const now = new Date();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const totalSpend = categories.filter(c => c.total > 0).reduce((s, c) => s + c.total, 0);
  const categoryCount = categories.filter(c => c.total > 0).length;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Categories<em>.</em></h1>
          <p className={styles.sub}>
            {categoryCount} categories · ${totalSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })} spent this {period.toLowerCase()}
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

      <div className={styles.grid}>
        <section>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Spending by category</span>
          </div>
          <div className={styles.card}>
            <CategoryBar categories={categories} isLoading={catLoading} />
          </div>
        </section>

        <section>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Auto-categorization rules</span>
            <span className={styles.ruleCount}>{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.card}>
            <TagRulesTable
              rules={rules}
              isLoading={rulesLoading}
              onCreate={(keyword, category) => createRule.mutate({ keyword, category })}
              onDelete={(id) => deleteRule.mutate(id)}
              isCreating={createRule.isPending}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
