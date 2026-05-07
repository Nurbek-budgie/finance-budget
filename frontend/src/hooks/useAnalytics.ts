import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';

export function useAnalyticsSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'summary', startDate, endDate],
    queryFn: () => analyticsAPI.getSummary(
      startDate && endDate ? { start_date: startDate, end_date: endDate } : {}
    ),
  });
}

export function useBalance() {
  return useQuery({
    queryKey: ['analytics', 'balance'],
    queryFn: analyticsAPI.getBalance,
  });
}

export function useDailyTrend(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'daily-trend', startDate, endDate],
    queryFn: () => analyticsAPI.getDailyTrend(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useCategoryBreakdown(startDate?: string, endDate?: string, type?: string) {
  return useQuery({
    queryKey: ['analytics', 'categories', startDate, endDate, type],
    queryFn: () => analyticsAPI.getCategories(
      startDate && endDate ? { start_date: startDate, end_date: endDate, type } : { type }
    ),
  });
}

export function useAllExpenseCategories() {
  return useQuery({
    queryKey: ['analytics', 'categories', 'all-expense'],
    queryFn: () => analyticsAPI.getCategories({ type: 'expense' }),
    staleTime: 5 * 60 * 1000,
  });
}
