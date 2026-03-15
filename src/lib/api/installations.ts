import { supabase } from '../supabase';
import type {
  Installation,
  InstallationStatus,
  InspectionRecord,
  InspectionSchedule,
  PartsReplacement,
  InstallationStats,
  LifecycleEvent,
  InspectType,
  InspectResult,
  CheckItem,
  ScheduleStatus,
} from '@/types';
import { getCsTickets } from './service';

// ============================================================
// Installation CRUD
// ============================================================

export async function getInstallations(filters?: {
  status?: string;
  customer?: string;
}): Promise<Installation[]> {
  let query = supabase
    .from('installations')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== '전체') {
    query = query.eq('status', filters.status);
  }
  if (filters?.customer) {
    query = query.ilike('customer_name', `%${filters.customer}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapInstallation);
}

export async function getInstallation(id: string): Promise<Installation> {
  const { data, error } = await supabase
    .from('installations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapInstallation(data);
}

export async function getInstallationBySerial(serialNo: string): Promise<Installation | null> {
  const { data, error } = await supabase
    .from('installations')
    .select('*')
    .eq('serial_no', serialNo)
    .maybeSingle();

  if (error) throw error;
  return data ? mapInstallation(data) : null;
}

export async function addInstallation(input: {
  serialNo: string;
  orderId?: string;
  customerId?: string;
  customerName: string;
  siteName?: string;
  model: string;
  capacityKva?: number;
  installDate?: string;
  installLocation?: string;
  warrantyExpire?: string;
  inspectCycleMonths?: number;
  note?: string;
}): Promise<Installation> {
  const cycleMonths = input.inspectCycleMonths || 6;
  const installDate = input.installDate || new Date().toISOString().split('T')[0];

  // Calculate next inspection date
  const nextInspect = new Date(installDate);
  nextInspect.setMonth(nextInspect.getMonth() + cycleMonths);
  const nextInspectDate = nextInspect.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('installations')
    .insert({
      serial_no: input.serialNo,
      order_id: input.orderId || null,
      customer_id: input.customerId || null,
      customer_name: input.customerName,
      site_name: input.siteName || null,
      model: input.model,
      capacity_kva: input.capacityKva || null,
      install_date: installDate,
      install_location: input.installLocation || null,
      status: '정상',
      warranty_expire: input.warrantyExpire || null,
      next_inspect_date: nextInspectDate,
      inspect_cycle_months: cycleMonths,
      note: input.note || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-generate first inspection schedule
  await supabase.from('inspection_schedules').insert({
    installation_id: data.id,
    serial_no: input.serialNo,
    scheduled_date: nextInspectDate,
    status: '예정',
  });

  return mapInstallation(data);
}

export async function updateInstallation(
  id: string,
  updates: Partial<{
    status: InstallationStatus;
    siteName: string;
    installLocation: string;
    warrantyExpire: string;
    nextInspectDate: string;
    inspectCycleMonths: number;
    note: string;
  }>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.siteName !== undefined) dbUpdates.site_name = updates.siteName;
  if (updates.installLocation !== undefined) dbUpdates.install_location = updates.installLocation;
  if (updates.warrantyExpire !== undefined) dbUpdates.warranty_expire = updates.warrantyExpire;
  if (updates.nextInspectDate !== undefined) dbUpdates.next_inspect_date = updates.nextInspectDate;
  if (updates.inspectCycleMonths !== undefined) dbUpdates.inspect_cycle_months = updates.inspectCycleMonths;
  if (updates.note !== undefined) dbUpdates.note = updates.note;

  const { error } = await supabase
    .from('installations')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
}

export async function getInstallationStats(): Promise<InstallationStats> {
  const { data, error } = await supabase
    .from('installations')
    .select('status');

  if (error) throw error;

  const rows = data || [];
  return {
    total: rows.length,
    normal: rows.filter((r) => r.status === '정상').length,
    needsInspection: rows.filter((r) => r.status === '점검필요').length,
    broken: rows.filter((r) => r.status === '고장').length,
    disposed: rows.filter((r) => r.status === '폐기').length,
  };
}

// ============================================================
// Inspection Records
// ============================================================

export async function getInspectionRecords(installationId?: string): Promise<InspectionRecord[]> {
  let query = supabase
    .from('inspection_records')
    .select('*')
    .order('inspect_date', { ascending: false });

  if (installationId) {
    query = query.eq('installation_id', installationId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapInspectionRecord);
}

export async function addInspectionRecord(input: {
  installationId: string;
  serialNo: string;
  inspectDate: string;
  inspectType: InspectType;
  inspector: string;
  checkItems: CheckItem[];
  measuredValues?: Record<string, string>;
  overallResult: InspectResult;
  actionTaken?: string;
  photoUrls?: string[];
  signatureUrl?: string;
  note?: string;
}): Promise<InspectionRecord> {
  const { data, error } = await supabase
    .from('inspection_records')
    .insert({
      installation_id: input.installationId,
      serial_no: input.serialNo,
      inspect_date: input.inspectDate,
      inspect_type: input.inspectType,
      inspector: input.inspector,
      check_items: input.checkItems,
      measured_values: input.measuredValues || {},
      overall_result: input.overallResult,
      action_taken: input.actionTaken || null,
      photo_urls: input.photoUrls || [],
      signature_url: input.signatureUrl || null,
      note: input.note || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Get installation for cycle info
  const { data: inst } = await supabase
    .from('installations')
    .select('inspect_cycle_months')
    .eq('id', input.installationId)
    .single();

  const cycleMonths = inst?.inspect_cycle_months || 6;
  const nextDate = new Date(input.inspectDate);
  nextDate.setMonth(nextDate.getMonth() + cycleMonths);
  const nextInspectDate = nextDate.toISOString().split('T')[0];

  // Update installation's next_inspect_date and status
  const statusUpdate: Record<string, unknown> = {
    next_inspect_date: nextInspectDate,
    updated_at: new Date().toISOString(),
  };
  if (input.overallResult === '불량') {
    statusUpdate.status = '고장';
  } else if (input.overallResult === '주의') {
    statusUpdate.status = '점검필요';
  } else {
    statusUpdate.status = '정상';
  }

  await supabase
    .from('installations')
    .update(statusUpdate)
    .eq('id', input.installationId);

  // Mark current schedule as completed
  await supabase
    .from('inspection_schedules')
    .update({ status: '완료', completed_record_id: data.id })
    .eq('installation_id', input.installationId)
    .eq('status', '예정')
    .lte('scheduled_date', input.inspectDate);

  // Create next inspection schedule
  await supabase.from('inspection_schedules').insert({
    installation_id: input.installationId,
    serial_no: input.serialNo,
    scheduled_date: nextInspectDate,
    status: '예정',
  });

  return mapInspectionRecord(data);
}

// ============================================================
// Inspection Schedules
// ============================================================

export async function getInspectionSchedules(filters?: {
  status?: string;
  from?: string;
  to?: string;
}): Promise<InspectionSchedule[]> {
  let query = supabase
    .from('inspection_schedules')
    .select('*')
    .order('scheduled_date', { ascending: true });

  if (filters?.status && filters.status !== '전체') {
    query = query.eq('status', filters.status);
  }
  if (filters?.from) {
    query = query.gte('scheduled_date', filters.from);
  }
  if (filters?.to) {
    query = query.lte('scheduled_date', filters.to);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapSchedule);
}

export async function updateSchedule(
  id: string,
  updates: Partial<{
    status: ScheduleStatus;
    scheduledDate: string;
    assignedTo: string;
    note: string;
    completedRecordId: string;
  }>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  if (updates.note !== undefined) dbUpdates.note = updates.note;
  if (updates.completedRecordId !== undefined) dbUpdates.completed_record_id = updates.completedRecordId;

  const { error } = await supabase
    .from('inspection_schedules')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// Parts Replacements
// ============================================================

export async function getPartsReplacements(installationId: string): Promise<PartsReplacement[]> {
  const { data, error } = await supabase
    .from('parts_replacements')
    .select('*')
    .eq('installation_id', installationId)
    .order('replaced_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapPartsReplacement);
}

export async function addPartsReplacement(input: {
  installationId: string;
  serialNo: string;
  partName: string;
  materialId?: string;
  replacedAt: string;
  reason?: string;
  cost?: number;
  warrantyMonths?: number;
  note?: string;
}): Promise<PartsReplacement> {
  const { data, error } = await supabase
    .from('parts_replacements')
    .insert({
      installation_id: input.installationId,
      serial_no: input.serialNo,
      part_name: input.partName,
      material_id: input.materialId || null,
      replaced_at: input.replacedAt,
      reason: input.reason || null,
      cost: input.cost || 0,
      warranty_months: input.warrantyMonths || 12,
      note: input.note || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPartsReplacement(data);
}

// ============================================================
// Lifecycle Timeline
// ============================================================

export async function getInstallationLifecycle(id: string): Promise<LifecycleEvent[]> {
  const events: LifecycleEvent[] = [];

  // Get installation info
  const installation = await getInstallation(id);
  if (installation.installDate) {
    events.push({
      id: `install-${id}`,
      type: 'install',
      date: installation.installDate,
      title: '설치 완료',
      description: `${installation.installLocation || installation.siteName || ''} ${installation.model}`,
      details: { orderId: installation.orderId },
    });
  }

  // Get inspections
  const inspections = await getInspectionRecords(id);
  inspections.forEach((insp) => {
    events.push({
      id: `insp-${insp.id}`,
      type: 'inspection',
      date: insp.inspectDate,
      title: `${insp.inspectType}점검`,
      description: insp.actionTaken || `검사원: ${insp.inspector}`,
      result: insp.overallResult,
    });
  });

  // Get replacements
  const replacements = await getPartsReplacements(id);
  replacements.forEach((rep) => {
    events.push({
      id: `rep-${rep.id}`,
      type: 'replacement',
      date: rep.replacedAt,
      title: '부품교체',
      description: `${rep.partName}${rep.reason ? ` - ${rep.reason}` : ''}`,
    });
  });

  // Get CS tickets for this serial
  try {
    const tickets = await getCsTickets();
    const related = tickets.filter((t) => t.serialNo === installation.serialNo);
    related.forEach((ticket) => {
      events.push({
        id: `cs-${ticket.id}`,
        type: 'cs',
        date: ticket.createdAt,
        title: `A/S ${ticket.issueType}`,
        description: ticket.description,
        result: ticket.status,
      });
    });
  } catch {
    // Silently handle
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
}

// ============================================================
// Mappers
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInstallation(row: any): Installation {
  return {
    id: row.id,
    serialNo: row.serial_no || '',
    orderId: row.order_id || undefined,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || '',
    siteName: row.site_name || undefined,
    model: row.model || '',
    capacityKva: row.capacity_kva || undefined,
    installDate: row.install_date || undefined,
    installLocation: row.install_location || undefined,
    status: (row.status || '정상') as InstallationStatus,
    warrantyExpire: row.warranty_expire || undefined,
    nextInspectDate: row.next_inspect_date || undefined,
    inspectCycleMonths: row.inspect_cycle_months || 6,
    note: row.note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInspectionRecord(row: any): InspectionRecord {
  return {
    id: row.id,
    installationId: row.installation_id || '',
    serialNo: row.serial_no || '',
    inspectDate: row.inspect_date || '',
    inspectType: (row.inspect_type || '정기') as InspectType,
    inspector: row.inspector || '',
    checkItems: (row.check_items || []) as CheckItem[],
    measuredValues: (row.measured_values || {}) as Record<string, string>,
    overallResult: (row.overall_result || '정상') as InspectResult,
    actionTaken: row.action_taken || undefined,
    csTicketId: row.cs_ticket_id || undefined,
    photoUrls: (row.photo_urls || []) as string[],
    signatureUrl: row.signature_url || undefined,
    note: row.note || undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSchedule(row: any): InspectionSchedule {
  return {
    id: row.id,
    installationId: row.installation_id || '',
    serialNo: row.serial_no || '',
    scheduledDate: row.scheduled_date || '',
    assignedTo: row.assigned_to || undefined,
    status: (row.status || '예정') as ScheduleStatus,
    completedRecordId: row.completed_record_id || undefined,
    note: row.note || undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPartsReplacement(row: any): PartsReplacement {
  return {
    id: row.id,
    installationId: row.installation_id || '',
    serialNo: row.serial_no || '',
    partName: row.part_name || '',
    materialId: row.material_id || undefined,
    replacedAt: row.replaced_at || '',
    reason: row.reason || undefined,
    cost: row.cost || 0,
    warrantyMonths: row.warranty_months || 12,
    note: row.note || undefined,
    createdAt: row.created_at,
  };
}
