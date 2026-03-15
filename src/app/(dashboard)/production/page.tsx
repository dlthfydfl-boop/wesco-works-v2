'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { TabBar } from '@/components/ui/TabBar';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useWorkOrders, useProductionStats } from '@/hooks/useProduction';
import { dDay } from '@/lib/utils';

const STATUS_TABS = ['전체', '대기', '생산중', '생산완료', '검수완료'];

export default function ProductionPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('전체');
  const { data: workOrders, isLoading } = useWorkOrders();
  const stats = useProductionStats();

  const filtered = useMemo(() => {
    if (!workOrders) return [];
    if (statusFilter === '전체') return workOrders;
    return workOrders.filter((w) => w.status === statusFilter);
  }, [workOrders, statusFilter]);

  return (
    <div className="space-y-4">
      <PageHeader title="생산관리" />

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="진행중"
          value={`${stats.data?.inProgress || 0}건`}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <SummaryCard
          label="대기"
          value={`${stats.data?.waiting || 0}건`}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          label="완료"
          value={`${stats.data?.completed || 0}건`}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <TabBar tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="생산 요청이 없습니다"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((wo) => (
            <DataCard
              key={wo.id}
              onClick={() => router.push(`/production/${wo.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{wo.orderNo}</span>
                <StatusBadge status={wo.status} />
              </div>
              <p className="text-base text-gray-800 mb-1">
                {wo.customerName} — {wo.model} x {wo.qty}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>담당: {wo.assignee || '미지정'}</span>
                <span>납기 {dDay(wo.dueDate)}</span>
              </div>
              <ProgressBar value={wo.progress} />
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}
