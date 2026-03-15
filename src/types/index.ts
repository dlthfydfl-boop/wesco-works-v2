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
