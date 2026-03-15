'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusSteps } from '@/components/ui/StatusSteps';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useWorkOrder, useUpdateWorkOrderStatus } from '@/hooks/useProduction';
import { formatDate, dDay } from '@/lib/utils';
import type { WorkOrder } from '@/types';

const PROD_STEPS = ['대기', '생산중', '생산완료', '검수완료'];

const NEXT_STATUS: Record<string, WorkOrder['status']> = {
  '대기': '생산중',
  '생산중': '생산완료',
  '생산완료': '검수완료',
};

const ACTION_LABELS: Record<string, string> = {
  '대기': '생산 시작',
  '생산중': '생산 완료',
  '생산완료': '품질 검수 완료',
};

export default function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: wo, isLoading } = useWorkOrder(id);
  const updateStatus = useUpdateWorkOrderStatus();

  const handleStatusUpdate = () => {
    if (!wo) return;
    const nextStatus = NEXT_STATUS[wo.status];
    if (!nextStatus) return;

    const nextProgress = nextStatus === '생산중' ? 10 : nextStatus === '생산완료' ? 100 : 100;

    if (confirm(`상태를 "${nextStatus}"(으)로 변경하시겠습니까?`)) {
      updateStatus.mutate({ id: wo.id, status: nextStatus, progress: nextProgress });
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

  if (!wo) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">생산 요청을 찾을 수 없습니다</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/production')}>
          목록으로
        </Button>
      </div>
    );
  }

  const nextAction = ACTION_LABELS[wo.status];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`생산 상세 - ${wo.orderNo}`}
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push('/production')}>
            목록
          </Button>
        }
      />

      {/* Status Steps */}
      <DataCard>
        <h3 className="text-sm font-medium text-gray-500 mb-3">진행 상태</h3>
        <StatusSteps current={wo.status} steps={PROD_STEPS} />
      </DataCard>

      {/* Info */}
      <DataCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">생산 정보</h3>
          <StatusBadge status={wo.status} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div>
            <p className="text-gray-500">주문번호</p>
            <p className="font-medium text-gray-900">{wo.orderNo}</p>
          </div>
          <div>
            <p className="text-gray-500">고객사</p>
            <p className="font-medium text-gray-900">{wo.customerName}</p>
          </div>
          <div>
            <p className="text-gray-500">모델</p>
            <p className="font-medium text-gray-900">{wo.model}</p>
          </div>
          <div>
            <p className="text-gray-500">수량</p>
            <p className="font-medium text-gray-900">{wo.qty}대</p>
          </div>
          <div>
            <p className="text-gray-500">담당자</p>
            <p className="font-medium text-gray-900">{wo.assignee || '미지정'}</p>
          </div>
          <div>
            <p className="text-gray-500">납기일</p>
            <p className={`font-medium ${dDay(wo.dueDate).startsWith('D+') ? 'text-red-500' : 'text-gray-900'}`}>
              {formatDate(wo.dueDate)} ({dDay(wo.dueDate)})
            </p>
          </div>
          {wo.startDate && (
            <div>
              <p className="text-gray-500">시작일</p>
              <p className="font-medium text-gray-900">{formatDate(wo.startDate)}</p>
            </div>
          )}
          {wo.endDate && (
            <div>
              <p className="text-gray-500">완료일</p>
              <p className="font-medium text-gray-900">{formatDate(wo.endDate)}</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-1">진행률</p>
          <ProgressBar value={wo.progress} size="md" />
        </div>
      </DataCard>

      {/* Actions */}
      {nextAction && (
        <Button
          onClick={handleStatusUpdate}
          disabled={updateStatus.isPending}
          className="w-full"
          size="lg"
        >
          {updateStatus.isPending ? '처리 중...' : nextAction}
        </Button>
      )}
    </div>
  );
}
