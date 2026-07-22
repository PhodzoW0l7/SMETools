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