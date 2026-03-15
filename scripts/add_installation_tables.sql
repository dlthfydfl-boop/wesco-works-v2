-- ============================================================
-- WESCO WORKS v2 — Installation Master & Periodic Inspection
-- Phase 1.5: Equipment lifecycle tracking tables
-- ============================================================

-- 설치 마스터
CREATE TABLE IF NOT EXISTS installations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_no TEXT UNIQUE NOT NULL,
  order_id TEXT,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  site_name TEXT,
  model TEXT NOT NULL,
  capacity_kva INTEGER,
  install_date DATE,
  install_location TEXT,
  status TEXT DEFAULT '정상',  -- 정상|점검필요|고장|폐기
  warranty_expire DATE,
  next_inspect_date DATE,
  inspect_cycle_months INTEGER DEFAULT 6,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 점검 기록
CREATE TABLE IF NOT EXISTS inspection_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  installation_id UUID REFERENCES installations(id),
  serial_no TEXT NOT NULL,
  inspect_date DATE NOT NULL,
  inspect_type TEXT DEFAULT '정기',  -- 정기|긴급|설치후
  inspector TEXT NOT NULL,
  check_items JSONB NOT NULL DEFAULT '[]',
  measured_values JSONB DEFAULT '{}',
  overall_result TEXT DEFAULT '정상',  -- 정상|주의|불량
  action_taken TEXT,
  cs_ticket_id INTEGER,
  photo_urls JSONB DEFAULT '[]',
  signature_url TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 점검 양식 마스터
CREATE TABLE IF NOT EXISTS inspection_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_model TEXT NOT NULL,
  check_items JSONB NOT NULL,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 부품 교체 이력
CREATE TABLE IF NOT EXISTS parts_replacements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  installation_id UUID REFERENCES installations(id),
  serial_no TEXT NOT NULL,
  part_name TEXT NOT NULL,
  material_id TEXT,
  replaced_at DATE NOT NULL,
  reason TEXT,
  cost INTEGER DEFAULT 0,
  warranty_months INTEGER DEFAULT 12,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 점검 스케줄
CREATE TABLE IF NOT EXISTS inspection_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  installation_id UUID REFERENCES installations(id),
  serial_no TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  assigned_to TEXT,
  status TEXT DEFAULT '예정',  -- 예정|완료|연기|취소
  completed_record_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS Policies (allow-all pattern, matching existing tables)
-- ============================================================

ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on installations" ON installations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on inspection_records" ON inspection_records FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on inspection_templates" ON inspection_templates FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE parts_replacements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on parts_replacements" ON parts_replacements FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE inspection_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on inspection_schedules" ON inspection_schedules FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_installations_serial_no ON installations(serial_no);
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
CREATE INDEX IF NOT EXISTS idx_installations_customer_name ON installations(customer_name);

CREATE INDEX IF NOT EXISTS idx_inspection_records_serial_no ON inspection_records(serial_no);
CREATE INDEX IF NOT EXISTS idx_inspection_records_installation_id ON inspection_records(installation_id);

CREATE INDEX IF NOT EXISTS idx_parts_replacements_serial_no ON parts_replacements(serial_no);
CREATE INDEX IF NOT EXISTS idx_parts_replacements_installation_id ON parts_replacements(installation_id);

CREATE INDEX IF NOT EXISTS idx_inspection_schedules_serial_no ON inspection_schedules(serial_no);
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_scheduled_date ON inspection_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_status ON inspection_schedules(status);
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_installation_id ON inspection_schedules(installation_id);
