'use client';

import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useSalesActivities, useCreateSalesActivity } from '@/hooks/useWevis';
import { formatDate } from '@/lib/utils';
import type { SalesActivityPurpose } from '@/types';

const PURPOSE_OPTIONS: { value: SalesActivityPurpose; label: string }[] = [
  { value: '견적상담', label: '견적상담' },
  { value: '정기방문', label: '정기방문' },
  { value: '불만처리', label: '불만처리' },
  { value: '소개', label: '소개' },
  { value: '기타', label: '기타' },
];

const PURPOSE_COLORS: Record<SalesActivityPurpose, string> = {
  '견적상담': 'bg-blue-50 text-blue-700',
  '정기방문': 'bg-green-50 text-green-700',
  '불만처리': 'bg-red-50 text-red-700',
  '소개': 'bg-purple-50 text-purple-700',
  '기타': 'bg-gray-100 text-gray-600',
};

export default function SalesPage() {
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [purpose, setPurpose] = useState<SalesActivityPurpose>('견적상담');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');

  const { data: activities, isLoading } = useSalesActivities();
  const createMutation = useCreateSalesActivity();

  const resetForm = useCallback(() => {
    setCustomerName('');
    setPurpose('견적상담');
    setContent('');
    setVisitDate(new Date().toISOString().split('T')[0]);
    setNextAction('');
    setNextActionDate('');
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!customerName.trim() || !content.trim()) return;

      createMutation.mutate(
        {
          customerName: customerName.trim(),
          purpose,
          content: content.trim(),
          visitDate,
          nextAction: nextAction.trim() || undefined,
          nextActionDate: nextActionDate || undefined,
        },
        { onSuccess: resetForm }
      );
    },
    [customerName, purpose, content, visitDate, nextAction, nextActionDate, createMutation, resetForm]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="영업활동 기록"
        description="30초 안에 기록 완료"
        action={
          !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              새 기록
            </Button>
          ) : undefined
        }
      />

      {/* Quick Entry Form */}
      {showForm && (
        <DataCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 고객사 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고객사</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="고객사명"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                required
                autoFocus
              />
            </div>

            {/* 방문일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">방문일</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                required
              />
            </div>

            {/* 방문 목적 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">방문 목적</label>
              <div className="flex flex-wrap gap-2">
                {PURPOSE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPurpose(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      purpose === opt.value
                        ? 'bg-[#E1431B] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 핵심 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">핵심 내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="방문/상담 내용을 간단히 기록하세요"
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
                required
              />
            </div>

            {/* 다음 액션 (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">다음 액션</label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="다음 할 일 (선택)"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예정일</label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '저장 중...' : '저장'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                취소
              </Button>
            </div>
          </form>
        </DataCard>
      )}

      {/* Activity List */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">최근 영업활동</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !activities?.length ? (
          <EmptyState
            title="영업활동 기록이 없습니다"
            description="새 기록 버튼을 눌러 첫 영업활동을 기록하세요"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                첫 기록 작성
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <DataCard key={activity.id}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {activity.customerName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        PURPOSE_COLORS[activity.purpose]
                      }`}
                    >
                      {activity.purpose}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(activity.visitDate)}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{activity.content}</p>
                {activity.nextAction && (
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500">
                      다음: {activity.nextAction}
                      {activity.nextActionDate && ` (${formatDate(activity.nextActionDate)})`}
                    </p>
                  </div>
                )}
              </DataCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
