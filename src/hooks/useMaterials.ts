'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useToastStore } from '@/stores/toast';
import {
  getParts,
  getLowStockParts,
  getBoms,
  getStockLogs,
  createStockLog,
  getMaterialStats,
} from '@/lib/api/materials';

export function useParts() {
  return useQuery({
    queryKey: ['parts'],
    queryFn: getParts,
  });
}

export function useLowStockParts() {
  return useQuery({
    queryKey: ['parts', 'lowStock'],
    queryFn: getLowStockParts,
  });
}

export function useBoms() {
  return useQuery({
    queryKey: ['boms'],
    queryFn: getBoms,
  });
}

export function useStockLogs(limit = 50) {
  return useQuery({
    queryKey: ['stockLogs', limit],
    queryFn: () => getStockLogs(limit),
  });
}

export function useCreateStockLog() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: createStockLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockLogs'] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('success', '입출고가 처리되었습니다');
    },
    onError: () => {
      addToast('error', '입출고 처리에 실패했습니다');
    },
  });
}

export function useMaterialStats() {
  return useQuery({
    queryKey: ['dashboard', 'materialStats'],
    queryFn: getMaterialStats,
  });
}
