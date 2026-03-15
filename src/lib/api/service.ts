import { supabase } from '../supabase';
import type { CsTicket, Delivery, CsStatus } from '@/types';

// --- CS Tickets (A/S) ---
export async function getCsTickets(status?: string): Promise<CsTicket[]> {
  let query = supabase
    .from('cs_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== '전체') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    ticketNo: row.ticket_no || `CS-${row.id?.slice(0, 8)}`,
    customerId: row.customer_id || '',
    customerName: row.customer_name || '',
    serialNo: row.serial_no || '',
    model: row.model || '',
    issueType: row.issue_type || '',
    description: row.description || '',
    status: (row.status || '접수') as CsStatus,
    priority: row.priority || '보통',
    assignee: row.assignee || '',
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  }));
}

export async function createCsTicket(input: {
  customerName: string;
  customerId?: string;
  serialNo: string;
  model: string;
  issueType: string;
  description: string;
  priority: '긴급' | '보통' | '낮음';
}): Promise<CsTicket> {
  const { data, error } = await supabase
    .from('cs_tickets')
    .insert({
      customer_name: input.customerName,
      customer_id: input.customerId || null,
      serial_no: input.serialNo,
      model: input.model,
      issue_type: input.issueType,
      description: input.description,
      status: '접수',
      priority: input.priority,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    ticketNo: data.ticket_no || `CS-${data.id?.slice(0, 8)}`,
    customerId: data.customer_id || '',
    customerName: data.customer_name || '',
    serialNo: data.serial_no || '',
    model: data.model || '',
    issueType: data.issue_type || '',
    description: data.description || '',
    status: data.status as CsStatus,
    priority: data.priority || '보통',
    assignee: data.assignee || '',
    resolvedAt: data.resolved_at,
    createdAt: data.created_at,
  };
}

export async function updateCsTicketStatus(id: string, status: CsStatus): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === '완료') update.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from('cs_tickets')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

// --- Deliveries (설치/발송) ---
export async function getDeliveries(): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('erp_deliveries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    orderNo: row.order_no || '',
    customerName: row.customer_name || '',
    model: row.model || '',
    qty: row.qty || 0,
    serialNumbers: row.serial_numbers || [],
    shipDate: row.ship_date || '',
    installDate: row.install_date,
    status: row.status || '발송준비',
    installer: row.installer || '',
    note: row.note || '',
    createdAt: row.created_at,
  }));
}

export async function getServiceStats() {
  const tickets = await getCsTickets();
  const pending = tickets.filter((t) => t.status === '접수' || t.status === '처리중');
  return {
    totalTickets: tickets.length,
    pendingCount: pending.length,
    urgentCount: pending.filter((t) => t.priority === '긴급').length,
  };
}
