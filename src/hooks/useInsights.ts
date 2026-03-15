'use client';

import { useQuery } from '@tanstack/react-query';
import { generateInsights } from '@/lib/ai/insights';

export function useInsights(module: string) {
  return useQuery({
    queryKey: ['insights', module],
    queryFn: () => generateInsights(module),
    staleTime: 5 * 60 * 1000,
  });
}
