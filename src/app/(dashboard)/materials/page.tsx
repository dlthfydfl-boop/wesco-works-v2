'use client';

import { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabBar } from '@/components/ui/TabBar';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataCard } from '@/components/ui/DataCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Barcode } from '@/components/ui/Barcode';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { useParts, useBoms, useStockLogs } from '@/hooks/useMaterials';
import { useToastStore } from '@/stores/toast';
import { formatDate } from '@/lib/utils';
import type { Part } from '@/types';

const TABS = ['재고 현황', '입출고', '부품구성표'];

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState('재고 현황');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-4">
      <PageHeader title="자재/재고" />
      <InsightPanel module="materials" />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === '재고 현황' && <StockStatus searchQuery={searchQuery} onSearch={setSearchQuery} />}
      {activeTab === '입출고' && <StockLogs />}
      {activeTab === '부품구성표' && <BomList searchQuery={searchQuery} onSearch={setSearchQuery} />}
    </div>
  );
}

function StockStatus({ searchQuery, onSearch }: { searchQuery: string; onSearch: (q: string) => void }) {
  const { data: parts, isLoading } = useParts();
  const addToast = useToastStore((s) => s.addToast);
  const [showBarcode, setShowBarcode] = useState(false);

  const filtered = useMemo(() => {
    if (!parts) return [];
    if (!searchQuery) return parts;
    const q = searchQuery.toLowerCase();
    return parts.filter(
      (p) => p.partNo.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [parts, searchQuery]);

  const handleExcelDownload = useCallback(() => {
    if (!parts || parts.length === 0) {
      addToast('warning', '내보낼 데이터가 없습니다');
      return;
    }

    import('xlsx').then((XLSX) => {
      const wsData = parts.map((p) => ({
        '부품번호': p.partNo,
        '부품명': p.name,
        '규격': p.spec,
        '단위': p.unit,
        '현재고': p.stockQty,
        '안전재고': p.safetyStock,
        '위치': p.location,
        '단가': p.unitPrice,
        '카테고리': p.category,
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '재고현황');
      XLSX.writeFile(wb, `재고현황_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast('success', '엑셀 파일이 다운로드되었습니다');
    });
  }, [parts, addToast]);

  const handleTemplateDownload = useCallback(() => {
    import('xlsx').then((XLSX) => {
      const wsData = [
        {
          '부품번호': 'PT-0001',
          '부품명': '예시 부품',
          '규격': '100V 50A',
          '단위': 'EA',
          '현재고': 10,
          '안전재고': 5,
          '위치': 'A-01',
          '단가': 15000,
          '카테고리': 'SCR모듈',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '양식');
      XLSX.writeFile(wb, '재고_업로드_양식.xlsx');
      addToast('info', '양식 파일이 다운로드되었습니다');
    });
  }, [addToast]);

  const handleExcelUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        import('xlsx').then((XLSX) => {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws);
          addToast('success', `${rows.length}건의 데이터가 확인되었습니다 (저장 기능은 추후 연동)`);
        });
      } catch {
        addToast('error', '파일 읽기에 실패했습니다');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, [addToast]);

  const handleBarcodeScan = useCallback((value: string) => {
    setShowBarcode(false);
    onSearch(value);
    addToast('info', `스캔: ${value}`);
  }, [onSearch, addToast]);

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
      <div className="flex flex-wrap gap-2 mb-3">
        <Button variant="secondary" size="sm" onClick={handleExcelDownload}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          엑셀 다운로드
        </Button>
        <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 text-sm rounded-xl font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          엑셀 업로드
          <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
        </label>
        <Button variant="ghost" size="sm" onClick={handleTemplateDownload}>
          양식 다운로드
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowBarcode(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          바코드 스캔
        </Button>
      </div>

      <SearchBar placeholder="부품번호 또는 부품명 검색" onSearch={onSearch} />

      {showBarcode && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowBarcode(false)} />
      )}

      {filtered.length === 0 ? (
        <EmptyState title="부품이 없습니다" />
      ) : (
        <div className="space-y-2">
          {filtered.map((part) => (
            <PartCard key={part.id} part={part} />
          ))}
        </div>
      )}
    </>
  );
}

function PartCard({ part }: { part: Part }) {
  const [showBarcode, setShowBarcode] = useState(false);
  const isLow = part.stockQty <= part.safetyStock;

  return (
    <DataCard>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{part.partNo}</p>
            <button
              onClick={() => setShowBarcode(!showBarcode)}
              className="p-1 rounded hover:bg-gray-100"
              title="바코드 보기"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 truncate">{part.name}</p>
          {part.spec && <p className="text-xs text-gray-400">{part.spec}</p>}
        </div>
        <div className="text-right ml-4">
          <p className={`text-lg font-bold ${isLow ? 'text-red-500' : 'text-gray-900'}`}>
            {part.stockQty} {part.unit}
          </p>
          {isLow && <StatusBadge status="부족" />}
          <p className="text-xs text-gray-400 mt-0.5">안전재고: {part.safetyStock}</p>
        </div>
      </div>
      {showBarcode && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
          <Barcode value={part.partNo} height={40} />
        </div>
      )}
    </DataCard>
  );
}

function StockLogs() {
  const { data: logs, isLoading } = useStockLogs(30);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const addToast = useToastStore((s) => s.addToast);

  const handleScan = useCallback((value: string) => {
    setShowScanner(false);
    setScanResult(value);
    addToast('info', `스캔 완료: ${value}`);
  }, [addToast]);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!scanResult) return logs;
    return logs.filter((l) => l.partNo === scanResult || l.partName.includes(scanResult));
  }, [logs, scanResult]);

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
      <div className="flex gap-2 mb-3">
        <Button variant="secondary" size="sm" onClick={() => setShowScanner(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          바코드 스캔
        </Button>
        {scanResult && (
          <Button variant="ghost" size="sm" onClick={() => setScanResult('')}>
            필터 해제
          </Button>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {(!filteredLogs || filteredLogs.length === 0) ? (
        <EmptyState title="입출고 이력이 없습니다" />
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
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
      )}
    </>
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
