import { supabase } from '../supabase';
import type { Part, Bom, BomItem, StockLog } from '@/types';

// --- Parts ---
export async function getParts(): Promise<Part[]> {
  const { data, error } = await supabase
    .from('erp_parts')
    .select('*')
    .order('part_no');

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    partNo: row.part_no,
    name: row.name,
    spec: row.spec || '',
    unit: row.unit || 'EA',
    stockQty: row.stock_qty || 0,
    safetyStock: row.safety_stock || 0,
    location: row.location || '',
    unitPrice: row.unit_price || 0,
    category: row.category || '',
    updatedAt: row.updated_at || row.created_at,
  }));
}

export async function getLowStockParts(): Promise<Part[]> {
  const parts = await getParts();
  return parts.filter((p) => p.stockQty <= p.safetyStock);
}

// --- BOM ---
export async function getBoms(): Promise<Bom[]> {
  const { data, error } = await supabase
    .from('erp_bom')
    .select(`
      *,
      erp_bom_parts (
        part_id,
        qty,
        erp_parts (
          id, part_no, name, unit
        )
      )
    `)
    .order('model');

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    model: row.model,
    modelName: row.model_name || row.model,
    parts: (row.erp_bom_parts || []).map((bp: { part_id: string; qty: number; erp_parts: { id: string; part_no: string; name: string; unit: string } | null }) => ({
      partId: bp.part_id,
      partNo: bp.erp_parts?.part_no || '',
      partName: bp.erp_parts?.name || '',
      qty: bp.qty,
      unit: bp.erp_parts?.unit || 'EA',
    })) as BomItem[],
    createdAt: row.created_at,
  }));
}

export async function getBom(id: string): Promise<Bom | null> {
  const { data, error } = await supabase
    .from('erp_bom')
    .select(`
      *,
      erp_bom_parts (
        part_id,
        qty,
        erp_parts (
          id, part_no, name, unit
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) return null;

  return {
    id: data.id,
    model: data.model,
    modelName: data.model_name || data.model,
    parts: (data.erp_bom_parts || []).map((bp: { part_id: string; qty: number; erp_parts: { id: string; part_no: string; name: string; unit: string } | null }) => ({
      partId: bp.part_id,
      partNo: bp.erp_parts?.part_no || '',
      partName: bp.erp_parts?.name || '',
      qty: bp.qty,
      unit: bp.erp_parts?.unit || 'EA',
    })),
    createdAt: data.created_at,
  };
}

// --- Stock Logs ---
export async function getStockLogs(limit = 50): Promise<StockLog[]> {
  const { data, error } = await supabase
    .from('erp_stock_logs')
    .select(`
      *,
      erp_parts (
        part_no, name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    partId: row.part_id,
    partNo: row.erp_parts?.part_no || '',
    partName: row.erp_parts?.name || '',
    type: row.type as '입고' | '출고',
    qty: row.qty,
    reason: row.reason || '',
    relatedOrder: row.related_order || '',
    createdBy: row.created_by || '',
    createdAt: row.created_at,
  }));
}

export async function createStockLog(input: {
  partId: string;
  type: '입고' | '출고';
  qty: number;
  reason: string;
  relatedOrder?: string;
  createdBy: string;
}): Promise<void> {
  const { error } = await supabase
    .from('erp_stock_logs')
    .insert({
      part_id: input.partId,
      type: input.type,
      qty: input.qty,
      reason: input.reason,
      related_order: input.relatedOrder || null,
      created_by: input.createdBy,
    });

  if (error) throw error;

  // Update stock qty
  const delta = input.type === '입고' ? input.qty : -input.qty;
  const { error: updateError } = await supabase.rpc('update_stock_qty', {
    p_part_id: input.partId,
    p_delta: delta,
  });

  // If RPC doesn't exist, update directly
  if (updateError) {
    const { data: part } = await supabase
      .from('erp_parts')
      .select('stock_qty')
      .eq('id', input.partId)
      .single();

    if (part) {
      await supabase
        .from('erp_parts')
        .update({ stock_qty: (part.stock_qty || 0) + delta })
        .eq('id', input.partId);
    }
  }
}

export async function getMaterialStats() {
  const parts = await getParts();
  const lowStock = parts.filter((p) => p.stockQty <= p.safetyStock);
  return {
    totalParts: parts.length,
    lowStockCount: lowStock.length,
    lowStockParts: lowStock.slice(0, 5),
  };
}
