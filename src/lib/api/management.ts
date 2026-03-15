import { supabase } from '../supabase';
import type { Receivable, Payable, MonthlyOrderData } from '@/types';

export async function getReceivables(): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from('erp_receivables')
    .select('*')
    .order('due_date');

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    customerName: row.customer_name || '',
    orderNo: row.order_no || '',
    amount: row.amount || 0,
    dueDate: row.due_date || '',
    paidAmount: row.paid_amount || 0,
    status: row.status || '미수',
  }));
}

export async function getPayables(): Promise<Payable[]> {
  const { data, error } = await supabase
    .from('erp_payables')
    .select('*')
    .order('due_date');

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    supplierName: row.supplier_name || '',
    description: row.description || '',
    amount: row.amount || 0,
    dueDate: row.due_date || '',
    paidAmount: row.paid_amount || 0,
    status: row.status || '미지급',
  }));
}

export async function getMonthlyOrderTrend(): Promise<MonthlyOrderData[]> {
  const { data, error } = await supabase
    .from('erp_orders')
    .select('order_date, total_amount');

  if (error) throw error;

  // Group by month
  const monthMap = new Map<string, number>();
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, 0);
  }

  (data || []).forEach((row) => {
    if (row.order_date) {
      const key = row.order_date.slice(0, 7);
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + (row.total_amount || 0));
      }
    }
  });

  return Array.from(monthMap.entries()).map(([month, amount]) => ({
    month: month.split('-')[1] + '월',
    amount,
  }));
}

export async function getFinanceSummary() {
  const receivables = await getReceivables();
  const payables = await getPayables();

  const totalReceivable = receivables
    .filter((r) => r.status !== '수금완료')
    .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

  const totalPayable = payables
    .filter((p) => p.status !== '지급완료')
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  // Top 5 receivables by customer
  const customerMap = new Map<string, number>();
  receivables
    .filter((r) => r.status !== '수금완료')
    .forEach((r) => {
      const current = customerMap.get(r.customerName) || 0;
      customerMap.set(r.customerName, current + (r.amount - r.paidAmount));
    });

  const topReceivables = Array.from(customerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  return { totalReceivable, totalPayable, topReceivables };
}
