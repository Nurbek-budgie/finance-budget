import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../services/api';

export function useTransactions(params: { limit?: number; offset?: number; start_date?: string; end_date?: string } = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionAPI.getTransactions(params),
  });
}

export function useUploadCSV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => transactionAPI.uploadCSV(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionAPI.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useStagedTransactions() {
  return useQuery({
    queryKey: ['transactions', 'staged'],
    queryFn: () => transactionAPI.getStagedTransactions({ limit: 200 }),
  });
}

export function useApproveStaged() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ids: string[] | null; approve_all: boolean }) =>
      transactionAPI.approveStaged(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'staged'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useRejectStaged() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => transactionAPI.rejectStaged(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'staged'] });
    },
  });
}
