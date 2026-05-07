export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
  category?: string | null;
}

export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
}

export interface DailyTrend {
  date: string;
  income: number;
  expenses: number;
}

export interface CategoryBreakdown {
  category: string | null;
  total: number;
  count: number;
  transaction_type?: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
}

export interface UploadResult {
  committed: number;
  staged: number;
  skipped_duplicates: number;
  errors: string[];
}

export type StagedStatus = 'pending' | 'approved' | 'rejected';

export interface StagedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
  suggested_category: string | null;
  confidence_score: number;
  status: StagedStatus;
  source_file: string | null;
}

export interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  period: string;
  created_at: string;
}

export interface TagRule {
  id: string;
  keyword: string;
  category: string;
  priority: number;
  is_active: boolean;
}
