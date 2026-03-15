'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabBar } from '@/components/ui/TabBar';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useCsTickets, useDeliveries, useCreateCsTicket } from '@/hooks/useService';
import { formatDate } from '@/lib/utils';

const TABS = ['설치 현황', 'A/S 접수', '장비 이력'];

export default function ServicePage() {
  const [activeTab, setActiveTab] = useState('설치 현황');
  const [showNewTicket, setShowNewTicket] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title="설치/A/S"
        action={
          <Button onClick={() => { setActiveTab('A/S 접수'); setShowNewTicket(true); }}>
            A/S 접수
          </Button>
        }
      />
      <TabBar tabs={TABS} active={activeTab} onChange={(t) => { setActiveTab(t); setShowNewTicket(false); }} />

      {activeTab === '설치 현황' && <DeliveryList />}
      {activeTab === 'A/S 접수' && <CsTicketList showNew={showNewTicket} onCloseNew={() => setShowNewTicket(false)} />}
      {activeTab === '장비 이력' && <EquipmentHistory />}
    </div>
  );
}

function DeliveryList() {
  const { data: deliveries, isLoading } = useDeliveries();

  if (isLoading) {
    return <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>;
  }

  if (!deliveries || deliveries.length === 0) {
    return <EmptyState title="설치 현황이 없습니다" />;
  }

  return (
    <div className="space-y-2">
      {deliveries.map((d) => (
        <DataCard key={d.id}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">{d.orderNo}</span>
            <StatusBadge status={d.status} />
          </div>
          <p className="text-base text-gray-800">{d.customerName}</p>
          <p className="text-sm text-gray-500">{d.model} x {d.qty}</p>
          <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
            <span>발송: {d.shipDate ? formatDate(d.shipDate) : '-'}</span>
            <span>설치: {d.installDate ? formatDate(d.installDate) : '-'}</span>
          </div>
        </DataCard>
      ))}
    </div>
  );
}

function CsTicketList({ showNew, onCloseNew }: { showNew: boolean; onCloseNew: () => void }) {
  const [statusFilter, setStatusFilter] = useState('전체');
  const { data: tickets, isLoading } = useCsTickets();
  const createTicket = useCreateCsTicket();

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
      onCloseNew();
    } catch {
      alert('접수에 실패했습니다');
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

function EquipmentHistory() {
  const [serial, setSerial] = useState('');

  return (
    <div>
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="시리얼 번호로 검색"
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
        />
      </div>
      <EmptyState
        title="시리얼 번호를 입력하세요"
        description="장비의 전체 이력을 조회할 수 있습니다"
        icon={
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
    </div>
  );
}
