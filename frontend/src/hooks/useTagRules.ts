import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagRuleAPI } from '../services/api';

export function useTagRules() {
  return useQuery({
    queryKey: ['tag-rules'],
    queryFn: tagRuleAPI.list,
  });
}

export function useCreateTagRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ keyword, category, priority }: { keyword: string; category: string; priority?: number }) =>
      tagRuleAPI.create(keyword, category, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-rules'] });
    },
  });
}

export function useDeleteTagRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagRuleAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-rules'] });
    },
  });
}
