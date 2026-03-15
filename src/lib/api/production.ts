import { supabase } from '../supabase';
import type { WorkOrder } from '@/types';

interface WorkOrderRow {
  id: string;
  order_no: string;
  order_id: string;
  customer_name: string;
  model: string;
  model_name: string;
  qty: number;
  status: WorkOrder['status'];
  assignee: string;
  start_date: string | null;
  end_date: string | null;
  due_date: string;
  progress: number;
  note: string;
  created_at: string;
}

function mapRow(row: WorkOrderRow): WorkOrder {
  return {
    id: row.id,
    orderNo: row.order_no,
    orderId: row.order_id,
    customerName: row.customer_name,
    model: row.model,
    modelName: row.model_name || row.model,
    qty: row.qty,
    status: row.status,
    assignee: row.assignee || '',
    startDate: row.start_date,
    endDate: row.end_date,
    dueDate: row.due_date,
    progress: row.progress || 0,
    note: row.note || '',
    createdAt: row.created_at,
  };
}

export async function getWorkOrders(status?: string): Promise<WorkOrder[]> {
  let query = supabase
    .from('erp_work_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== '전체') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase
    .from('erp_work_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapRow(data);
}

export async function createWorkOrder(input: {
  orderNo: string;
  orderId: string;
  customerName: string;
  model: string;
  modelName: string;
  qty: number;
  dueDate: string;
  assignee: string;
  note: string;
}): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('erp_work_orders')
    .insert({
      order_no: input.orderNo,
      order_id: input.orderId,
      customer_name: input.customerName,
      model: input.model,
      model_name: input.modelName,
      qty: input.qty,
      status: '대기',
      due_date: input.dueDate,
      assignee: input.assignee,
      progress: 0,
      note: input.note,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateWorkOrderStatus(
  id: string,
  status: WorkOrder['status'],
  progress?: number
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (progress !== undefined) update.progress = progress;
  if (status === '생산중' && !update.start_date) update.start_date = new Date().toISOString();
  if (status === '생산완료' || status === '검수완료') update.end_date = new Date().toISOString();

  const { error } = await supabase
    .from('erp_work_orders')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

export async function getProductionStats() {
  const { data, error } = await supabase
    .from('erp_work_orders')
    .select('status, progress');

  if (error) throw error;

  const inProgress = (data || []).filter((w) => w.status === '생산중').length;
  const waiting = (data || []).filter((w) => w.status === '대기').length;
  const completed = (data || []).filter((w) => w.status === '생산완료' || w.status === '검수완료').length;

  return { inProgress, waiting, completed };
}
