'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useInstallation,
  useUpdateInstallation,
  useInstallationLifecycle,
  useInspectionRecords,
  usePartsReplacements,
  useAddPartsReplacement,
} from '@/hooks/useInstallations';
import { formatDate, dDay, formatCurrency } from '@/lib/utils';
import type { InstallationStatus } from '@/types';

export default function InstallationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: installation, isLoading } = useInstallation(id);
  const { data: lifecycle, isLoading: lifecycleLoading } = useInstallationLifecycle(id);
  const { data: inspections } = useInspectionRecords(id);
  const { data: replacements } = usePartsReplacements(id);
  const updateInstallation = useUpdateInstallation();
  const addReplacement = useAddPartsReplacement();
  const [showReplacementForm, setShowReplacementForm] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!installation) {
    return <EmptyState title="장비를 찾을 수 없습니다" />;
  }

  const handleStatusChange = (newStatus: InstallationStatus) => {
    updateInstallation.mutate({ id, updates: { status: newStatus } });
  };

  const handleReplacementSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await addReplacement.mutateAsync({
        installationId: id,
        serialNo: installation.serialNo,
        partName: fd.get('partName') as string,
        replacedAt: (fd.get('replacedAt') as string) || new Date().toISOString().split('T')[0],
        reason: (fd.get('reason') as string) || undefined,
        cost: fd.get('cost') ? parseInt(fd.get('cost') as string) : 0,
        note: (fd.get('note') as string) || undefined,
      });
      setShowReplacementForm(false);
    } catch {
      // Error toast handled by hook
    }
  };

  const eventTypeConfig: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
    install: {
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      label: '설치',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    inspection: {
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      label: '점검',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    replacement: {
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      label: '부품교체',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
    cs: {
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      label: 'A/S',
      icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    },
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={installation.serialNo}
        description={`${installation.model} ${installation.capacityKva ? `(${installation.capacityKva}kVA)` : ''}`}
        action={
          <Button variant="secondary" size="sm" onClick={() => router.back()}>
            뒤로
          </Button>
        }
      />

      {/* Status + Customer */}
      <DataCard>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{installation.customerName}</p>
            {installation.siteName && <p className="text-sm text-gray-500">{installation.siteName}</p>}
          </div>
          <StatusBadge status={installation.status} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400">설치일</span>
            <p className="text-gray-900">{installation.installDate ? formatDate(installation.installDate) : '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">설치 위치</span>
            <p className="text-gray-900">{installation.installLocation || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">보증 만료</span>
            <p className="text-gray-900">
              {installation.warrantyExpire ? (
                <>
                  {formatDate(installation.warrantyExpire)}
                  <span className="text-xs text-gray-400 ml-1">({dDay(installation.warrantyExpire)})</span>
                </>
              ) : '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-400">다음 점검</span>
            <p className="text-gray-900">
              {installation.nextInspectDate ? (
                <>
                  {formatDate(installation.nextInspectDate)}
                  <span className="text-xs text-gray-400 ml-1">({dDay(installation.nextInspectDate)})</span>
                </>
              ) : '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-400">점검 주기</span>
            <p className="text-gray-900">{installation.inspectCycleMonths}개월</p>
          </div>
          {installation.note && (
            <div className="col-span-2">
              <span className="text-gray-400">비고</span>
              <p className="text-gray-900">{installation.note}</p>
            </div>
          )}
        </div>
      </DataCard>

      {/* Status Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {installation.status === '정상' && (
          <>
            <Button size="sm" variant="secondary" onClick={() => handleStatusChange('점검필요')}>
              점검 필요 처리
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleStatusChange('고장')}>
              고장 접수
            </Button>
          </>
        )}
        {installation.status === '점검필요' && (
          <>
            <Button size="sm" onClick={() => router.push(`/service/inspect?serial=${installation.serialNo}`)}>
              점검 입력
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleStatusChange('고장')}>
              고장 접수
            </Button>
          </>
        )}
        {installation.status === '고장' && (
          <>
            <Button size="sm" onClick={() => handleStatusChange('정상')}>
              정상 복구
            </Button>
            <Button size="sm" variant="secondary" onClick={() => router.push('/service')}>
              A/S 접수
            </Button>
          </>
        )}
        <Button size="sm" variant="secondary" onClick={() => router.push(`/service/inspect?serial=${installation.serialNo}`)}>
          점검 입력
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowReplacementForm(!showReplacementForm)}>
          부품 교체 등록
        </Button>
      </div>

      {/* Parts Replacement Form */}
      {showReplacementForm && (
        <DataCard className="border-2 border-amber-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">부품 교체 등록</h3>
          <form onSubmit={handleReplacementSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="partName" placeholder="부품명 (필수)" required
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="replacedAt" type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="reason" placeholder="교체 사유"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="cost" type="number" placeholder="비용 (원)"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
            </div>
            <input name="note" placeholder="비고"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={addReplacement.isPending}>
                {addReplacement.isPending ? '등록 중...' : '등록'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowReplacementForm(false)}>
                취소
              </Button>
            </div>
          </form>
        </DataCard>
      )}

      {/* Lifecycle Timeline */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">이력 타임라인</h2>
        {lifecycleLoading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : !lifecycle || lifecycle.length === 0 ? (
          <EmptyState title="이력이 없습니다" />
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {lifecycle.map((event) => {
              const config = eventTypeConfig[event.type] || eventTypeConfig.cs;
              const isExpanded = expandedEvent === event.id;
              return (
                <div key={event.id} className="relative pb-4">
                  <div className={`absolute left-[-15px] top-1 w-5 h-5 rounded-full ${config.color} flex items-center justify-center`}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                    </svg>
                  </div>
                  <button
                    className="ml-4 text-left w-full"
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bgColor}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                      {event.result && <StatusBadge status={event.result} />}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.description}</p>
                    {isExpanded && event.details && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                        {Object.entries(event.details).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-gray-400">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Parts Replacement History */}
      {replacements && replacements.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">부품 교체 이력</h2>
          <DataCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">부품명</th>
                    <th className="pb-2 font-medium">교체일</th>
                    <th className="pb-2 font-medium">사유</th>
                    <th className="pb-2 font-medium text-right">비용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {replacements.map((rep) => (
                    <tr key={rep.id}>
                      <td className="py-2 text-gray-900">{rep.partName}</td>
                      <td className="py-2 text-gray-500">{formatDate(rep.replacedAt)}</td>
                      <td className="py-2 text-gray-500">{rep.reason || '-'}</td>
                      <td className="py-2 text-gray-900 text-right">{rep.cost ? formatCurrency(rep.cost) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataCard>
        </div>
      )}

      {/* Inspection History */}
      {inspections && inspections.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">점검 이력</h2>
          <DataCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">점검일</th>
                    <th className="pb-2 font-medium">유형</th>
                    <th className="pb-2 font-medium">결과</th>
                    <th className="pb-2 font-medium">검사원</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inspections.map((insp) => (
                    <tr key={insp.id}>
                      <td className="py-2 text-gray-900">{formatDate(insp.inspectDate)}</td>
                      <td className="py-2 text-gray-500">{insp.inspectType}</td>
                      <td className="py-2"><StatusBadge status={insp.overallResult} /></td>
                      <td className="py-2 text-gray-500">{insp.inspector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataCard>
        </div>
      )}
    </div>
  );
}
