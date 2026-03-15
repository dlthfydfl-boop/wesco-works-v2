'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabBar } from '@/components/ui/TabBar';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataCard } from '@/components/ui/DataCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useParts, useBoms, useStockLogs } from '@/hooks/useMaterials';
import { formatDate } from '@/lib/utils';

const TABS = ['재고 현황', '입출고', '부품구성표'];

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState('재고 현황');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-4">
      <PageHeader title="자재/재고" />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === '재고 현황' && <StockStatus searchQuery={searchQuery} onSearch={setSearchQuery} />}
      {activeTab === '입출고' && <StockLogs />}
      {activeTab === '부품구성표' && <BomList searchQuery={searchQuery} onSearch={setSearchQuery} />}
    </div>
  );
}

function StockStatus({ searchQuery, onSearch }: { searchQuery: string; onSearch: (q: string) => void }) {
  const { data: parts, isLoading } = useParts();

  const filtered = useMemo(() => {
    if (!parts) return [];
    if (!searchQuery) return parts;
    const q = searchQuery.toLowerCase();
    return parts.filter(
      (p) => p.partNo.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [parts, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <>
      <SearchBar placeholder="부품번호 또는 부품명 검색" onSearch={onSearch} />
      {filtered.length === 0 ? (
        <EmptyState title="부품이 없습니다" />
      ) : (
        <div className="space-y-2">
          {filtered.map((part) => {
            const isLow = part.stockQty <= part.safetyStock;
            return (
              <DataCard key={part.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{part.partNo}</p>
                    <p className="text-sm text-gray-600 truncate">{part.name}</p>
                    {part.spec && <p className="text-xs text-gray-400">{part.spec}</p>}
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${isLow ? 'text-red-500' : 'text-gray-900'}`}>
                      {part.stockQty} {part.unit}
                    </p>
                    {isLow && (
                      <StatusBadge status="부족" />
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      안전재고: {part.safetyStock}
                    </p>
                  </div>
                </div>
              </DataCard>
            );
          })}
        </div>
      )}
    </>
  );
}

function StockLogs() {
  const { data: logs, isLoading } = useStockLogs(30);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return <EmptyState title="입출고 이력이 없습니다" />;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <DataCard key={log.id}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    log.type === '입고'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {log.type}
                </span>
                <span className="text-sm font-semibold text-gray-900">{log.partNo}</span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{log.partName}</p>
              {log.reason && <p className="text-xs text-gray-400">{log.reason}</p>}
            </div>
            <div className="text-right ml-4">
              <p className={`text-base font-bold ${log.type === '입고' ? 'text-blue-600' : 'text-orange-600'}`}>
                {log.type === '입고' ? '+' : '-'}{log.qty}
              </p>
              <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
            </div>
          </div>
        </DataCard>
      ))}
    </div>
  );
}

function BomList({ searchQuery, onSearch }: { searchQuery: string; onSearch: (q: string) => void }) {
  const { data: boms, isLoading } = useBoms();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!boms) return [];
    if (!searchQuery) return boms;
    const q = searchQuery.toLowerCase();
    return boms.filter(
      (b) => b.model.toLowerCase().includes(q) || b.modelName.toLowerCase().includes(q)
    );
  }, [boms, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <>
      <SearchBar placeholder="모델명 검색" onSearch={onSearch} />
      {filtered.length === 0 ? (
        <EmptyState title="부품구성표가 없습니다" />
      ) : (
        <div className="space-y-2">
          {filtered.map((bom) => (
            <DataCard key={bom.id}>
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === bom.id ? null : bom.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{bom.model}</p>
                    {bom.modelName !== bom.model && (
                      <p className="text-sm text-gray-500">{bom.modelName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{bom.parts.length}개 부품</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedId === bom.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {expandedId === bom.id && bom.parts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left py-1 font-medium">부품번호</th>
                        <th className="text-left py-1 font-medium">부품명</th>
                        <th className="text-right py-1 font-medium">수량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bom.parts.map((part, i) => (
                        <tr key={i} className="border-t border-gray-50">
                          <td className="py-1.5 text-gray-700">{part.partNo}</td>
                          <td className="py-1.5 text-gray-700">{part.partName}</td>
                          <td className="py-1.5 text-right text-gray-700">{part.qty} {part.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DataCard>
          ))}
        </div>
      )}
    </>
  );
}
