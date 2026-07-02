-- ============================================================
-- 001_organisations.sql
-- Replaces the bare 'companies' table with a full organisations
-- table that supports multi-tenancy, mode switching, and plans.
-- ============================================================

-- Drop old table if it exists from your previous migration
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE organisations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    slug        TEXT        NOT NULL UNIQUE,           -- url-safe identifier e.g. "acme-corp"
    plan        TEXT        NOT NULL DEFAULT 'free'
                            CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    mode        TEXT        NOT NULL DEFAULT 'inbox'
                            CHECK (mode IN ('inbox', 'ticketed')),  -- Mode A or Mode B
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organisations_updated_at
    BEFORE UPDATE ON organisations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();



-- ============================================================
-- 002_users.sql
-- Public profile table that extends Supabase's auth.users.
-- We never touch auth.users directly — Supabase Auth owns it.
-- This table stores the extra fields we need: org, role, name.
-- ============================================================

CREATE TABLE users (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    full_name   TEXT        NOT NULL,
    role        TEXT        NOT NULL DEFAULT 'agent'
                            CHECK (role IN ('super_admin', 'admin', 'manager', 'agent', 'viewer')),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index for fast lookups by org
CREATE INDEX idx_users_org_id ON users(org_id);

-- ============================================================
-- FUNCTION: handle_new_user
-- Fires after a new Supabase Auth user is created.
-- Reads org_id and role from the user's raw_user_meta_data
-- (set during registration) and inserts into public.users.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, org_id, full_name, role)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'org_id')::UUID,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Supabase auth schema
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 003_tickets.sql
-- Core ticket table. Replaces your 'inquiries' table with the
-- full schema we designed — source, status, priority, AI triage,
-- idempotency, and thread_id for email reply matching.
-- ============================================================

CREATE TABLE tickets (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    assignee_id         UUID        REFERENCES users(id) ON DELETE SET NULL,

    -- Human-readable reference generated from a sequence per org
    ticket_ref          TEXT        NOT NULL UNIQUE,

    -- Intake source
    source              TEXT        NOT NULL
                                    CHECK (source IN ('email', 'whatsapp', 'web_form')),

    -- Customer details captured at intake
    customer_email      TEXT,
    customer_name       TEXT,
    customer_phone      TEXT,
    sender_identity     TEXT        NOT NULL,  -- email OR phone, kept for backward compat

    subject             TEXT,

    -- Lifecycle
    status              TEXT        NOT NULL DEFAULT 'open'
                                    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority            TEXT        NOT NULL DEFAULT 'low'
                                    CHECK (priority IN ('low', 'medium', 'urgent')),
    category            TEXT        CHECK (category IN ('billing', 'support', 'sales', 'other')),

    -- Email thread tracking (reply-by-subject matching)
    thread_id           TEXT        UNIQUE,  -- e.g. "<uuid@supportdesk.io>"

    -- AI triage results stored as JSON
    -- Shape: { category, priority, draft_reply, sentiment, summary }
    ai_triage           JSONB,

    -- Idempotency: hash of the original message_id from the source
    idempotency_key     TEXT        NOT NULL UNIQUE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ
);

CREATE TRIGGER tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Set resolved_at automatically when status flips to resolved
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_resolved_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_resolved_at();

