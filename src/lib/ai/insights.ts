import { getOrders, getOrderStats } from '@/lib/api/orders';
import { getWorkOrders } from '@/lib/api/production';
import { getParts, getBoms } from '@/lib/api/materials';
import { getCsTickets, getDeliveries } from '@/lib/api/service';
import { getReceivables } from '@/lib/api/management';
import { dDay, formatCurrency } from '@/lib/utils';

export interface Insight {
  id: string;
  type: 'warning' | 'suggestion' | 'info' | 'success';
  iconPath: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
  module: 'home' | 'orders' | 'production' | 'materials' | 'service' | 'management';
  priority: number;
}

// SVG paths for icons
const ICONS = {
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  money: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  wrench: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  user: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  flash: 'M13 10V3L4 14h7v7l9-11h-7z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export async function generateHomeInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const [orders, stats, parts, receivables, tickets] = await Promise.all([
      getOrders(),
      getOrderStats(),
      getParts(),
      getReceivables(),
      getCsTickets(),
    ]);

    // Due date warnings
    const urgentOrders = orders.filter((o) => {
      if (o.status === '발송완료' || o.status === '설치완료') return false;
      const d = dDay(o.dueDate);
      const num = parseInt(d.replace(/[^0-9-]/g, ''));
      return (d.startsWith('D-') && num <= 3) || d === 'D-Day' || d.startsWith('D+');
    });

    if (urgentOrders.length > 0) {
      insights.push({
        id: 'home-urgent-orders',
        type: 'warning',
        iconPath: ICONS.alert,
        title: `납기 임박 주문 ${urgentOrders.length}건`,
        description: `${urgentOrders[0].orderNo} 외 ${Math.max(0, urgentOrders.length - 1)}건의 납기가 3일 이내입니다`,
        action: { label: '주문 확인', href: '/orders' },
        module: 'home',
        priority: 1,
      });
    }

    // Low stock
    const lowStock = parts.filter((p) => p.stockQty <= p.safetyStock && p.safetyStock > 0);
    if (lowStock.length > 0) {
      insights.push({
        id: 'home-low-stock',
        type: 'warning',
        iconPath: ICONS.box,
        title: `안전재고 미달 부품 ${lowStock.length}개`,
        description: lowStock.slice(0, 3).map((p) => p.name).join(', ') + (lowStock.length > 3 ? ' 외' : ''),
        action: { label: '재고 확인', href: '/materials' },
        module: 'home',
        priority: 1,
      });
    }

    // Overdue receivables
    const today = new Date().toISOString().split('T')[0];
    const overdue = receivables.filter((r) => r.status !== '수금완료' && r.dueDate < today);
    if (overdue.length > 0) {
      const total = overdue.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
      insights.push({
        id: 'home-overdue-recv',
        type: 'warning',
        iconPath: ICONS.money,
        title: `연체 미수금 ${formatCurrency(total)}`,
        description: `${overdue.length}건의 미수금이 만기를 초과했습니다`,
        action: { label: '경영현황', href: '/management' },
        module: 'home',
        priority: 1,
      });
    }

    // Pending tickets
    const pendingTickets = tickets.filter((t) => t.status === '접수' || t.status === '처리중');
    if (pendingTickets.length > 0) {
      insights.push({
        id: 'home-pending-as',
        type: 'info',
        iconPath: ICONS.wrench,
        title: `미처리 A/S ${pendingTickets.length}건`,
        description: pendingTickets.filter((t) => t.priority === '긴급').length > 0
          ? `긴급 ${pendingTickets.filter((t) => t.priority === '긴급').length}건 포함`
          : '처리 대기중인 A/S가 있습니다',
        action: { label: 'A/S 확인', href: '/service' },
        module: 'home',
        priority: 2,
      });
    }

    // Monthly performance
    if (stats.totalOrders > 0 && stats.monthlyAmount > 0) {
      insights.push({
        id: 'home-monthly',
        type: 'success',
        iconPath: ICONS.check,
        title: '이번달 주문 현황',
        description: `신규 주문 ${stats.newOrders}건, 총 ${stats.totalOrders}건 처리중`,
        module: 'home',
        priority: 3,
      });
    }
  } catch {
    // Silently handle errors
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export async function generateOrderInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const orders = await getOrders();

    // Stale orders
    const staleOrders = orders.filter((o) => {
      if (o.status !== '주문등록') return false;
      const created = new Date(o.createdAt);
      const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 3;
    });

    if (staleOrders.length > 0) {
      staleOrders.forEach((o) => {
        insights.push({
          id: `order-stale-${o.id}`,
          type: 'suggestion',
          iconPath: ICONS.clock,
          title: `${o.orderNo} 생산 요청이 필요합니다`,
          description: `${o.customerName} 주문이 3일 이상 대기중입니다`,
          action: { label: '주문 확인', href: `/orders/${o.id}` },
          module: 'orders',
          priority: 2,
        });
      });
    }

    // Repeat customers
    const customerCount = new Map<string, number>();
    orders.forEach((o) => {
      customerCount.set(o.customerName, (customerCount.get(o.customerName) || 0) + 1);
    });
    Array.from(customerCount.entries())
      .filter(([, count]) => count >= 3)
      .forEach(([name, count]) => {
        insights.push({
          id: `order-vip-${name}`,
          type: 'info',
          iconPath: ICONS.user,
          title: `${name} 최근 ${count}건 주문`,
          description: '주요 고객 관리가 필요합니다',
          module: 'orders',
          priority: 3,
        });
      });

    // Overdue orders
    const overdueOrders = orders.filter((o) => {
      if (o.status === '발송완료' || o.status === '설치완료') return false;
      return dDay(o.dueDate).startsWith('D+');
    });
    if (overdueOrders.length > 0) {
      insights.push({
        id: 'order-overdue',
        type: 'warning',
        iconPath: ICONS.alert,
        title: `납기 초과 주문 ${overdueOrders.length}건`,
        description: overdueOrders.slice(0, 2).map((o) => o.orderNo).join(', '),
        action: { label: '주문 확인', href: '/orders' },
        module: 'orders',
        priority: 1,
      });
    }
  } catch {
    // Silently handle
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export async function generateProductionInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const [workOrders, parts, boms] = await Promise.all([
      getWorkOrders(),
      getParts(),
      getBoms(),
    ]);

    // Behind schedule
    const behindSchedule = workOrders.filter((wo) => {
      if (wo.status === '생산완료' || wo.status === '검수완료') return false;
      return dDay(wo.dueDate).startsWith('D+') || dDay(wo.dueDate) === 'D-Day';
    });

    if (behindSchedule.length > 0) {
      behindSchedule.forEach((wo) => {
        insights.push({
          id: `prod-delay-${wo.id}`,
          type: 'warning',
          iconPath: ICONS.alert,
          title: `생산 지연 - 납기까지 ${dDay(wo.dueDate)}`,
          description: `${wo.customerName} ${wo.model} x ${wo.qty}`,
          action: { label: '상세 보기', href: `/production/${wo.id}` },
          module: 'production',
          priority: 1,
        });
      });
    }

    // BOM material shortage check
    const partMap = new Map(parts.map((p) => [p.id, p]));
    for (const wo of workOrders.filter((w) => w.status === '대기' || w.status === '생산중')) {
      const bom = boms.find((b) => b.model === wo.model);
      if (!bom) continue;

      const shortParts = bom.parts.filter((bp) => {
        const part = partMap.get(bp.partId);
        if (!part) return false;
        return part.stockQty < bp.qty * wo.qty;
      });

      if (shortParts.length > 0) {
        insights.push({
          id: `prod-material-${wo.id}`,
          type: 'warning',
          iconPath: ICONS.box,
          title: `${wo.model} 자재 부족`,
          description: shortParts.map((p) => p.partName).join(', ') + ' 부족',
          action: { label: '재고 확인', href: '/materials' },
          module: 'production',
          priority: 1,
        });
      }
    }

    // Waiting work orders
    const waiting = workOrders.filter((wo) => wo.status === '대기');
    if (waiting.length > 3) {
      insights.push({
        id: 'prod-waiting',
        type: 'info',
        iconPath: ICONS.clock,
        title: `생산 대기 ${waiting.length}건`,
        description: '생산 일정 조정이 필요할 수 있습니다',
        module: 'production',
        priority: 2,
      });
    }
  } catch {
    // Silently handle
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export async function generateMaterialInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const [parts, boms] = await Promise.all([getParts(), getBoms()]);

    // Low stock
    const lowStock = parts.filter((p) => p.stockQty <= p.safetyStock && p.safetyStock > 0);
    if (lowStock.length > 0) {
      lowStock.slice(0, 5).forEach((p) => {
        insights.push({
          id: `mat-low-${p.id}`,
          type: 'warning',
          iconPath: ICONS.alert,
          title: `${p.name} 재고 부족`,
          description: `현재 ${p.stockQty}${p.unit} / 안전재고 ${p.safetyStock}${p.unit}`,
          module: 'materials',
          priority: 1,
        });
      });
    }

    // Parts with no recent movement (check updated date)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const stale = parts.filter((p) => {
      if (!p.updatedAt) return false;
      return new Date(p.updatedAt) < thirtyDaysAgo && p.stockQty > 0;
    });
    if (stale.length > 0) {
      insights.push({
        id: 'mat-stale',
        type: 'info',
        iconPath: ICONS.info,
        title: `30일간 미사용 부품 ${stale.length}개`,
        description: '장기 미사용 부품 점검이 필요합니다',
        module: 'materials',
        priority: 3,
      });
    }

    // BOM coverage check
    const modelSet = new Set(boms.map((b) => b.model));
    const registeredModels = ['TSP-12020', 'TSP-338100', 'TSP-343050', 'TSP-343100'];
    const unregistered = registeredModels.filter((m) => !modelSet.has(m));
    if (unregistered.length > 0) {
      insights.push({
        id: 'mat-bom-missing',
        type: 'suggestion',
        iconPath: ICONS.doc,
        title: `부품구성표 미등록 모델 ${unregistered.length}개`,
        description: unregistered.join(', '),
        module: 'materials',
        priority: 2,
      });
    }
  } catch {
    // Silently handle
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export async function generateServiceInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const tickets = await getCsTickets();

    // Long open tickets
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const longOpen = tickets.filter((t) => {
      if (t.status === '완료') return false;
      return new Date(t.createdAt) < sevenDaysAgo;
    });
    if (longOpen.length > 0) {
      insights.push({
        id: 'svc-long-open',
        type: 'warning',
        iconPath: ICONS.clock,
        title: `장기 미처리 A/S ${longOpen.length}건`,
        description: `7일 이상 미처리 건이 있습니다`,
        action: { label: 'A/S 확인', href: '/service' },
        module: 'service',
        priority: 1,
      });
    }

    // Recurring model issues
    const modelCount = new Map<string, number>();
    tickets.forEach((t) => {
      if (t.model) modelCount.set(t.model, (modelCount.get(t.model) || 0) + 1);
    });
    Array.from(modelCount.entries())
      .filter(([, count]) => count >= 3)
      .forEach(([model, count]) => {
        insights.push({
          id: `svc-pattern-${model}`,
          type: 'info',
          iconPath: ICONS.info,
          title: `${model} 최근 ${count}건 A/S`,
          description: '반복 이슈 패턴 확인이 필요합니다',
          module: 'service',
          priority: 2,
        });
      });

    // Urgent tickets
    const urgent = tickets.filter((t) => t.priority === '긴급' && t.status !== '완료');
    if (urgent.length > 0) {
      insights.push({
        id: 'svc-urgent',
        type: 'warning',
        iconPath: ICONS.flash,
        title: `긴급 A/S ${urgent.length}건`,
        description: urgent.map((t) => t.customerName).slice(0, 3).join(', '),
        module: 'service',
        priority: 1,
      });
    }
  } catch {
    // Silently handle
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export async function generateManagementInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const receivables = await getReceivables();

    const today = new Date().toISOString().split('T')[0];
    const overdue = receivables.filter((r) => r.status !== '수금완료' && r.dueDate < today);
    if (overdue.length > 0) {
      const total = overdue.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
      insights.push({
        id: 'mgmt-overdue',
        type: 'warning',
        iconPath: ICONS.money,
        title: `연체 미수금 ${formatCurrency(total)}`,
        description: `${overdue.length}건의 미수금이 만기를 초과했습니다`,
        module: 'management',
        priority: 1,
      });
    }

    // High receivable customers
    const customerAmounts = new Map<string, number>();
    receivables
      .filter((r) => r.status !== '수금완료')
      .forEach((r) => {
        customerAmounts.set(r.customerName, (customerAmounts.get(r.customerName) || 0) + (r.amount - r.paidAmount));
      });

    const highCustomers = Array.from(customerAmounts.entries())
      .filter(([, amount]) => amount > 50_000_000)
      .sort((a, b) => b[1] - a[1]);

    if (highCustomers.length > 0) {
      insights.push({
        id: 'mgmt-high-recv',
        type: 'info',
        iconPath: ICONS.user,
        title: `고액 미수금 고객 ${highCustomers.length}곳`,
        description: highCustomers.slice(0, 3).map(([name]) => name).join(', '),
        module: 'management',
        priority: 2,
      });
    }
  } catch {
    // Silently handle
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export async function generateInsights(module: string): Promise<Insight[]> {
  switch (module) {
    case 'home':
      return generateHomeInsights();
    case 'orders':
      return generateOrderInsights();
    case 'production':
      return generateProductionInsights();
    case 'materials':
      return generateMaterialInsights();
    case 'service':
      return generateServiceInsights();
    case 'management':
      return generateManagementInsights();
    default:
      return [];
  }
}
