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
