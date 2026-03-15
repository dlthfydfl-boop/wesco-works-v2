import { supabase } from '../supabase';
import type { Customer } from '@/types';

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('erp_customers')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    contactName: row.contact_name || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    address: row.address || '',
    industry: row.industry || '',
    createdAt: row.created_at,
  }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('erp_customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return {
    id: data.id,
    name: data.name,
    contactName: data.contact_name || '',
    contactEmail: data.contact_email || '',
    contactPhone: data.contact_phone || '',
    address: data.address || '',
    industry: data.industry || '',
    createdAt: data.created_at,
  };
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('erp_customers')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    contactName: row.contact_name || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    address: row.address || '',
    industry: row.industry || '',
    createdAt: row.created_at,
  }));
}
