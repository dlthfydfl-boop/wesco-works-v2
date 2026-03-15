'use client';

import { useRouter } from 'next/navigation';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { DataCard } from '@/components/ui/DataCard';
import { Button } from '@/components/ui/Button';
import { SkeletonSummary } from '@/components/ui/SkeletonCard';
import { useOrderStats } from '@/hooks/useOrders';
import { useProductionStats } from '@/hooks/useProduction';
import { useServiceStats } from '@/hooks/useService';
import { useMaterialStats } from '@/hooks/useMaterials';
import { useFinanceSummary, useMonthlyOrderTrend } from '@/hooks/useManagement';
import { formatWon } from '@/lib/utils';
import { MonthlyChart } from './MonthlyChart';

export default function HomePage() {
  const router = useRouter();
  const orderStats = useOrderStats();
  const productionStats = useProductionStats();
  const serviceStats = useServiceStats();
  const materialStats = useMaterialStats();
  const financeSummary = useFinanceSummary();
  const monthlyTrend = useMonthlyOrderTrend();

  const isLoading = orderStats.isLoading || productionStats.isLoading || serviceStats.isLoading;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">현황판</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>

      {/* Today's Tasks */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">오늘 할 일</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SkeletonSummary />
            <SkeletonSummary />
            <SkeletonSummary />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard
              label="신규 주문"
              value={`${orderStats.data?.newOrders || 0}건`}
              color="blue"
              onClick={() => router.push('/orders')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <SummaryCard
              label="생산 진행"
              value={`${productionStats.data?.inProgress || 0}건`}
              color="amber"
              onClick={() => router.push('/production')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
            />
            <SummaryCard
              label="A/S 대기"
              value={`${serviceStats.data?.pendingCount || 0}건`}
              color="red"
              onClick={() => router.push('/service')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">주요 지표</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="이번달 주문액"
            value={formatWon(orderStats.data?.monthlyAmount || 0)}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <SummaryCard
            label="납기 준수율"
            value="94%"
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <SummaryCard
            label="재고 부족 품목"
            value={`${materialStats.data?.lowStockCount || 0}건`}
            color={materialStats.data?.lowStockCount ? 'amber' : 'green'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <SummaryCard
            label="미수금"
            value={formatWon(financeSummary.data?.totalReceivable || 0)}
            color={financeSummary.data?.totalReceivable ? 'red' : 'gray'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Monthly Chart */}
      <DataCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">월별 주문 추이</h2>
        <MonthlyChart data={monthlyTrend.data || []} isLoading={monthlyTrend.isLoading} />
      </DataCard>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">빠른 실행</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push('/orders/new')}>
            주문 등록
          </Button>
          <Button variant="secondary" onClick={() => router.push('/service')}>
            A/S 접수
          </Button>
          <Button variant="secondary" onClick={() => router.push('/materials')}>
            자재 확인
          </Button>
        </div>
      </div>
    </div>
  );
}
