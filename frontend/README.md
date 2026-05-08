# Finance Tracker — Frontend

Personal finance tracker built with React + TypeScript. Upload bank statements, review and categorize transactions, track spending by category, set budgets, and analyze income vs. expense trends over time.

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Dev server + build |
| TanStack Query | 5 | Server state, caching, invalidation |
| Zustand | 5 | Global UI state |
| Axios | 1 | HTTP client |
| React Router | 7 | Client-side routing |
| CSS Modules | — | Scoped per-component styles |

---

## Features

- **Dashboard** — KPI cards (income, expenses, balance, count) with sparklines, calendar heatmap of daily spend, top categories donut chart, and recent transactions list
- **Transactions** — Paginated, filterable table with date-range search, delete, and category badges
- **Upload** — Drag-and-drop CSV upload with duplicate detection; low-confidence transactions go into a staged review queue where you can approve or reject before committing
- **Categories** — Auto-tagging rules (keyword → category) with priority; view and manage all rules in one place
- **Income** — Income-only transaction view with breakdown by source category
- **Budgets** — Set monthly (or custom period) spending limits per category with progress bars

---

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Sidebar/            # Navigation with live transaction count
│   │   ├── Topbar/             # Top bar with page title
│   │   ├── Toast/              # Toast notification system
│   │   ├── CategoryCombobox/   # Searchable category dropdown
│   │   └── ErrorBoundary/      # Per-route error isolation
│   ├── transactions/
│   │   ├── CategoryBadge/      # Colored pill — deterministic hash → palette color
│   │   ├── TransactionTable/   # Table: date, merchant, category, amount, delete
│   │   ├── DropZone/           # Drag-and-drop + click-to-browse CSV upload
│   │   └── StagedReviewTable/  # Approve / reject staged transactions
│   └── analytics/
│       ├── KpiCard/            # Metric card with sparkline + period delta
│       ├── Heatmap/            # Calendar heatmap of daily spend
│       ├── TopCategories/      # Donut chart + legend
│       ├── CategoryBar/        # Horizontal bar breakdown by category
│       ├── IncomeExpenseChart/ # Income vs. expense bar chart over time
│       ├── BudgetBar/          # Budget limit vs. actual spend progress bar
│       ├── RecentTransactions/ # Top-5 recent transactions list
│       └── TagRulesTable/      # CRUD table for auto-tagging rules
├── pages/
│   ├── DashboardPage.tsx       # /
│   ├── TransactionsPage.tsx    # /transactions
│   ├── UploadPage.tsx          # /upload
│   ├── CategoriesPage.tsx      # /categories
│   ├── IncomePage.tsx          # /income
│   └── BudgetPage.tsx          # /budget
├── hooks/
│   ├── useTransactions.ts      # useTransactions, useUploadCSV, useDeleteTransaction,
│   │                           #   useStagedTransactions, useApproveStaged, useRejectStaged
│   ├── useAnalytics.ts         # useAnalyticsSummary, useBalance, useDailyTrend, useCategoryBreakdown
│   ├── useTagRules.ts          # useTagRules, useCreateTagRule, useDeleteTagRule
│   └── useBudgets.ts           # useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget
├── services/
│   └── api.ts                  # transactionAPI, analyticsAPI, tagRuleAPI, budgetAPI
├── stores/
│   ├── uiStore.ts              # Zustand: active tab
│   └── toastStore.ts           # Zustand: toast queue
├── types/
│   └── index.ts                # All shared TypeScript interfaces
├── App.tsx                     # Router + layout shell
└── main.tsx                    # QueryClientProvider + StrictMode
```

---

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | DashboardPage | Overview — KPIs, heatmap, categories, recent transactions |
| `/transactions` | TransactionsPage | Full filterable + paginated transaction table |
| `/categories` | CategoriesPage | Spending breakdown + manage auto-tagging rules |
| `/income` | IncomePage | Income-only view with category breakdown |
| `/upload` | UploadPage | CSV upload → staged review → commit |
| `/budget` | BudgetPage | Budget limits per category with spend progress |

---

## State Management

| State type | Tool | Examples |
|---|---|---|
| Server state | TanStack Query | transaction list, analytics summary, staged rows, budgets |
| Local UI state | `useState` | period selection, page number, upload history |
| Global UI state | Zustand | active tab, toast queue |

---

## API

The backend runs on `http://localhost:8000`. The Axios base URL is read from `VITE_API_URL` (falls back to `/api/v1` for production proxy).

### Transactions

```
POST   /transactions/upload             # CSV upload
GET    /transactions                    # List (limit, offset, start_date, end_date, search)
DELETE /transactions/{id}
GET    /transactions/staged             # Staged queue (limit, offset)
POST   /transactions/staged/approve    # { ids, approve_all }
POST   /transactions/staged/reject     # { ids }
```

### Analytics

```
GET    /analytics/summary              # total_income, total_expenses, balance, transaction_count
GET    /analytics/balance              # { balance }
GET    /analytics/daily-trend          # start_date + end_date → [{ date, income, expenses }]
GET    /analytics/categories           # [{ category, total, count }] sorted by total desc
```

### Tag Rules

```
GET    /tag-rules/
POST   /tag-rules/     # { keyword, category, priority }
DELETE /tag-rules/{id}
```

### Budgets

```
GET    /budgets/
POST   /budgets/       # { category, limit_amount, period }
PUT    /budgets/{id}
DELETE /budgets/{id}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api/v1` | Backend base URL (override for local dev) |

For local development, create a `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

The backend must be running on `http://localhost:8000` for API calls to work. See `../backend/README.md` for backend setup.

---

## Adding a New Feature

1. Add types to `src/types/index.ts`
2. Add API calls to `src/services/api.ts`
3. Add TanStack Query hooks to `src/hooks/`
4. Build components in `src/components/<area>/ComponentName/` with a paired `ComponentName.module.css`
5. Wire into a page in `src/pages/` and add a `<Route>` in `src/App.tsx`

### Query key conventions

```typescript
['transactions', params]
['transactions', 'staged']
['analytics', 'summary', start, end]
['analytics', 'daily-trend', start, end]
['analytics', 'categories', start, end]
['tag-rules']
['budgets']
```

After write operations, invalidate the relevant keys so the UI stays in sync.

### CSS design tokens (from `src/index.css`)

```css
--bg, --surface, --surface-2          /* backgrounds */
--line, --line-2                       /* borders */
--ink, --ink-2, --ink-3, --muted       /* text hierarchy */
--primary, --primary-2, --primary-soft, --primary-tint
--pos, --pos-soft                      /* income / positive */
--neg, --neg-soft                      /* expense / negative */
--radius, --radius-sm
--shadow-sm, --shadow-md, --shadow-lg
```
