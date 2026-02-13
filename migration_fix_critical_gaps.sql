-- ============================================================
-- Warehouse Scanner App - Database Migration
-- ============================================================
-- This migration creates the required tables, functions, indexes,
-- and triggers for the warehouse scanning application.
--
-- Run this in Supabase Dashboard → SQL Editor → New Query → RUN
-- ============================================================

-- 1. Create the parcels table (core data store)
CREATE TABLE IF NOT EXISTS parcels (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  awb TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'READY', 'PICKED_UP')),
  operator_ready TEXT,
  operator_picked_up TEXT,
  ready_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create the scan_log table (audit trail)
CREATE TABLE IF NOT EXISTS scan_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  awb TEXT NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('READY', 'PICKED_UP')),
  operator TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('ACCEPTED', 'REJECTED', 'DUPLICATE')),
  message TEXT,
  batch_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_parcels_awb ON parcels (awb);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels (status);
CREATE INDEX IF NOT EXISTS idx_parcels_ready_at ON parcels (ready_at);
CREATE INDEX IF NOT EXISTS idx_parcels_picked_up_at ON parcels (picked_up_at);
CREATE INDEX IF NOT EXISTS idx_scan_log_operator ON scan_log (operator);
CREATE INDEX IF NOT EXISTS idx_scan_log_scan_type ON scan_log (scan_type);
CREATE INDEX IF NOT EXISTS idx_scan_log_created_at ON scan_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_log_awb ON scan_log (awb);

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON parcels;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Create the get_warehouse_counts() function
-- Returns today's totals for the dashboard
CREATE OR REPLACE FUNCTION get_warehouse_counts()
RETURNS TABLE (
  ready_today BIGINT,
  picked_up_today BIGINT,
  created_not_ready BIGINT,
  ready_not_picked BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM parcels WHERE ready_at >= CURRENT_DATE)::BIGINT AS ready_today,
    (SELECT COUNT(*) FROM parcels WHERE picked_up_at >= CURRENT_DATE)::BIGINT AS picked_up_today,
    (SELECT COUNT(*) FROM parcels WHERE status = 'CREATED')::BIGINT AS created_not_ready,
    (SELECT COUNT(*) FROM parcels WHERE status = 'READY')::BIGINT AS ready_not_picked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable Row Level Security
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_log ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow authenticated and anon users to read/write
-- (Edge Functions use the service_role key, but frontend uses anon key for counts)
CREATE POLICY IF NOT EXISTS "Allow read access to parcels" ON parcels
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert to parcels" ON parcels
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow update to parcels" ON parcels
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Allow read access to scan_log" ON scan_log
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert to scan_log" ON scan_log
  FOR INSERT WITH CHECK (true);

-- 7. Grant access to the anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON parcels TO anon, authenticated;
GRANT SELECT, INSERT ON scan_log TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_warehouse_counts() TO anon, authenticated;

-- ============================================================
-- Verification: Run this after migration to confirm it worked
-- SELECT * FROM get_warehouse_counts();
-- Expected: ready_today=0, picked_up_today=0, created_not_ready=0, ready_not_picked=0
-- ============================================================
