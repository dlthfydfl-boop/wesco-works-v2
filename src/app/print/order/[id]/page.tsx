'use client';

import { use } from 'react';
import { useOrder } from '@/hooks/useOrders';
import { formatCurrency, formatDate } from '@/lib/utils';

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

export default function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-sm text-red-600">주문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 15mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
        }
        @media screen {
          body {
            background-color: #e5e7eb;
          }
        }
      `}</style>

      {/* Print buttons */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#E1431B] text-white text-sm rounded-xl shadow-lg hover:bg-[#c9391a] transition-colors font-medium"
        >
          인쇄 / PDF 저장
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-xl shadow-lg hover:bg-gray-700 transition-colors font-medium"
        >
          돌아가기
        </button>
      </div>

      {/* A4 Page */}
      <div
        className="print-page"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '20px auto',
          padding: '20mm',
          background: 'white',
          boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
          borderRadius: '4px',
          fontFamily: "'Malgun Gothic','Arial',sans-serif",
          fontSize: '10pt',
          color: '#231815',
          lineHeight: 1.6,
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="http://wescopower.cdn3.cafe24.com/resources/kr/image/common/logo2.png"
              alt="WESCO"
              style={{ height: '40px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <p style={{ fontSize: '14pt', fontWeight: 'bold', color: '#231815', margin: 0 }}>(주)웨스코</p>
              <p style={{ fontSize: '8pt', color: '#505050', margin: 0 }}>WESCO Co., Ltd.</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: '#505050' }}>
            <p style={{ margin: 0 }}>경기도 안양시 만안구 안양로 432</p>
            <p style={{ margin: 0 }}>공장: 경기도 이천시 마장면</p>
            <p style={{ margin: 0 }}>Tel: 031-469-4333 / Fax: 031-469-4334</p>
            <p style={{ margin: 0 }}>www.wesco.co.kr</p>
          </div>
        </div>

        {/* Red line */}
        <div style={{ height: '2px', background: '#E1431B', marginBottom: '10mm' }} />

        {/* Title */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '20pt',
            fontWeight: 'bold',
            color: '#231815',
            margin: '0 0 8mm 0',
            letterSpacing: '8px',
          }}
        >
          주 문 서
        </h1>

        {/* Order info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8mm' }}>
          <table style={{ fontSize: '9pt', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 12px 2px 0', color: '#505050', fontWeight: 'bold' }}>주문번호</td>
                <td style={{ padding: '2px 0' }}>{order.orderNo}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 12px 2px 0', color: '#505050', fontWeight: 'bold' }}>주문일자</td>
                <td style={{ padding: '2px 0' }}>{formatDate(order.orderDate)}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 12px 2px 0', color: '#505050', fontWeight: 'bold' }}>납기일</td>
                <td style={{ padding: '2px 0' }}>{formatDate(order.dueDate)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer info box */}
        <div
          style={{
            border: '1px solid #E1431B',
            borderRadius: '4px',
            padding: '10px 16px',
            marginBottom: '8mm',
            background: '#FFF8F7',
          }}
        >
          <p style={{ fontSize: '9pt', fontWeight: 'bold', color: '#E1431B', margin: '0 0 4px 0' }}>수 신</p>
          <table style={{ fontSize: '9pt', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 12px 2px 0', color: '#505050', width: '70px' }}>고객사</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{order.customerName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Items table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '9pt',
            marginBottom: '6mm',
          }}
        >
          <thead>
            <tr style={{ background: '#E1431B', color: 'white' }}>
              <th style={{ padding: '6px 8px', textAlign: 'center', width: '30px', fontWeight: 'bold' }}>NO</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>품 명</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', width: '50px', fontWeight: 'bold' }}>수량</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', width: '100px', fontWeight: 'bold' }}>단가 (원)</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', width: '110px', fontWeight: 'bold' }}>금액 (원)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '6px 8px' }}>
                  {item.model}
                  {item.modelName && item.modelName !== item.model && (
                    <span style={{ color: '#505050', fontSize: '8pt', marginLeft: '4px' }}>
                      ({item.modelName})
                    </span>
                  )}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.qty}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatNumber(item.unitPrice || 0)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatNumber(item.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #E1431B', background: '#FFF8F7' }}>
              <td colSpan={4} style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '10pt' }}>
                합 계
              </td>
              <td
                style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '10pt',
                  color: '#E1431B',
                }}
              >
                {formatCurrency(order.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        <div style={{ marginBottom: '10mm', fontSize: '9pt' }}>
          <p style={{ fontWeight: 'bold', color: '#505050', marginBottom: '4px' }}>비고</p>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#505050' }}>
            <li>상기 금액은 부가세 별도입니다.</li>
            <li>납기: 수주 후 8~12주 (제품 사양에 따라 상이)</li>
            <li>설치비 별도</li>
            {order.note && <li>{order.note}</li>}
          </ul>
        </div>

        {/* Separator */}
        <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '8mm' }} />

        {/* Signature block */}
        <div style={{ fontSize: '9pt', marginBottom: '10mm' }}>
          <p style={{ fontWeight: 'bold', color: '#231815', marginBottom: '4px' }}>(주)웨스코 사업개발본부</p>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '1px 12px 1px 0', color: '#505050' }}>담당</td>
                <td style={{ padding: '1px 0' }}>한상현 이사</td>
              </tr>
              <tr>
                <td style={{ padding: '1px 12px 1px 0', color: '#505050' }}>TEL</td>
                <td style={{ padding: '1px 0' }}>031-469-4333</td>
              </tr>
              <tr>
                <td style={{ padding: '1px 12px 1px 0', color: '#505050' }}>Email</td>
                <td style={{ padding: '1px 0' }}>sh.han@wesco.co.kr</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature area */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15mm' }}>
          <div style={{ textAlign: 'center', width: '120px' }}>
            <div style={{ borderBottom: '1px solid #231815', height: '40px', marginBottom: '4px' }} />
            <p style={{ fontSize: '8pt', color: '#505050', margin: 0 }}>담당자 서명</p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '15mm',
            left: '20mm',
            right: '20mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '7pt',
            color: '#999',
            borderTop: '1px solid #E1431B',
            paddingTop: '4px',
          }}
        >
          <span>Smart POWER Vaccine{'\u00AE'} | WESCO Co., Ltd.</span>
          <span>Confidential</span>
        </div>
      </div>
    </>
  );
}
