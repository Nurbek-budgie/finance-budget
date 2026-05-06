import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsAPI.getSummary,
  });
}

export function useBalance() {
  return useQuery({
    queryKey: ['analytics', 'balance'],
    queryFn: analyticsAPI.getBalance,
  });
}
