'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getReceivables,
  getPayables,
  getMonthlyOrderTrend,
  getFinanceSummary,
} from '@/lib/api/management';

export function useReceivables() {
  return useQuery({
    queryKey: ['receivables'],
    queryFn: getReceivables,
  });
}

export function usePayables() {
  return useQuery({
    queryKey: ['payables'],
    queryFn: getPayables,
  });
}

export function useMonthlyOrderTrend() {
  return useQuery({
    queryKey: ['dashboard', 'monthlyTrend'],
    queryFn: getMonthlyOrderTrend,
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ['dashboard', 'financeSummary'],
    queryFn: getFinanceSummary,
  });
}
