/** Format number as Korean Won */
export function formatWon(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = amount / 100_000_000;
    return `${eok % 1 === 0 ? eok.toFixed(0) : eok.toFixed(1)}억원`;
  }
  if (amount >= 10_000) {
    const man = amount / 10_000;
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(0)}만원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** Format number with commas and Won symbol */
export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/** Calculate D-day from due date */
export function dDay(dueDate: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/** Format date as YYYY-MM-DD */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** Convert snake_case to camelCase */
export function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

/** Convert camelCase to snake_case */
export function camelToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

/** Generate order number WSC-YYYY-NNN */
export function generateOrderNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `WSC-${year}-${String(seq).padStart(3, '0')}`;
}

/** Get status color class */
export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    '주문등록': { bg: 'bg-blue-50', text: 'text-blue-700' },
    '생산중': { bg: 'bg-amber-50', text: 'text-amber-700' },
    '생산완료': { bg: 'bg-green-50', text: 'text-green-700' },
    '발송준비': { bg: 'bg-purple-50', text: 'text-purple-700' },
    '발송완료': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    '설치완료': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    '접수': { bg: 'bg-blue-50', text: 'text-blue-700' },
    '처리중': { bg: 'bg-amber-50', text: 'text-amber-700' },
    '완료': { bg: 'bg-green-50', text: 'text-green-700' },
    '보류': { bg: 'bg-gray-50', text: 'text-gray-500' },
    '부족': { bg: 'bg-red-50', text: 'text-red-600' },
    '합격': { bg: 'bg-green-50', text: 'text-green-700' },
    '불합격': { bg: 'bg-red-50', text: 'text-red-700' },
    '정상': { bg: 'bg-green-50', text: 'text-green-700' },
    '점검필요': { bg: 'bg-amber-50', text: 'text-amber-700' },
    '고장': { bg: 'bg-red-50', text: 'text-red-700' },
    '폐기': { bg: 'bg-gray-100', text: 'text-gray-500' },
    '주의': { bg: 'bg-amber-50', text: 'text-amber-700' },
    '불량': { bg: 'bg-red-50', text: 'text-red-700' },
    '예정': { bg: 'bg-blue-50', text: 'text-blue-700' },
    '연기': { bg: 'bg-purple-50', text: 'text-purple-700' },
    '취소': { bg: 'bg-gray-100', text: 'text-gray-500' },
  };
  return colors[status] || { bg: 'bg-gray-50', text: 'text-gray-700' };
}
