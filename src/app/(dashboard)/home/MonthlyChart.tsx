'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyOrderData } from '@/types';

interface MonthlyChartProps {
  data: MonthlyOrderData[];
  isLoading: boolean;
}

export function MonthlyChart({ data, isLoading }: MonthlyChartProps) {
  if (isLoading) {
    return <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-400">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => {
              if (v >= 100000000) return `${(v / 100000000).toFixed(0)}억`;
              if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
              return String(v);
            }}
          />
          <Tooltip
            formatter={(value) => [`₩${Number(value).toLocaleString('ko-KR')}`, '주문액']}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              fontSize: 13,
            }}
          />
          <Bar dataKey="amount" fill="#E1431B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
