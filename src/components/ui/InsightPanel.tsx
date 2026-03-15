'use client';

import { useState } from 'react';
import { useInsights } from '@/hooks/useInsights';
import { InsightCard } from './InsightCard';

interface InsightPanelProps {
  module: string;
  maxItems?: number;
}

export function InsightPanel({ module, maxItems = 3 }: InsightPanelProps) {
  const { data: insights, isLoading } = useInsights(module);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium text-gray-500">AI 인사이트</span>
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-3.5 animate-pulse">
            <div className="flex gap-2.5">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return null;
  }

  const visible = expanded ? insights : insights.slice(0, maxItems);
  const hasMore = insights.length > maxItems;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-sm font-medium text-gray-500">AI 인사이트</span>
        <span className="text-xs text-gray-400">{insights.length}건</span>
      </div>
      {visible.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? '접기' : `더 보기 (${insights.length - maxItems}건)`}
        </button>
      )}
    </div>
  );
}