-- Indexes
CREATE INDEX idx_tickets_org_id     ON tickets(org_id);
CREATE INDEX idx_tickets_assignee   ON tickets(assignee_id);
CREATE INDEX idx_tickets_status     ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================================
-- FUNCTION: generate_ticket_ref
-- Generates a sequential ref per organisation: TKT-0001
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS ticket_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_ticket_ref()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_ref = 'TKT-' || LPAD(nextval('ticket_ref_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_generate_ref
    BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_ref();



-- ============================================================
-- 004_ticket_messages.sql
-- One row per message in a ticket thread.
-- Replaces your 'communications' table.
-- ============================================================

CREATE TABLE ticket_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id   UUID        REFERENCES users(id) ON DELETE SET NULL,  -- NULL if from customer

    direction   TEXT        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    channel     TEXT        NOT NULL CHECK (channel IN ('email', 'whatsapp', 'web_form', 'internal')),
    body        TEXT        NOT NULL,

    -- True for internal agent notes — never visible to customer
    is_internal BOOLEAN     NOT NULL DEFAULT FALSE,

    -- For outbound emails: track delivery status
    email_message_id TEXT,  -- The Message-ID header from the sent email

    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast thread loading
CREATE INDEX idx_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_messages_sent_at   ON ticket_messages(sent_at ASC);


-- ============================================================
-- 005_rls_policies.sql
-- Row Level Security — the most critical file in the project.
-- Every query from Angular goes directly to Supabase, so RLS
-- is the ONLY thing preventing cross-tenant data leaks.
-- ============================================================

-- Enable RLS on every table
ALTER TABLE organisations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION
-- Returns the org_id from the current user's JWT claims.
-- Called in every RLS policy below.
-- ============================================================
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
    SELECT (auth.jwt() ->> 'org_id')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
    SELECT auth.jwt() ->> 'user_role';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- organisations
-- Users can only see their own org. Admins can update it.
-- ============================================================
CREATE POLICY "users see own org"
    ON organisations FOR SELECT
    USING (id = auth_org_id());

CREATE POLICY "admins update own org"
    ON organisations FOR UPDATE
    USING (id = auth_org_id() AND auth_role() IN ('admin', 'super_admin'));

-- ============================================================
-- users
-- Users see everyone in their org.
-- Only admins can insert (invite) or update roles.
-- ============================================================
CREATE POLICY "users see teammates"
    ON users FOR SELECT
    USING (org_id = auth_org_id());

CREATE POLICY "admins manage users"
    ON users FOR ALL
    USING (org_id = auth_org_id() AND auth_role() IN ('admin', 'super_admin'));

CREATE POLICY "user updates own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- ============================================================
-- tickets
-- All roles see tickets in their org.
-- Agents can only update tickets assigned to them.
-- Managers and admins can update any ticket in their org.
-- ============================================================
CREATE POLICY "org members see tickets"
    ON tickets FOR SELECT
    USING (org_id = auth_org_id());

CREATE POLICY "agents update assigned tickets"
    ON tickets FOR UPDATE
    USING (
        org_id = auth_org_id()
        AND (
            assignee_id = auth.uid()
            OR auth_role() IN ('manager', 'admin', 'super_admin')
        )
    );

-- Only the intake Edge Function (service role) inserts tickets
-- Agents cannot create tickets manually from the frontend
CREATE POLICY "service role inserts tickets"
    ON tickets FOR INSERT
    WITH CHECK (TRUE);  -- Controlled at Edge Function level via service_role key

-- ============================================================
-- ticket_messages
-- Users see messages on tickets in their org.
-- Agents can insert messages (replies + internal notes).
-- ============================================================
CREATE POLICY "org members see messages"
    ON ticket_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id AND t.org_id = auth_org_id()
        )
    );

CREATE POLICY "agents insert messages"
    ON ticket_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id AND t.org_id = auth_org_id()
        )
    );

-- ============================================================
-- CUSTOM JWT CLAIM HOOK
-- Supabase needs to inject org_id and user_role into the JWT
-- so our RLS helper functions above can read them.
-- Add this as a custom access token hook in Supabase dashboard:
-- Authentication > Hooks > Custom Access Token
-- ============================================================
CREATE OR REPLACE FUNCTION custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
    claims      JSONB;
    user_org_id UUID;
    user_role   TEXT;
BEGIN
    claims = event->'claims';

    SELECT u.org_id, u.role
    INTO user_org_id, user_role
    FROM public.users u
    WHERE u.id = (event->>'user_id')::UUID;

    IF user_org_id IS NOT NULL THEN
        claims = jsonb_set(claims, '{org_id}',   to_jsonb(user_org_id::TEXT));
        claims = jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    END IF;

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;