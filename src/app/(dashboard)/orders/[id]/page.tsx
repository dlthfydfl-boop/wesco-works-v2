'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusSteps } from '@/components/ui/StatusSteps';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { formatCurrency, formatDate, dDay } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const STATUS_FLOW: Record<string, OrderStatus> = {
  '주문등록': '생산중',
  '생산중': '생산완료',
  '생산완료': '발송준비',
  '발송준비': '발송완료',
  '발송완료': '설치완료',
};

const ACTION_LABELS: Record<string, string> = {
  '주문등록': '생산 요청',
  '생산완료': '발송 준비',
  '발송준비': '발송 완료',
  '발송완료': '설치 완료',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = () => {
    if (!order) return;
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;

    if (confirm(`상태를 "${nextStatus}"(으)로 변경하시겠습니까?`)) {
      updateStatus.mutate({ id: order.id, status: nextStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">주문을 찾을 수 없습니다</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/orders')}>
          목록으로
        </Button>
      </div>
    );
  }

  const nextAction = ACTION_LABELS[order.status];

  return (
    <div className="space-y-4">
      <PageHeader
        title={order.orderNo}
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push('/orders')}>
            목록
          </Button>
        }
      />

      {/* Status Steps */}
      <DataCard>
        <h3 className="text-sm font-medium text-gray-500 mb-3">진행 상태</h3>
        <StatusSteps current={order.status} />
      </DataCard>

      {/* Order Info */}
      <DataCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">주문 정보</h3>
            <StatusBadge status={order.status} size="md" />
          </div>

          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <p className="text-gray-500">고객사</p>
              <p className="font-medium text-gray-900">{order.customerName}</p>
            </div>
            <div>
              <p className="text-gray-500">주문일</p>
              <p className="font-medium text-gray-900">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">납기일</p>
              <p className={`font-medium ${dDay(order.dueDate).startsWith('D+') ? 'text-red-500' : 'text-gray-900'}`}>
                {formatDate(order.dueDate)} ({dDay(order.dueDate)})
              </p>
            </div>
            <div>
              <p className="text-gray-500">총 금액</p>
              <p className="font-semibold text-gray-900 text-lg">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          {order.note && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 text-sm">비고</p>
              <p className="text-sm text-gray-700 mt-0.5">{order.note}</p>
            </div>
          )}
        </div>
      </DataCard>

      {/* Items */}
      <DataCard>
        <h3 className="text-base font-semibold text-gray-900 mb-3">주문 품목</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">모델</th>
                <th className="text-right py-2 text-gray-500 font-medium">수량</th>
                <th className="text-right py-2 text-gray-500 font-medium">단가</th>
                <th className="text-right py-2 text-gray-500 font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5">
                    <p className="font-medium text-gray-900">{item.model}</p>
                    {item.modelName && item.modelName !== item.model && (
                      <p className="text-xs text-gray-400">{item.modelName}</p>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-gray-700">{item.qty}</td>
                  <td className="py-2.5 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="py-2.5 text-right font-semibold text-gray-700">합계</td>
                <td className="py-2.5 text-right font-bold text-lg text-gray-900">{formatCurrency(order.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DataCard>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => window.open(`/print/order/${order.id}`, '_blank')}
          className="flex-1"
        >
          주문서 출력
        </Button>
        {nextAction && (
          <Button
            onClick={handleStatusUpdate}
            disabled={updateStatus.isPending}
            className="flex-1"
          >
            {updateStatus.isPending ? '처리 중...' : nextAction}
          </Button>
        )}
      </div>
    </div>
  );
}
