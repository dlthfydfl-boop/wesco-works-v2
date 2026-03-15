'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useToastStore } from '@/stores/toast';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  type CreateOrderInput,
} from '@/lib/api/orders';
import type { OrderStatus } from '@/types';

export function useOrders(status?: string) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: () => getOrders(status),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('success', '주문이 등록되었습니다');
    },
    onError: () => {
      addToast('error', '주문 등록에 실패했습니다');
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('success', '주문 상태가 변경되었습니다');
    },
    onError: () => {
      addToast('error', '상태 변경에 실패했습니다');
    },
  });
}

export function useDeleteOrder() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      addToast('success', '주문이 삭제되었습니다');
    },
    onError: () => {
      addToast('error', '주문 삭제에 실패했습니다');
    },
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ['dashboard', 'orderStats'],
    queryFn: getOrderStats,
  });
}
