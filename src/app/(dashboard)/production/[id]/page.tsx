'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusSteps } from '@/components/ui/StatusSteps';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Barcode } from '@/components/ui/Barcode';
import { useWorkOrder, useUpdateWorkOrderStatus } from '@/hooks/useProduction';
import { useToastStore } from '@/stores/toast';
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

const INSPECTION_ITEMS = [
  '외관 검사 (스크래치, 변형)',
  '도장 상태 확인',
  '볼트/너트 체결 상태',
  '전원 투입 테스트',
  '전압 출력 확인',
  '전류 출력 확인',
  '바이패스 동작 확인',
  '보호 기능 동작 확인',
  '경보 출력 확인',
  '통신 연결 확인 (RS-485)',
  '디스플레이 표시 확인',
  '냉각팬 동작 확인',
  'SCR 모듈 동작 확인',
  '컨택터 동작 확인',
  '변압기 절연저항 측정',
  '접지 저항 측정',
  '내전압 시험',
  '온도 센서 동작',
  '전자파 차폐 확인',
  '케이블 결선 상태',
  '정격 용량 부하 시험',
  '효율 측정',
  '소음/진동 확인',
  'UPS 모드 전환 시험',
  '배터리 충방전 시험',
  '과부하 보호 시험',
  '단락 보호 시험',
  '역전력 보호 시험',
  '직렬 운전 확인',
  '명판 부착 확인',
  '사용자 매뉴얼 동봉',
  '포장 상태 확인',
  '최종 외관 확인',
];

function generateSerialNumber(model: string, index: number): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const modelCode = model.replace(/[^0-9]/g, '').slice(0, 6) || '000000';
  return `WT${year}-${modelCode}-${String(index + 1).padStart(3, '0')}`;
}

export default function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: wo, isLoading } = useWorkOrder(id);
  const updateStatus = useUpdateWorkOrderStatus();
  const addToast = useToastStore((s) => s.addToast);

  // Inspection state
  const [inspectionResults, setInspectionResults] = useState<Record<number, boolean | null>>({});
  const [showInspection, setShowInspection] = useState(false);

  const handleStatusUpdate = () => {
    if (!wo) return;
    const nextStatus = NEXT_STATUS[wo.status];
    if (!nextStatus) return;

    const nextProgress = nextStatus === '생산중' ? 10 : nextStatus === '생산완료' ? 100 : 100;

    if (confirm(`상태를 "${nextStatus}"(으)로 변경하시겠습니까?`)) {
      updateStatus.mutate(
        { id: wo.id, status: nextStatus, progress: nextProgress },
        {
          onSuccess: () => addToast('success', `상태가 "${nextStatus}"(으)로 변경되었습니다`),
          onError: () => addToast('error', '상태 변경에 실패했습니다'),
        }
      );
    }
  };

  const toggleInspection = (index: number) => {
    setInspectionResults((prev) => {
      const current = prev[index];
      if (current === undefined || current === null) return { ...prev, [index]: true };
      if (current === true) return { ...prev, [index]: false };
      return { ...prev, [index]: null };
    });
  };

  const inspectedCount = Object.values(inspectionResults).filter((v) => v !== null && v !== undefined).length;
  const passCount = Object.values(inspectionResults).filter((v) => v === true).length;
  const failCount = Object.values(inspectionResults).filter((v) => v === false).length;
  const allInspected = inspectedCount === INSPECTION_ITEMS.length;
  const inspectionPassed = allInspected && failCount === 0;

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
  const serialNumbers = Array.from({ length: wo.qty }, (_, i) => generateSerialNumber(wo.model, i));

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

      {/* Serial Numbers */}
      {(wo.status === '생산완료' || wo.status === '검수완료' || wo.status === '생산중') && (
        <DataCard>
          <h3 className="text-base font-semibold text-gray-900 mb-3">시리얼 번호</h3>
          <div className="space-y-3">
            {serialNumbers.map((serial, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">{serial}</p>
                  <p className="text-xs text-gray-500">#{i + 1} / {wo.qty}대</p>
                </div>
                <Barcode value={serial} width={1.2} height={30} showText={false} />
              </div>
            ))}
          </div>
        </DataCard>
      )}

      {/* Quality Inspection */}
      {(wo.status === '생산완료' || wo.status === '검수완료') && (
        <DataCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">품질 검수</h3>
            <button
              onClick={() => setShowInspection(!showInspection)}
              className="text-sm font-medium text-[#E1431B]"
            >
              {showInspection ? '접기' : '검수 시작'}
            </button>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm mb-3">
            <span className="text-gray-500">
              검사 {inspectedCount}/{INSPECTION_ITEMS.length}
            </span>
            {inspectedCount > 0 && (
              <>
                <span className="text-green-600 font-medium">합격 {passCount}</span>
                {failCount > 0 && (
                  <span className="text-red-600 font-medium">불합격 {failCount}</span>
                )}
              </>
            )}
            {allInspected && (
              <StatusBadge status={inspectionPassed ? '합격' : '불합격'} size="md" />
            )}
          </div>

          {showInspection && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-100">
              {INSPECTION_ITEMS.map((item, idx) => {
                const result = inspectionResults[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => toggleInspection(idx)}
                    className="flex items-center gap-3 w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                        result === true
                          ? 'bg-green-500 border-green-500'
                          : result === false
                          ? 'bg-red-500 border-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {result === true && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {result === false && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      result === true
                        ? 'text-green-700'
                        : result === false
                        ? 'text-red-700'
                        : 'text-gray-700'
                    }`}>
                      {idx + 1}. {item}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </DataCard>
      )}

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
