import axios from 'axios';
import type { Transaction, AnalyticsSummary, DailyTrend, CategoryBreakdown, UploadResult, StagedTransaction, TagRule } from '../types';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

export const transactionAPI = {
  getTransactions: (params: { limit?: number; offset?: number; start_date?: string; end_date?: string } = {}) =>
    apiClient.get<Transaction[]>('/transactions', { params }).then(r => r.data),

  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<UploadResult>('/transactions/upload', formData).then(r => r.data);
  },

  deleteTransaction: (id: string) =>
    apiClient.delete(`/transactions/${id}`).then(r => r.data),

  getStagedTransactions: (params: { limit?: number; offset?: number } = {}) =>
    apiClient.get<StagedTransaction[]>('/transactions/staged', { params }).then(r => r.data),

  approveStaged: (payload: { ids: string[] | null; approve_all: boolean }) =>
    apiClient.post<{ approved: number }>('/transactions/staged/approve', payload).then(r => r.data),

  rejectStaged: (ids: string[]) =>
    apiClient.post<{ rejected: number }>('/transactions/staged/reject', { ids }).then(r => r.data),
};

export const tagRuleAPI = {
  list: () =>
    apiClient.get<TagRule[]>('/tag-rules/').then(r => r.data),

  create: (keyword: string, category: string, priority = 5) =>
    apiClient.post<TagRule>('/tag-rules/', { keyword, category, priority }).then(r => r.data),

  remove: (id: string) =>
    apiClient.delete(`/tag-rules/${id}`),
};

export const analyticsAPI = {
  getSummary: (params: { start_date?: string; end_date?: string } = {}) =>
    apiClient.get<AnalyticsSummary>('/analytics/summary', { params }).then(r => r.data),

  getBalance: () =>
    apiClient.get<{ balance: number }>('/analytics/balance').then(r => r.data),

  getDailyTrend: (start_date: string, end_date: string) =>
    apiClient.get<DailyTrend[]>('/analytics/daily-trend', { params: { start_date, end_date } }).then(r => r.data),

  getCategories: (params: { start_date?: string; end_date?: string } = {}) =>
    apiClient.get<CategoryBreakdown[]>('/analytics/categories', { params }).then(r => r.data),
};
