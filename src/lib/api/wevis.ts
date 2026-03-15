import { supabase } from '../supabase';
import { formatWon } from '../utils';
import type { SalesActivity, SalesActivityPurpose, MeetingMinutes, WevisMessage, MonthlyReport } from '@/types';

// ============================================================
// Row Mappers
// ============================================================

interface SalesActivityRow {
  id: string;
  customer_id: string | null;
  customer_name: string;
  visit_date: string;
  purpose: SalesActivityPurpose;
  content: string;
  next_action: string | null;
  next_action_date: string | null;
  order_id: string | null;
  created_by: string | null;
  created_at: string;
}

function mapSalesActivityRow(row: SalesActivityRow): SalesActivity {
  return {
    id: row.id,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name,
    visitDate: row.visit_date,
    purpose: row.purpose,
    content: row.content,
    nextAction: row.next_action || undefined,
    nextActionDate: row.next_action_date || undefined,
    orderId: row.order_id || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

interface MeetingMinutesRow {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  meeting_date: string;
  attendees: string[];
  transcript: string | null;
  structured_content: MeetingMinutes['structuredContent'] | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
}

function mapMeetingMinutesRow(row: MeetingMinutesRow): MeetingMinutes {
  return {
    id: row.id,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || undefined,
    meetingDate: row.meeting_date,
    attendees: row.attendees || [],
    transcript: row.transcript || undefined,
    structuredContent: row.structured_content || undefined,
    sentAt: row.sent_at || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

interface WevisConversationRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function mapWevisMessageRow(row: WevisConversationRow): WevisMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

// ============================================================
// Sales Activities CRUD
// ============================================================

export interface SalesActivityFilters {
  purpose?: SalesActivityPurpose;
  customerName?: string;
}

export async function getSalesActivities(filters?: SalesActivityFilters): Promise<SalesActivity[]> {
  let query = supabase
    .from('sales_activities')
    .select('*')
    .order('visit_date', { ascending: false });

  if (filters?.purpose) {
    query = query.eq('purpose', filters.purpose);
  }
  if (filters?.customerName) {
    query = query.ilike('customer_name', `%${filters.customerName}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapSalesActivityRow);
}

export interface CreateSalesActivityInput {
  customerId?: string;
  customerName: string;
  visitDate: string;
  purpose: SalesActivityPurpose;
  content: string;
  nextAction?: string;
  nextActionDate?: string;
  orderId?: string;
  createdBy?: string;
}

export async function addSalesActivity(input: CreateSalesActivityInput): Promise<SalesActivity> {
  const { data, error } = await supabase
    .from('sales_activities')
    .insert({
      customer_id: input.customerId || null,
      customer_name: input.customerName,
      visit_date: input.visitDate,
      purpose: input.purpose,
      content: input.content,
      next_action: input.nextAction || null,
      next_action_date: input.nextActionDate || null,
      order_id: input.orderId || null,
      created_by: input.createdBy || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSalesActivityRow(data);
}

export async function getSalesActivityStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('sales_activities')
    .select('purpose, visit_date')
    .gte('visit_date', startOfMonth);

  if (error) throw error;

  const items = data || [];
  const byPurpose: Record<string, number> = {};
  for (const item of items) {
    byPurpose[item.purpose] = (byPurpose[item.purpose] || 0) + 1;
  }

  return {
    thisMonthCount: items.length,
    byPurpose,
  };
}

// ============================================================
// Meeting Minutes CRUD
// ============================================================

export async function getMeetingMinutes(): Promise<MeetingMinutes[]> {
  const { data, error } = await supabase
    .from('meeting_minutes')
    .select('*')
    .order('meeting_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapMeetingMinutesRow);
}

export interface CreateMeetingMinutesInput {
  customerId?: string;
  customerName?: string;
  meetingDate: string;
  attendees: string[];
  transcript?: string;
  structuredContent?: MeetingMinutes['structuredContent'];
  createdBy?: string;
}

export async function addMeetingMinutes(input: CreateMeetingMinutesInput): Promise<MeetingMinutes> {
  const { data, error } = await supabase
    .from('meeting_minutes')
    .insert({
      customer_id: input.customerId || null,
      customer_name: input.customerName || null,
      meeting_date: input.meetingDate,
      attendees: input.attendees,
      transcript: input.transcript || null,
      structured_content: input.structuredContent || null,
      created_by: input.createdBy || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMeetingMinutesRow(data);
}

export async function updateMeetingMinutes(
  id: string,
  updates: Partial<CreateMeetingMinutesInput>
): Promise<MeetingMinutes> {
  const updateData: Record<string, unknown> = {};
  if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
  if (updates.meetingDate !== undefined) updateData.meeting_date = updates.meetingDate;
  if (updates.attendees !== undefined) updateData.attendees = updates.attendees;
  if (updates.transcript !== undefined) updateData.transcript = updates.transcript;
  if (updates.structuredContent !== undefined) updateData.structured_content = updates.structuredContent;

  const { data, error } = await supabase
    .from('meeting_minutes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapMeetingMinutesRow(data);
}

// ============================================================
// WEVIS Chat
// ============================================================

export async function getWevisConversations(sessionId: string): Promise<WevisMessage[]> {
  const { data, error } = await supabase
    .from('wevis_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapWevisMessageRow);
}

export async function addWevisMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<WevisMessage> {
  const { data, error } = await supabase
    .from('wevis_conversations')
    .insert({
      session_id: sessionId,
      role,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return mapWevisMessageRow(data);
}

// ============================================================
// WEVIS Query Processor (Rules Engine)
// ============================================================

export async function processWevisQuery(query: string): Promise<string> {
  const q = query.toLowerCase().trim();

  // 일반 인사
  if (/^(안녕|하이|헬로|도움|뭐\s*할\s*수)/.test(q)) {
    return '안녕하세요! 저는 웨비스입니다.\n\n다음과 같은 질문을 해보세요:\n- "이번달 주문 현황"\n- "재고 부족 목록"\n- "납기 임박 주문"\n- "A/S 접수 현황"\n- "영업활동 요약"';
  }

  // 주문/수주 현황
  if (/주문|수주|오더/.test(q)) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data: orders, error } = await supabase
        .from('erp_orders')
        .select('status, total_amount, order_date, customer_name, due_date')
        .gte('order_date', startOfMonth);

      if (error) throw error;

      const items = orders || [];
      if (items.length === 0) {
        return '이번달 주문 내역이 없습니다.';
      }

      const totalAmount = items.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const statusCount: Record<string, number> = {};
      for (const o of items) {
        statusCount[o.status] = (statusCount[o.status] || 0) + 1;
      }

      const statusLines = Object.entries(statusCount)
        .map(([s, c]) => `  ${s} ${c}건`)
        .join('\n');

      // 납기 임박 체크
      const today = new Date().toISOString().split('T')[0];
      const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      const urgent = items.filter(
        (o) => o.due_date && o.due_date <= threeDaysLater && o.status !== '설치완료' && o.status !== '발송완료'
      );

      let result = `이번달 주문 현황입니다:\n\n총 ${items.length}건, ${formatWon(totalAmount)}\n\n${statusLines}`;

      if (urgent.length > 0) {
        result += `\n\n납기 임박 ${urgent.length}건 주의`;
      }

      return result;
    } catch {
      return '주문 데이터를 조회하는 중 오류가 발생했습니다.';
    }
  }

  // 납기 관련
  if (/납기|임박|이번\s*주/.test(q)) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('erp_orders')
        .select('order_no, customer_name, due_date, status')
        .lte('due_date', weekLater)
        .gte('due_date', today)
        .not('status', 'in', '("설치완료","발송완료")')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const items = data || [];
      if (items.length === 0) {
        return '7일 이내 납기 임박 주문이 없습니다.';
      }

      const lines = items.map(
        (o) => `  ${o.order_no} | ${o.customer_name} | ${o.due_date} | ${o.status}`
      );

      return `납기 임박 주문 (7일 이내):\n\n${lines.join('\n')}`;
    } catch {
      return '납기 데이터를 조회하는 중 오류가 발생했습니다.';
    }
  }

  // 생산 관련
  if (/생산|완료율|진행/.test(q)) {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('status, progress');

      if (error) throw error;

      const items = data || [];
      if (items.length === 0) {
        return '등록된 생산 지시가 없습니다.';
      }

      const statusCount: Record<string, number> = {};
      let totalProgress = 0;
      for (const w of items) {
        statusCount[w.status] = (statusCount[w.status] || 0) + 1;
        totalProgress += w.progress || 0;
      }

      const avgProgress = Math.round(totalProgress / items.length);
      const statusLines = Object.entries(statusCount)
        .map(([s, c]) => `  ${s} ${c}건`)
        .join('\n');

      return `생산 현황:\n\n총 ${items.length}건, 평균 진행률 ${avgProgress}%\n\n${statusLines}`;
    } catch {
      return '생산 데이터를 조회하는 중 오류가 발생했습니다.';
    }
  }

  // A/S 관련
  if (/a\/?s|고장|접수|서비스\s*접수/.test(q)) {
    try {
      const { data, error } = await supabase
        .from('cs_tickets')
        .select('status, priority, customer_name, created_at')
        .in('status', ['접수', '처리중']);

      if (error) throw error;

      const items = data || [];
      if (items.length === 0) {
        return '현재 처리 대기 중인 A/S 건이 없습니다.';
      }

      const urgent = items.filter((t) => t.priority === '긴급').length;
      const pending = items.filter((t) => t.status === '접수').length;
      const inProgress = items.filter((t) => t.status === '처리중').length;

      let result = `A/S 현황:\n\n총 ${items.length}건 (접수 ${pending}건, 처리중 ${inProgress}건)`;
      if (urgent > 0) {
        result += `\n긴급 ${urgent}건 주의`;
      }

      return result;
    } catch {
      return 'A/S 데이터를 조회하는 중 오류가 발생했습니다.';
    }
  }

  // 재고 관련
  if (/재고|부족|자재/.test(q)) {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('part_no, name, stock_qty, safety_stock')
        .order('stock_qty', { ascending: true });

      if (error) throw error;

      const items = data || [];
      const lowStock = items.filter((p) => p.stock_qty <= p.safety_stock);

      if (lowStock.length === 0) {
        return '재고 부족 품목이 없습니다. 모든 자재가 안전재고 이상입니다.';
      }

      const lines = lowStock.slice(0, 10).map(
        (p) => `  ${p.part_no} ${p.name} | 현재 ${p.stock_qty} / 안전 ${p.safety_stock}`
      );

      let result = `재고 부족 품목 ${lowStock.length}건:\n\n${lines.join('\n')}`;
      if (lowStock.length > 10) {
        result += `\n\n... 외 ${lowStock.length - 10}건`;
      }

      return result;
    } catch {
      return '재고 데이터를 조회하는 중 오류가 발생했습니다.';
    }
  }

  // 영업활동 관련
  if (/영업|방문|활동/.test(q)) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sales_activities')
        .select('purpose, customer_name, visit_date')
        .gte('visit_date', startOfMonth);

      if (error) throw error;

      const items = data || [];
      if (items.length === 0) {
        return '이번달 영업활동 기록이 없습니다.';
      }

      const byPurpose: Record<string, number> = {};
      for (const item of items) {
        byPurpose[item.purpose] = (byPurpose[item.purpose] || 0) + 1;
      }

      const purposeLines = Object.entries(byPurpose)
        .map(([p, c]) => `  ${p} ${c}건`)
        .join('\n');

      return `이번달 영업활동 요약:\n\n총 ${items.length}건\n\n${purposeLines}`;
    } catch {
      return '영업활동 데이터를 조회하는 중 오류가 발생했습니다.';
    }
  }

  // 고객사 검색
  if (/고객/.test(q)) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('name, contact_name, contact_phone')
        .limit(10);

      if (error) throw error;

      const items = data || [];
      if (items.length === 0) {
        return '등록된 고객사가 없습니다.';
      }

      const lines = items.map(
        (c) => `  ${c.name} | ${c.contact_name || '-'} | ${c.contact_phone || '-'}`
      );

      return `등록 고객사:\n\n${lines.join('\n')}`;
    } catch {
      return '고객 데이터를 조회하는 중 오류가 발생했습니다.';
    }
  }

  // 보고서 관련
  if (/보고서|월간|정리|요약/.test(q)) {
    return '월간 보고서 생성 기능은 준비 중입니다.\n\n"이번달 주문 현황", "영업활동 요약" 등 개별 현황을 먼저 확인해 보세요.';
  }

  // 매칭 안됨
  return '죄송합니다, 질문을 이해하지 못했습니다.\n\n다음과 같은 질문을 해보세요:\n- "이번달 주문 현황"\n- "재고 부족 목록"\n- "납기 임박 주문"\n- "A/S 접수 현황"\n- "영업활동 요약"';
}

// ============================================================
// Monthly Report Generation
// ============================================================

export async function generateMonthlyReport(month: string): Promise<MonthlyReport> {
  const [year, mon] = month.split('-').map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(year, mon, 0).toISOString().split('T')[0]; // last day of month

  // Aggregate from multiple tables
  const [ordersRes, workOrdersRes, csRes, salesRes] = await Promise.all([
    supabase
      .from('erp_orders')
      .select('status, total_amount')
      .gte('order_date', startDate)
      .lte('order_date', endDate),
    supabase
      .from('work_orders')
      .select('status')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`),
    supabase
      .from('cs_tickets')
      .select('status, priority')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`),
    supabase
      .from('sales_activities')
      .select('purpose')
      .gte('visit_date', startDate)
      .lte('visit_date', endDate),
  ]);

  const orders = ordersRes.data || [];
  const workOrders = workOrdersRes.data || [];
  const csTickets = csRes.data || [];
  const salesActivities = salesRes.data || [];

  const content = {
    month,
    orders: {
      total: orders.length,
      totalAmount: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      byStatus: orders.reduce((acc: Record<string, number>, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}),
    },
    production: {
      total: workOrders.length,
      byStatus: workOrders.reduce((acc: Record<string, number>, w) => {
        acc[w.status] = (acc[w.status] || 0) + 1;
        return acc;
      }, {}),
    },
    service: {
      total: csTickets.length,
      urgent: csTickets.filter((t) => t.priority === '긴급').length,
      byStatus: csTickets.reduce((acc: Record<string, number>, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {}),
    },
    sales: {
      total: salesActivities.length,
      byPurpose: salesActivities.reduce((acc: Record<string, number>, s) => {
        acc[s.purpose] = (acc[s.purpose] || 0) + 1;
        return acc;
      }, {}),
    },
  };

  const { data, error } = await supabase
    .from('monthly_reports')
    .insert({
      report_month: month,
      content,
      generated_by: 'wevis',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    reportMonth: data.report_month,
    content: data.content,
    sentAt: data.sent_at || undefined,
    createdAt: data.created_at,
  };
}
