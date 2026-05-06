import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../services/api';

export function useTransactions(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['transactions', limit, offset],
    queryFn: () => transactionAPI.getTransactions(limit, offset),
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
