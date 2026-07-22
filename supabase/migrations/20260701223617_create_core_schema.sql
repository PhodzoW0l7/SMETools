-- ============================================================
-- 004_ticket_messages.sql
-- One row per message in a ticket thread.
-- Replaces your 'communications' table.
-- ============================================================




-- ============================================================
-- 
-- Row Level Security — the most critical file in the project.
-- Every query from Angular goes directly to Supabase, so RLS
-- is the ONLY thing preventing cross-tenant data leaks.
-- ============================================================

-- Enable RLS on every table
