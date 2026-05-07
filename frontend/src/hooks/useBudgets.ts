import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: budgetAPI.list,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);
  return useMutation({
    mutationFn: ({ category, limit_amount, period }: { category: string; limit_amount: number; period?: string }) =>
      budgetAPI.create(category, limit_amount, period),
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      addToast(`Budget set for ${budget.category}`);
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);
  return useMutation({
    mutationFn: ({ id, ...fields }: { id: string; category?: string; limit_amount?: number; period?: string }) =>
      budgetAPI.update(id, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      addToast('Budget updated');
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => budgetAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      addToast('Budget removed');
    },
  });
}
