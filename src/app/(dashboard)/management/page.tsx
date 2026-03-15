'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { DataCard } from '@/components/ui/DataCard';
import { SkeletonSummary, SkeletonCard } from '@/components/ui/SkeletonCard';
import { useOrderStats } from '@/hooks/useOrders';
import { useFinanceSummary, useMonthlyOrderTrend, useReceivables, usePayables } from '@/hooks/useManagement';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { formatWon, formatCurrency, formatDate } from '@/lib/utils';
import { MonthlyChart } from '../home/MonthlyChart';

export default function ManagementPage() {
  const orderStats = useOrderStats();
  const financeSummary = useFinanceSummary();
  const monthlyTrend = useMonthlyOrderTrend();
  const receivables = useReceivables();
  const payables = usePayables();

  const isLoading = orderStats.isLoading || financeSummary.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="경영현황" />

      <InsightPanel module="management" />

      {/* KPI Row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonSummary />
          <SkeletonSummary />
          <SkeletonSummary />
          <SkeletonSummary />
        </div>
      ) : (
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
            label="총 주문 건수"
            value={`${orderStats.data?.totalOrders || 0}건`}
            color="purple"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
            label="미수금"
            value={formatWon(financeSummary.data?.totalReceivable || 0)}
            color="red"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Monthly Chart */}
      <DataCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">월별 주문 추이</h2>
        <MonthlyChart data={monthlyTrend.data || []} isLoading={monthlyTrend.isLoading} />
      </DataCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Receivables */}
        <DataCard>
          <h3 className="text-base font-semibold text-gray-900 mb-3">매출채권 (미수금)</h3>
          {receivables.isLoading ? (
            <SkeletonCard />
          ) : !receivables.data || receivables.data.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">매출채권 데이터가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {receivables.data
                .filter((r) => r.status !== '수금완료')
                .slice(0, 5)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.customerName}</p>
                      <p className="text-xs text-gray-400">{r.orderNo} / 만기: {formatDate(r.dueDate)}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">
                      {formatCurrency(r.amount - r.paidAmount)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </DataCard>

        {/* Payables */}
        <DataCard>
          <h3 className="text-base font-semibold text-gray-900 mb-3">매입채무</h3>
          {payables.isLoading ? (
            <SkeletonCard />
          ) : !payables.data || payables.data.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">매입채무 데이터가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {payables.data
                .filter((p) => p.status !== '지급완료')
                .slice(0, 5)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.supplierName}</p>
                      <p className="text-xs text-gray-400">{p.description} / 만기: {formatDate(p.dueDate)}</p>
                    </div>
                    <p className="text-sm font-semibold text-orange-600">
                      {formatCurrency(p.amount - p.paidAmount)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </DataCard>
      </div>
    </div>
  );
}
