'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabBar } from '@/components/ui/TabBar';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { useCsTickets, useCreateCsTicket } from '@/hooks/useService';
import {
  useInstallations,
  useInstallationStats,
  useInspectionSchedules,
  useInspectionRecords,
  useAddInstallation,
  useInstallationBySerial,
  useInstallationLifecycle,
} from '@/hooks/useInstallations';
import { useToastStore } from '@/stores/toast';
import { formatDate, dDay } from '@/lib/utils';

const TABS = ['설치 현황', '점검 관리', 'A/S 접수', '장비 이력'];

export default function ServicePage() {
  const [activeTab, setActiveTab] = useState('설치 현황');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showNewInstall, setShowNewInstall] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <PageHeader
        title="설치/A/S"
        action={
          <div className="flex gap-2">
            <Button onClick={() => { setActiveTab('설치 현황'); setShowNewInstall(true); }}>
              설치 등록
            </Button>
            <Button variant="secondary" onClick={() => { setActiveTab('A/S 접수'); setShowNewTicket(true); }}>
              A/S 접수
            </Button>
          </div>
        }
      />
      <InsightPanel module="service" />
      <TabBar tabs={TABS} active={activeTab} onChange={(t) => { setActiveTab(t); setShowNewTicket(false); setShowNewInstall(false); }} />

      {activeTab === '설치 현황' && <InstallationList showNew={showNewInstall} onCloseNew={() => setShowNewInstall(false)} />}
      {activeTab === '점검 관리' && <InspectionManagement router={router} />}
      {activeTab === 'A/S 접수' && <CsTicketList showNew={showNewTicket} onCloseNew={() => setShowNewTicket(false)} />}
      {activeTab === '장비 이력' && <EquipmentHistory />}
    </div>
  );
}

// ============================================================
// Tab 1: 설치 현황 (Installation Master)
// ============================================================

