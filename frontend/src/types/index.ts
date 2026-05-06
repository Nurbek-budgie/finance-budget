export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
}

export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
}

export interface UploadResult {
  created: number;
  errors: string[];
  total_processed: number;
}
