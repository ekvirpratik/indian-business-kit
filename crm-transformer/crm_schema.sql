-- ============================================================
-- CRM TRANSFORMER — COMPLETE DATABASE SCHEMA & SECURITY POLICIES
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. CRM LEADS
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  company         TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  source          TEXT DEFAULT 'Manual',
  status          TEXT DEFAULT 'Warm',
  stage           TEXT DEFAULT 'new',
  budget          TEXT DEFAULT '',
  requirement     TEXT DEFAULT '',
  deal_value      DECIMAL(12,2) DEFAULT 0,
  won_amount      DECIMAL(12,2) DEFAULT 0,
  notes           TEXT DEFAULT '',
  assigned_to     BIGINT,
  lost_reason     TEXT DEFAULT '',
  lead_score      INT DEFAULT 0,
  next_followup   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON public.crm_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON public.crm_leads(user_id, stage);

-- 2. PIPELINE STAGES
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  position        INT DEFAULT 0,
  color           TEXT DEFAULT '#6366f1',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_crm_stages_user ON public.crm_pipeline_stages(user_id);

-- 3. TASKS & FOLLOW-UPS
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  description     TEXT NOT NULL,
  lead_id         BIGINT REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  assigned_to     BIGINT,
  due_date        DATE,
  status          TEXT DEFAULT 'Pending',
  priority        TEXT DEFAULT 'Medium',
  type            TEXT DEFAULT 'task',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON public.crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON public.crm_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead ON public.crm_tasks(lead_id);

-- 4. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.crm_team_members (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  role            TEXT DEFAULT 'Sales rep',
  status          TEXT DEFAULT 'Active',
  avatar_url      TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_team_user ON public.crm_team_members(user_id);

-- 5. CRM SETTINGS
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               TEXT NOT NULL UNIQUE,
  company_name          TEXT DEFAULT '',
  owner_name            TEXT DEFAULT '',
  owner_role            TEXT DEFAULT '',
  industry              TEXT DEFAULT '',
  whatsapp              TEXT DEFAULT '',
  email                 TEXT DEFAULT '',
  logo_url              TEXT DEFAULT '',
  auto_assign           TEXT DEFAULT '',
  wa_template           TEXT DEFAULT 'Hi {{name}}, Thank you for your interest in {{company}}. We received your inquiry regarding {{requirement}}...',
  requirement_options   JSONB DEFAULT '["Web App", "Mobile App", "Consulting", "Enterprise"]',
  budget_options        JSONB DEFAULT '["₹5L - ₹15L", "₹15L - ₹30L", "₹30L - ₹50L", "₹50L+"]',
  lead_sources          JSONB DEFAULT '["Google Business Profile", "IndiaMART", "JustDial", "WhatsApp", "Website Form", "Referral", "Walk-in", "Phone Call", "Instagram", "Facebook"]',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.crm_activity_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  lead_id         BIGINT REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  team_member_id  BIGINT REFERENCES public.crm_team_members(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  description     TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activity_user ON public.crm_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_lead ON public.crm_activity_log(lead_id);

-- 7. WHATSAPP LOG
CREATE TABLE IF NOT EXISTS public.crm_whatsapp_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  lead_id         BIGINT REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  message         TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS idx_crm_wa_user ON public.crm_whatsapp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_wa_lead ON public.crm_whatsapp_log(lead_id);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  text            TEXT NOT NULL,
  type            TEXT DEFAULT 'info',
  is_read         BOOLEAN DEFAULT FALSE,
  link_to         TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_notif_user ON public.crm_notifications(user_id, is_read);

-- 9. QUOTATIONS
CREATE TABLE IF NOT EXISTS public.crm_quotations (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  lead_id         BIGINT REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  quotation_no    TEXT NOT NULL,
  items           JSONB DEFAULT '[]',
  subtotal        DECIMAL(12,2) DEFAULT 0,
  gst_percent     DECIMAL(4,2) DEFAULT 18.00,
  gst_amount      DECIMAL(12,2) DEFAULT 0,
  total           DECIMAL(12,2) DEFAULT 0,
  notes           TEXT DEFAULT '',
  status          TEXT DEFAULT 'Draft',
  valid_until     DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_quot_user ON public.crm_quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_quot_lead ON public.crm_quotations(lead_id);

-- ============================================================
-- STORAGE BUCKETS SETUP
-- ============================================================

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-assets', 'crm-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES FOR STORAGE (Scoped by custom user header)
DROP POLICY IF EXISTS "Users can upload CRM assets to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can view CRM assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own CRM assets from their folder" ON storage.objects;

CREATE POLICY "Users can upload CRM assets to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crm-assets' AND
  (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'x-client-user-id'
);

CREATE POLICY "Public can view CRM assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'crm-assets');

CREATE POLICY "Users can delete own CRM assets from their folder"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'crm-assets' AND
  (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'x-client-user-id'
);

-- ============================================================
-- DATABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all CRM tables
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_whatsapp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quotations ENABLE ROW LEVEL SECURITY;

-- Create Access Policies (Scoped to the authenticated user's header)
CREATE POLICY "Users can access their own leads" ON public.crm_leads
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own stages" ON public.crm_pipeline_stages
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own tasks" ON public.crm_tasks
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own team members" ON public.crm_team_members
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own settings" ON public.crm_settings
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own activity logs" ON public.crm_activity_log
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own WhatsApp logs" ON public.crm_whatsapp_log
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own notifications" ON public.crm_notifications
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');

CREATE POLICY "Users can access their own quotations" ON public.crm_quotations
  FOR ALL USING (user_id = current_setting('request.headers', true)::json->>'x-client-user-id');