function InstallationList({ showNew, onCloseNew }: { showNew: boolean; onCloseNew: () => void }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('전체');
  const { data: stats, isLoading: statsLoading } = useInstallationStats();
  const { data: installations, isLoading } = useInstallations(
    statusFilter !== '전체' ? { status: statusFilter } : undefined
  );
  const addInstallation = useAddInstallation();

  const handleNewInstall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await addInstallation.mutateAsync({
        serialNo: fd.get('serialNo') as string,
        customerName: fd.get('customerName') as string,
        model: fd.get('model') as string,
        siteName: (fd.get('siteName') as string) || undefined,
        installLocation: (fd.get('installLocation') as string) || undefined,
        capacityKva: fd.get('capacityKva') ? parseInt(fd.get('capacityKva') as string) : undefined,
        installDate: (fd.get('installDate') as string) || undefined,
        warrantyExpire: (fd.get('warrantyExpire') as string) || undefined,
        inspectCycleMonths: fd.get('inspectCycleMonths') ? parseInt(fd.get('inspectCycleMonths') as string) : 6,
        note: (fd.get('note') as string) || undefined,
      });
      onCloseNew();
    } catch {
      // Error toast handled by hook
    }
  };

  return (
    <>
      {/* Summary cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-10" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <SummaryCard
            label="총 설치 대수"
            value={`${stats.total}대`}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <SummaryCard
            label="정상"
            value={`${stats.normal}대`}
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <SummaryCard
            label="점검필요"
            value={`${stats.needsInspection}대`}
            color="amber"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
          />
          <SummaryCard
            label="고장"
            value={`${stats.broken}대`}
            color="red"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />
        </div>
      ) : null}

      {/* New installation form */}
      {showNew && (
        <DataCard className="border-2 border-[#E1431B]/20 mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">설치 등록</h3>
          <form onSubmit={handleNewInstall} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="serialNo" placeholder="시리얼 번호 (필수)" required
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="customerName" placeholder="고객사 (필수)" required
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="model" placeholder="모델명 (필수)" required
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="capacityKva" type="number" placeholder="용량 (kVA)"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="siteName" placeholder="설치 현장명"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="installLocation" placeholder="설치 위치 (예: 2F 전산실)"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="installDate" type="date" placeholder="설치일"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="warrantyExpire" type="date" placeholder="보증 만료일"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select name="inspectCycleMonths" defaultValue="6"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100">
                <option value="3">점검 주기: 3개월</option>
                <option value="6">점검 주기: 6개월</option>
                <option value="12">점검 주기: 12개월</option>
              </select>
              <input name="note" placeholder="비고"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={addInstallation.isPending} size="sm">
                {addInstallation.isPending ? '등록 중...' : '등록'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={onCloseNew}>
                취소
              </Button>
            </div>
          </form>
        </DataCard>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-3">
        {['전체', '정상', '점검필요', '고장'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Installation list */}
      {isLoading ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : !installations || installations.length === 0 ? (
        <EmptyState
          title="등록된 설치 장비가 없습니다"
          description="설치 등록 버튼을 눌러 장비를 등록하세요"
        />
      ) : (
        <div className="space-y-2">
          {installations.map((inst) => (
            <DataCard
              key={inst.id}
              onClick={() => router.push(`/service/installation/${inst.id}`)}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-bold text-gray-900 font-mono">{inst.serialNo}</span>
                <StatusBadge status={inst.status} />
              </div>
              <p className="text-base text-gray-800">{inst.customerName}{inst.siteName ? ` \u2014 ${inst.siteName}` : ''}</p>
              <p className="text-sm text-gray-500">{inst.model}{inst.capacityKva ? ` (${inst.capacityKva}kVA)` : ''}</p>
              {inst.nextInspectDate && (
                <div className="flex items-center gap-1.5 mt-2 text-sm">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400">
                    다음 점검: {formatDate(inst.nextInspectDate)} ({dDay(inst.nextInspectDate)})
                  </span>
                </div>
              )}
            </DataCard>
          ))}
        </div>
      )}
    </>
  );
}

// ============================================================
// Tab 2: 점검 관리
// ============================================================

function InspectionManagement({ router }: { router: ReturnType<typeof useRouter> }) {
  const today = new Date().toISOString().split('T')[0];
  const { data: schedules, isLoading: schedulesLoading } = useInspectionSchedules({ status: '예정' });
  const { data: recentRecords, isLoading: recordsLoading } = useInspectionRecords();

  const overdueSchedules = useMemo(() =>
    (schedules || []).filter((s) => s.scheduledDate < today),
  [schedules, today]);

  const todaySchedules = useMemo(() =>
    (schedules || []).filter((s) => s.scheduledDate === today),
  [schedules, today]);

  const upcomingSchedules = useMemo(() =>
    (schedules || []).filter((s) => s.scheduledDate > today).slice(0, 10),
  [schedules, today]);

  return (
    <div className="space-y-4">
      {/* Action button */}
      <Button className="w-full" onClick={() => router.push('/service/inspect')}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        점검 입력
      </Button>

      {/* Overdue */}
      {overdueSchedules.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            연체 점검 ({overdueSchedules.length}건)
          </h3>
          <div className="space-y-2">
            {overdueSchedules.map((s) => (
              <DataCard key={s.id} className="border-l-4 border-l-red-400">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900 font-mono">{s.serialNo}</span>
                    <p className="text-xs text-red-500 mt-0.5">예정일: {formatDate(s.scheduledDate)} ({dDay(s.scheduledDate)})</p>
                  </div>
                  <Button size="sm" onClick={() => router.push(`/service/inspect?serial=${s.serialNo}`)}>
                    점검
                  </Button>
                </div>
              </DataCard>
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      {todaySchedules.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            오늘 점검 ({todaySchedules.length}건)
          </h3>
          <div className="space-y-2">
            {todaySchedules.map((s) => (
              <DataCard key={s.id} className="border-l-4 border-l-amber-400">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900 font-mono">{s.serialNo}</span>
                    {s.assignedTo && <p className="text-xs text-gray-500 mt-0.5">담당: {s.assignedTo}</p>}
                  </div>
                  <Button size="sm" onClick={() => router.push(`/service/inspect?serial=${s.serialNo}`)}>
                    점검
                  </Button>
                </div>
              </DataCard>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          예정 점검 {schedulesLoading ? '' : `(${(schedules || []).filter((s) => s.scheduledDate > today).length}건)`}
        </h3>
        {schedulesLoading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : upcomingSchedules.length === 0 ? (
          <EmptyState title="예정된 점검이 없습니다" />
        ) : (
          <div className="space-y-2">
            {upcomingSchedules.map((s) => (
              <DataCard key={s.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900 font-mono">{s.serialNo}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.scheduledDate)} ({dDay(s.scheduledDate)})</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              </DataCard>
            ))}
          </div>
        )}
      </div>

      {/* Recent completed inspections */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">최근 점검 이력</h3>
        {recordsLoading ? (
          <div className="space-y-3"><SkeletonCard /></div>
        ) : !recentRecords || recentRecords.length === 0 ? (
          <EmptyState title="점검 이력이 없습니다" />
        ) : (
          <div className="space-y-2">
            {recentRecords.slice(0, 10).map((r) => (
              <DataCard key={r.id}>
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900 font-mono">{r.serialNo}</span>
                  <StatusBadge status={r.overallResult} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span>{formatDate(r.inspectDate)}</span>
                  <span>{r.inspectType}점검</span>
                  <span>검사원: {r.inspector}</span>
                </div>
              </DataCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: A/S 접수
// ============================================================

function CsTicketList({ showNew, onCloseNew }: { showNew: boolean; onCloseNew: () => void }) {
  const [statusFilter, setStatusFilter] = useState('전체');
  const { data: tickets, isLoading } = useCsTickets();
  const createTicket = useCreateCsTicket();
  const addToast = useToastStore((s) => s.addToast);

  const filtered = useMemo(() => {
    if (!tickets) return [];
    if (statusFilter === '전체') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const handleNewTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createTicket.mutateAsync({
        customerName: fd.get('customerName') as string,
        serialNo: fd.get('serialNo') as string,
        model: fd.get('model') as string,
        issueType: fd.get('issueType') as string,
        description: fd.get('description') as string,
        priority: fd.get('priority') as '긴급' | '보통' | '낮음',
      });
      addToast('success', 'A/S가 접수되었습니다');
      onCloseNew();
    } catch {
      addToast('error', '접수에 실패했습니다');
    }
  };

  return (
    <>
      {showNew && (
        <DataCard className="border-2 border-[#E1431B]/20">
          <h3 className="text-base font-semibold text-gray-900 mb-3">A/S 접수</h3>
          <form onSubmit={handleNewTicket} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="customerName" placeholder="고객사" required
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="model" placeholder="모델명" required
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <input name="serialNo" placeholder="시리얼 번호"
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100" />
              <select name="issueType" required
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100">
                <option value="">유형 선택</option>
                <option value="고장">고장</option>
                <option value="점검">점검</option>
                <option value="교체">교체</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <select name="priority" required
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100">
              <option value="보통">우선순위: 보통</option>
              <option value="긴급">우선순위: 긴급</option>
              <option value="낮음">우선순위: 낮음</option>
            </select>
            <textarea name="description" placeholder="상세 내용" rows={3} required
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 resize-none" />
            <div className="flex gap-2">
              <Button type="submit" disabled={createTicket.isPending} size="sm">
                {createTicket.isPending ? '접수 중...' : '접수'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={onCloseNew}>
                취소
              </Button>
            </div>
          </form>
        </DataCard>
      )}

      <div className="flex gap-2 mb-3">
        {['전체', '접수', '처리중', '완료'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="A/S 접수 내역이 없습니다" />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <DataCard key={t.id}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{t.ticketNo}</span>
                  {t.priority === '긴급' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold">긴급</span>
                  )}
                </div>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-base text-gray-800">{t.customerName}</p>
              <p className="text-sm text-gray-500">{t.model} {t.issueType && `/ ${t.issueType}`}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(t.createdAt)}</p>
            </DataCard>
          ))}
        </div>
      )}
    </>
  );
}

// ============================================================
// Tab 4: 장비 이력
// ============================================================

function EquipmentHistory() {
  const [serial, setSerial] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { data: installation, isLoading } = useInstallationBySerial(searchTerm);
  const { data: lifecycle, isLoading: lifecycleLoading } = useInstallationLifecycle(installation?.id || '');

  const handleSearch = () => {
    if (serial.trim()) {
      setSearchTerm(serial.trim());
    }
  };

  const eventTypeConfig: Record<string, { color: string; icon: string }> = {
    install: { color: 'bg-blue-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    inspection: { color: 'bg-green-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    replacement: { color: 'bg-amber-500', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    cs: { color: 'bg-red-500', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="시리얼 번호로 검색"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
          />
        </div>
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {isLoading || lifecycleLoading ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : !searchTerm ? (
        <EmptyState
          title="시리얼 번호를 입력하세요"
          description="장비의 전체 이력을 조회할 수 있습니다"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      ) : !installation ? (
        <EmptyState title="장비를 찾을 수 없습니다" description={`${searchTerm}에 해당하는 장비가 없습니다`} />
      ) : (
        <div className="space-y-4">
          {/* Equipment info */}
          <DataCard>
            <div className="flex items-start justify-between mb-2">
              <span className="text-lg font-bold text-gray-900 font-mono">{installation.serialNo}</span>
              <StatusBadge status={installation.status} size="md" />
            </div>
            <p className="text-base text-gray-800">{installation.customerName}</p>
            <p className="text-sm text-gray-500">{installation.model}{installation.capacityKva ? ` (${installation.capacityKva}kVA)` : ''}</p>
            {installation.installLocation && <p className="text-sm text-gray-400 mt-1">{installation.installLocation}</p>}
          </DataCard>

          {/* Timeline */}
          {lifecycle && lifecycle.length > 0 && (
            <div className="space-y-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">이력 타임라인</h3>
              <div className="relative pl-6">
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
                {lifecycle.map((event) => {
                  const config = eventTypeConfig[event.type] || eventTypeConfig.cs;
                  return (
                    <div key={event.id} className="relative pb-4">
                      <div className={`absolute left-[-15px] top-1 w-5 h-5 rounded-full ${config.color} flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{event.title}</span>
                          {event.result && <StatusBadge status={event.result} />}
                        </div>
                        <p className="text-sm text-gray-500">{event.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
