'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabBar } from '@/components/ui/TabBar';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useOrders } from '@/hooks/useOrders';
import { formatCurrency, dDay } from '@/lib/utils';

const STATUS_TABS = ['전체', '주문등록', '생산중', '발송준비', '완료'];

export default function OrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: orders, isLoading } = useOrders();

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = orders;

    if (statusFilter !== '전체') {
      if (statusFilter === '완료') {
        result = result.filter((o) => o.status === '발송완료' || o.status === '설치완료');
      } else {
        result = result.filter((o) => o.status === statusFilter);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="주문관리"
        action={
          <Button onClick={() => router.push('/orders/new')}>
            주문 등록
          </Button>
        }
      />

      <SearchBar
        placeholder="주문번호 또는 고객사 검색"
        onSearch={setSearchQuery}
      />

      <TabBar tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="주문이 없습니다"
          description="새로운 주문을 등록해 보세요"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          action={
            <Button size="sm" onClick={() => router.push('/orders/new')}>
              주문 등록
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <DataCard
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  {order.orderNo}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-base font-medium text-gray-800 mb-1">
                {order.customerName}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                {order.items.map((item) => `${item.model} x ${item.qty}`).join(', ')}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </span>
                <span
                  className={`${
                    dDay(order.dueDate).startsWith('D+')
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  납기 {dDay(order.dueDate)}
                </span>
              </div>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}
