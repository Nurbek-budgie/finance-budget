import axios from 'axios';
import type { Transaction, AnalyticsSummary, UploadResult } from '../types';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

export const transactionAPI = {
  getTransactions: (limit = 50, offset = 0) =>
    apiClient.get<Transaction[]>('/transactions', { params: { limit, offset } }).then(r => r.data),

  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<UploadResult>('/transactions/upload', formData).then(r => r.data);
  },

  deleteTransaction: (id: string) =>
    apiClient.delete(`/transactions/${id}`).then(r => r.data),
};

export const analyticsAPI = {
  getSummary: () =>
    apiClient.get<AnalyticsSummary>('/analytics/summary').then(r => r.data),

  getBalance: () =>
    apiClient.get<{ balance: number }>('/analytics/balance').then(r => r.data),
};
