'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useToastStore } from '@/stores/toast';
import {
  getCsTickets,
  createCsTicket,
  updateCsTicketStatus,
  getDeliveries,
  getServiceStats,
} from '@/lib/api/service';
import type { CsStatus } from '@/types';

export function useCsTickets(status?: string) {
  return useQuery({
    queryKey: ['csTickets', status],
    queryFn: () => getCsTickets(status),
  });
}

export function useCreateCsTicket() {
  const queryClient = getQueryClient();
  return useMutation({
    mutationFn: createCsTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csTickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCsTicketStatus() {
  const queryClient = getQueryClient();
  const addToast = useToastStore.getState().addToast;
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CsStatus }) =>
      updateCsTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csTickets'] });
      addToast('success', 'A/S 상태가 변경되었습니다');
    },
    onError: () => {
      addToast('error', '상태 변경에 실패했습니다');
    },
  });
}

export function useDeliveries() {
  return useQuery({
    queryKey: ['deliveries'],
    queryFn: getDeliveries,
  });
}

export function useServiceStats() {
  return useQuery({
    queryKey: ['dashboard', 'serviceStats'],
    queryFn: getServiceStats,
  });
}
