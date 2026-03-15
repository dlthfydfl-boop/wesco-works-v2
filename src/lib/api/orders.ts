import { supabase } from '../supabase';
import type { Order, OrderItem, OrderStatus } from '@/types';
import { generateOrderNumber } from '../utils';

interface OrderRow {
  id: string;
  order_no: string;
  customer_id: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  order_date: string;
  due_date: string;
  note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: OrderRow): Order {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerId: row.customer_id,
    customerName: row.customer_name,
    items: row.items || [],
    totalAmount: row.total_amount || 0,
    status: row.status,
    orderDate: row.order_date,
    dueDate: row.due_date,
    note: row.note || '',
    createdBy: row.created_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export async function getOrders(status?: string): Promise<Order[]> {
  let query = supabase
    .from('erp_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== '전체') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('erp_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapRow(data);
}

export async function getNextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from('erp_orders')
    .select('*', { count: 'exact', head: true })
    .ilike('order_no', `WSC-${year}-%`);

  if (error) throw error;
  return generateOrderNumber((count || 0) + 1);
}

export interface CreateOrderInput {
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  dueDate: string;
  note: string;
  createdBy: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderNo = await getNextOrderNumber();

  const { data, error } = await supabase
    .from('erp_orders')
    .insert({
      order_no: orderNo,
      customer_id: input.customerId,
      customer_name: input.customerName,
      items: input.items,
      total_amount: input.totalAmount,
      status: '주문등록',
      order_date: new Date().toISOString().split('T')[0],
      due_date: input.dueDate,
      note: input.note,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('erp_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('erp_orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getOrderStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: orders, error } = await supabase
    .from('erp_orders')
    .select('status, total_amount, order_date');

  if (error) throw error;

  const newOrders = (orders || []).filter((o) => o.status === '주문등록').length;
  const monthlyAmount = (orders || [])
    .filter((o) => o.order_date >= startOfMonth.split('T')[0])
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return { newOrders, monthlyAmount, totalOrders: (orders || []).length };
}
