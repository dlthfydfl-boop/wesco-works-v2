-- ============================================================
-- WESCO WORKS v2 — WEVIS (AI Assistant) Tables
-- Sales activities, meeting minutes, chat history, reports
-- ============================================================

-- 영업활동 기록
CREATE TABLE IF NOT EXISTS sales_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  visit_date DATE NOT NULL,
  purpose TEXT NOT NULL, -- 견적상담|정기방문|불만처리|소개|기타
  content TEXT NOT NULL,
  next_action TEXT,
  next_action_date DATE,
  order_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 회의록
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  sales_activity_id UUID,
  meeting_date DATE NOT NULL,
  attendees JSONB DEFAULT '[]',
  audio_url TEXT,
  transcript TEXT,
  structured_content JSONB, -- {agenda, discussion, decisions, actionItems, nextMeeting}
  sent_at TIMESTAMPTZ,
  sent_to JSONB DEFAULT '[]',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WEVIS 대화 이력
CREATE TABLE IF NOT EXISTS wevis_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL, -- user|assistant
  content TEXT NOT NULL,
  function_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 월간보고서
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_month TEXT NOT NULL, -- YYYY-MM
  content JSONB,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  sent_to JSONB DEFAULT '[]',
  generated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS Policies (allow-all pattern, matching existing tables)
-- ============================================================

ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on sales_activities" ON sales_activities FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on meeting_minutes" ON meeting_minutes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE wevis_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on wevis_conversations" ON wevis_conversations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on monthly_reports" ON monthly_reports FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sales_activities_customer_name ON sales_activities(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_activities_visit_date ON sales_activities(visit_date);
CREATE INDEX IF NOT EXISTS idx_sales_activities_purpose ON sales_activities(purpose);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_customer_name ON meeting_minutes(customer_name);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_date ON meeting_minutes(meeting_date);

CREATE INDEX IF NOT EXISTS idx_wevis_conversations_session_id ON wevis_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_wevis_conversations_created_at ON wevis_conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_report_month ON monthly_reports(report_month);
