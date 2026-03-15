'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { DataCard } from '@/components/ui/DataCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useInstallationBySerial, useAddInspectionRecord } from '@/hooks/useInstallations';
import type { CheckItem, InspectResult, InspectType } from '@/types';

// Default TSP inspection checklist
const DEFAULT_CHECK_ITEMS: { category: string; items: string[] }[] = [
  {
    category: '외관 점검',
    items: ['외함 상태', '표시창/LED 상태', '배선 상태', '접지선 상태'],
  },
  {
    category: '전기 점검',
    items: ['충전전압 확인', '절체 동작 테스트', '절연저항 측정', '보호 계전기 동작'],
  },
  {
    category: '기계 점검',
    items: ['냉각팬 동작', '필터 상태', '볼트 체결 상태', '방진 패드 상태'],
  },
  {
    category: '커패시터 점검',
    items: ['커패시터 용량 확인', '커패시터 외관', '커패시터 발열'],
  },
];

function InspectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSerial = searchParams.get('serial') || '';

  const [serialInput, setSerialInput] = useState(initialSerial);
  const [searchSerial, setSearchSerial] = useState(initialSerial);
  const [showScanner, setShowScanner] = useState(false);

  const { data: installation, isLoading } = useInstallationBySerial(searchSerial);
  const addInspection = useAddInspectionRecord();

  // Form state
  const [inspectType, setInspectType] = useState<InspectType>('정기');
  const [inspector, setInspector] = useState('');
  const [checkResults, setCheckResults] = useState<Map<string, InspectResult>>(new Map());
  const [checkNotes, setCheckNotes] = useState<Map<string, string>>(new Map());
  const [measuredValues, setMeasuredValues] = useState<Record<string, string>>({});
  const [actionTaken, setActionTaken] = useState('');
  const [note, setNote] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleScan = useCallback((value: string) => {
    setSerialInput(value);
    setSearchSerial(value);
    setShowScanner(false);
  }, []);

  const handleSearch = () => {
    if (serialInput.trim()) {
      setSearchSerial(serialInput.trim());
    }
  };

  const setCheckResult = (itemName: string, result: InspectResult) => {
    setCheckResults((prev) => {
      const next = new Map(prev);
      next.set(itemName, result);
      return next;
    });
  };

  const setCheckNote = (itemName: string, noteVal: string) => {
    setCheckNotes((prev) => {
      const next = new Map(prev);
      next.set(itemName, noteVal);
      return next;
    });
  };

  const getOverallResult = (): InspectResult => {
    const results = Array.from(checkResults.values());
    if (results.includes('불량')) return '불량';
    if (results.includes('주의')) return '주의';
    return '정상';
  };

  const handleSubmit = async () => {
    if (!installation || !inspector.trim()) return;

    setSubmitting(true);
    try {
      // Build check items
      const items: CheckItem[] = [];
      for (const category of DEFAULT_CHECK_ITEMS) {
        for (const itemName of category.items) {
          items.push({
            name: itemName,
            result: checkResults.get(itemName) || '정상',
            note: checkNotes.get(itemName) || undefined,
          });
        }
      }

      const overallResult = getOverallResult();

      await addInspection.mutateAsync({
        installationId: installation.id,
        serialNo: installation.serialNo,
        inspectDate: new Date().toISOString().split('T')[0],
        inspectType: inspectType,
        inspector: inspector.trim(),
        checkItems: items,
        measuredValues: measuredValues,
        overallResult,
        actionTaken: actionTaken || undefined,
        signatureUrl: signatureUrl || undefined,
        note: note || undefined,
      });

      // If result is 불량, offer to create A/S ticket
      if (overallResult === '불량') {
        const shouldCreateTicket = confirm('불량 판정입니다. A/S 접수를 하시겠습니까?');
        if (shouldCreateTicket) {
          router.push('/service');
          return;
        }
      }

      router.push('/service');
    } catch {
      // Error toast handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const resultButtons: { value: InspectResult; label: string; activeClass: string }[] = [
    { value: '정상', label: '정상', activeClass: 'bg-green-500 text-white border-green-500' },
    { value: '주의', label: '주의', activeClass: 'bg-amber-500 text-white border-amber-500' },
    { value: '불량', label: '불량', activeClass: 'bg-red-500 text-white border-red-500' },
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">점검 입력</h1>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          취소
        </Button>
      </div>

      {/* Scanner / Search */}
      {!installation && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="시리얼 번호 입력"
                className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>
            <Button onClick={handleSearch}>검색</Button>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowScanner(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QR/바코드 스캔
          </Button>

          {isLoading && <SkeletonCard />}
          {searchSerial && !isLoading && !installation && (
            <div className="p-4 bg-red-50 rounded-xl text-sm text-red-600 text-center">
              장비를 찾을 수 없습니다: {searchSerial}
            </div>
          )}
        </div>
      )}

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Equipment Info */}
      {installation && (
        <>
          <DataCard className="border-l-4 border-l-[#E1431B]">
            <div className="flex items-start justify-between mb-1">
              <span className="text-lg font-bold text-gray-900 font-mono">{installation.serialNo}</span>
              <StatusBadge status={installation.status} />
            </div>
            <p className="text-base text-gray-800">{installation.customerName}</p>
            <p className="text-sm text-gray-500">
              {installation.model}{installation.capacityKva ? ` (${installation.capacityKva}kVA)` : ''}
            </p>
            {installation.installLocation && (
              <p className="text-sm text-gray-400 mt-0.5">{installation.installLocation}</p>
            )}
            <button
              onClick={() => { setSearchSerial(''); setSerialInput(''); }}
              className="text-xs text-[#E1431B] mt-2"
            >
              다른 장비 선택
            </button>
          </DataCard>

          {/* Inspection Type + Inspector */}
          <DataCard>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">점검 유형</label>
                <div className="flex gap-2">
                  {(['정기', '긴급', '설치후'] as InspectType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setInspectType(type)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                        inspectType === type
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">검사원</label>
                <input
                  type="text"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="검사원 이름"
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </DataCard>

          {/* Inspection Checklist */}
          {DEFAULT_CHECK_ITEMS.map((category) => (
            <DataCard key={category.category}>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{category.category}</h3>
              <div className="space-y-3">
                {category.items.map((itemName) => {
                  const currentResult = checkResults.get(itemName);
                  return (
                    <div key={itemName} className="space-y-1.5">
                      <p className="text-sm text-gray-700">{itemName}</p>
                      <div className="flex gap-2">
                        {resultButtons.map((btn) => (
                          <button
                            key={btn.value}
                            onClick={() => setCheckResult(itemName, btn.value)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors min-h-[44px] ${
                              currentResult === btn.value
                                ? btn.activeClass
                                : 'border-gray-200 text-gray-500 bg-white'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                      {(currentResult === '주의' || currentResult === '불량') && (
                        <input
                          type="text"
                          placeholder="상세 내용 입력"
                          value={checkNotes.get(itemName) || ''}
                          onChange={(e) => setCheckNote(itemName, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </DataCard>
          ))}

          {/* Measured Values */}
          <DataCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">측정값 (선택)</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-28 flex-shrink-0">충전전압 (VDC)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={measuredValues.chargingVoltage || ''}
                  onChange={(e) => setMeasuredValues({ ...measuredValues, chargingVoltage: e.target.value })}
                  placeholder="예: 750"
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-28 flex-shrink-0">절체시간 (ms)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={measuredValues.transferTime || ''}
                  onChange={(e) => setMeasuredValues({ ...measuredValues, transferTime: e.target.value })}
                  placeholder="예: 1.5"
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-28 flex-shrink-0">절연저항 (G&#8486;)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={measuredValues.insulationResistance || ''}
                  onChange={(e) => setMeasuredValues({ ...measuredValues, insulationResistance: e.target.value })}
                  placeholder="예: 100"
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </DataCard>

          {/* Action taken */}
          <DataCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">조치사항</h3>
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="조치사항을 입력하세요"
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
            />
          </DataCard>

          {/* Photo */}
          <DataCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">사진 촬영</h3>
            <div className="flex flex-wrap gap-3">
              {photoFiles.map((file, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`photo-${i}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors min-h-[44px]">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] text-gray-400 mt-0.5">촬영</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPhotoFiles((prev) => [...prev, file]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </DataCard>

          {/* Signature */}
          <DataCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">고객 서명</h3>
            <SignaturePad
              onChange={(url) => setSignatureUrl(url)}
              width={Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 80 : 320)}
              height={150}
            />
          </DataCard>

          {/* Note */}
          <DataCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">비고</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="추가 메모"
              rows={2}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
            />
          </DataCard>

          {/* Overall result preview */}
          <DataCard>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">종합 판정</span>
              <StatusBadge status={getOverallResult()} size="md" />
            </div>
          </DataCard>

          {/* Submit button */}
          <Button
            className="w-full min-h-[56px] text-lg"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !inspector.trim()}
          >
            {submitting ? '등록 중...' : '점검 완료 등록'}
          </Button>
        </>
      )}
    </div>
  );
}

export default function InspectPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <InspectPageContent />
    </Suspense>
  );
}
