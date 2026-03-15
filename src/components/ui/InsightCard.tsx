'use client';

import Link from 'next/link';
import type { Insight } from '@/lib/ai/insights';

const typeStyles: Record<Insight['type'], string> = {
  warning: 'bg-amber-50 border-amber-200',
  suggestion: 'bg-blue-50 border-blue-200',
  info: 'bg-gray-50 border-gray-200',
  success: 'bg-green-50 border-green-200',
};

const iconColors: Record<Insight['type'], string> = {
  warning: 'text-amber-600',
  suggestion: 'text-blue-600',
  info: 'text-gray-500',
  success: 'text-green-600',
};

const titleColors: Record<Insight['type'], string> = {
  warning: 'text-amber-900',
  suggestion: 'text-blue-900',
  info: 'text-gray-800',
  success: 'text-green-900',
};

const descColors: Record<Insight['type'], string> = {
  warning: 'text-amber-700',
  suggestion: 'text-blue-700',
  info: 'text-gray-600',
  success: 'text-green-700',
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className={`rounded-xl border p-3.5 ${typeStyles[insight.type]}`}>
      <div className="flex items-start gap-2.5">
        <svg
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[insight.type]}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={insight.iconPath} />
        </svg>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${titleColors[insight.type]}`}>
            {insight.title}
          </p>
          <p className={`text-sm mt-0.5 ${descColors[insight.type]}`}>
            {insight.description}
          </p>
          {insight.action && (
            <Link
              href={insight.action.href}
              className={`inline-flex items-center gap-1 text-sm font-medium mt-1.5 ${iconColors[insight.type]} hover:underline`}
            >
              {insight.action.label}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
