// ============================================================
// WESCO WORKS v2 — Type Definitions
// ============================================================

export type OrderStatus = '주문등록' | '생산중' | '생산완료' | '발송준비' | '발송완료' | '설치완료';
export type CsStatus = '접수' | '처리중' | '완료' | '보류';
export type Role = 'admin' | 'sales' | 'production' | 'warehouse' | 'service' | 'executive';

// --- Order (주문) ---
export interface OrderItem {
  model: string;
  modelName: string;
  qty: number;
  unitPrice: number;
  amount: number;
  serialStart?: string;
}

export interface Order {
  id: string;
  orderNo: string; // WSC-2026-001
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  dueDate: string;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --- WorkOrder (생산 요청) ---
export interface WorkOrder {
  id: string;
  orderNo: string;
  orderId: string;
  customerName: string;
  model: string;
  modelName: string;
  qty: number;
  status: '대기' | '생산중' | '생산완료' | '검수완료';
  assignee: string;
  startDate: string | null;
  endDate: string | null;
  dueDate: string;
  progress: number; // 0-100
  note: string;
  createdAt: string;
}

// --- Part (부품/자재) ---
export interface Part {
  id: string;
  partNo: string;
  name: string;
  spec: string;
  unit: string;
  stockQty: number;
  safetyStock: number;
  location: string;
  unitPrice: number;
  category: string;
  updatedAt: string;
}

// --- BOM (부품구성표) ---
export interface BomItem {
  partId: string;
  partNo: string;
  partName: string;
  qty: number;
  unit: string;
}

export interface Bom {
  id: string;
  model: string;
  modelName: string;
  parts: BomItem[];
  createdAt: string;
}

// --- StockLog (입출고) ---
export interface StockLog {
  id: string;
  partId: string;
  partNo: string;
  partName: string;
  type: '입고' | '출고';
  qty: number;
  reason: string;
  relatedOrder: string;
  createdBy: string;
  createdAt: string;
}

// --- Customer (고객) ---
export interface Customer {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  industry: string;
  createdAt: string;
}

// --- CsTicket (A/S 접수) ---
export interface CsTicket {
  id: string;
  ticketNo: string;
  customerId: string;
  customerName: string;
  serialNo: string;
  model: string;
  issueType: string;
  description: string;
  status: CsStatus;
  priority: '긴급' | '보통' | '낮음';
  assignee: string;
  resolvedAt: string | null;
  createdAt: string;
}

// --- Delivery (설치/발송) ---
export interface Delivery {
  id: string;
  orderNo: string;
  customerName: string;
  model: string;
  qty: number;
  serialNumbers: string[];
  shipDate: string;
  installDate: string | null;
  status: '발송준비' | '발송완료' | '설치중' | '설치완료';
  installer: string;
  note: string;
  createdAt: string;
}

// --- Finance ---
export interface Receivable {
  id: string;
  customerName: string;
  orderNo: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: '미수' | '부분수금' | '수금완료';
}

export interface Payable {
  id: string;
  supplierName: string;
  description: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: '미지급' | '부분지급' | '지급완료';
}

// --- User ---
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// --- Dashboard ---
export interface DashboardSummary {
  newOrders: number;
  inProduction: number;
  pendingService: number;
  monthlyOrderAmount: number;
  deliveryRate: number;
  lowStockCount: number;
  receivableAmount: number;
}

export interface MonthlyOrderData {
  month: string;
  amount: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'production' | 'delivery' | 'service';
  title: string;
  description: string;
  timestamp: string;
}

// --- Installation (설치 마스터) ---
export type InstallationStatus = '정상' | '점검필요' | '고장' | '폐기';
export type InspectType = '정기' | '긴급' | '설치후';
export type InspectResult = '정상' | '주의' | '불량';
export type ScheduleStatus = '예정' | '완료' | '연기' | '취소';

export interface Installation {
  id: string;
  serialNo: string;
  orderId?: string;
  customerId?: string;
  customerName: string;
  siteName?: string;
  model: string;
  capacityKva?: number;
  installDate?: string;
  installLocation?: string;
  status: InstallationStatus;
  warrantyExpire?: string;
  nextInspectDate?: string;
  inspectCycleMonths: number;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CheckItem {
  name: string;
  result: InspectResult;
  note?: string;
}

export interface InspectionRecord {
  id: string;
  installationId: string;
  serialNo: string;
  inspectDate: string;
  inspectType: InspectType;
  inspector: string;
  checkItems: CheckItem[];
  measuredValues: Record<string, string>;
  overallResult: InspectResult;
  actionTaken?: string;
  csTicketId?: number;
  photoUrls: string[];
  signatureUrl?: string;
  note?: string;
  createdAt: string;
}

export interface PartsReplacement {
  id: string;
  installationId: string;
  serialNo: string;
  partName: string;
  materialId?: string;
  replacedAt: string;
  reason?: string;
  cost: number;
  warrantyMonths: number;
  note?: string;
  createdAt: string;
}

export interface InspectionSchedule {
  id: string;
  installationId: string;
  serialNo: string;
  scheduledDate: string;
  assignedTo?: string;
  status: ScheduleStatus;
  completedRecordId?: string;
  note?: string;
  createdAt: string;
}

export interface InstallationStats {
  total: number;
  normal: number;
  needsInspection: number;
  broken: number;
  disposed: number;
}

export interface LifecycleEvent {
  id: string;
  type: 'install' | 'inspection' | 'replacement' | 'cs';
  date: string;
  title: string;
  description: string;
  result?: string;
  details?: Record<string, unknown>;
}

// ============================================================
// WEVIS (AI Assistant) Types
// ============================================================

export type SalesActivityPurpose = '견적상담' | '정기방문' | '불만처리' | '소개' | '기타';

export interface SalesActivity {
  id: string;
  customerId?: string;
  customerName: string;
  visitDate: string;
  purpose: SalesActivityPurpose;
  content: string;
  nextAction?: string;
  nextActionDate?: string;
  orderId?: string;
  createdBy?: string;
  createdAt: string;
}

export interface MeetingMinutes {
  id: string;
  customerId?: string;
  customerName?: string;
  meetingDate: string;
  attendees: string[];
  transcript?: string;
  structuredContent?: {
    agenda: string[];
    discussion: string[];
    decisions: string[];
    actionItems: { task: string; assignee: string; deadline: string }[];
    nextMeeting?: string;
  };
  sentAt?: string;
  createdBy?: string;
  createdAt: string;
}

export interface WevisMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface MonthlyReport {
  id: string;
  reportMonth: string;
  content: any;
  sentAt?: string;
  createdAt: string;
}
