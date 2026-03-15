'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useToastStore } from '@/stores/toast';
import {
  getWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrderStatus,
  getProductionStats,
} from '@/lib/api/production';
import type { WorkOrder } from '@/types';

export function useWorkOrders(status?: string) {
  return useQuery({
    queryKey: ['workOrders', status],
    queryFn: () => getWorkOrders(status),
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['workOrders', id],
    queryFn: () => getWorkOrder(id),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('success', '생산 요청이 등록되었습니다');
    },
    onError: () => {
      addToast('error', '생산 요청 등록에 실패했습니다');
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = getQueryClient();
  return useMutation({
    mutationFn: ({ id, status, progress }: { id: string; status: WorkOrder['status']; progress?: number }) =>
      updateWorkOrderStatus(id, status, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useProductionStats() {
  return useQuery({
    queryKey: ['dashboard', 'productionStats'],
    queryFn: getProductionStats,
  });
}
