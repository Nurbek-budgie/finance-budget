import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';

export function useTransactions(params: { limit?: number; offset?: number; start_date?: string; end_date?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionAPI.getTransactions(params),
  });
}

export function useUploadCSV() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);
  return useMutation({
    mutationFn: (file: File) => transactionAPI.uploadCSV(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      addToast(
        `${result.committed} committed, ${result.staged} staged for review, ${result.skipped_duplicates} skipped`
      );
    },
    onError: () => {
      addToast('Upload failed — check the file format and try again.', 'error');
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => transactionAPI.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      addToast('Transaction deleted');
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
  const addToast = useToastStore(s => s.addToast);
  return useMutation({
    mutationFn: (payload: { ids: string[] | null; approve_all: boolean }) =>
      transactionAPI.approveStaged(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'staged'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      addToast(`${result.approved} transaction${result.approved !== 1 ? 's' : ''} approved`);
    },
  });
}

export function useRejectStaged() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);
  return useMutation({
    mutationFn: (ids: string[]) => transactionAPI.rejectStaged(ids),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'staged'] });
      addToast(`${ids.length} transaction${ids.length !== 1 ? 's' : ''} rejected`);
    },
  });
}
