CREATE TABLE organisation_invites (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT NOT NULL,

    organisation_id UUID NOT NULL
        REFERENCES organisations(id)
        ON DELETE CASCADE,

    role TEXT NOT NULL
        CHECK (
            role IN (
                'admin',
                'manager',
                'agent'
            )
        ),

    token UUID NOT NULL DEFAULT gen_random_uuid(),

    accepted BOOLEAN NOT NULL DEFAULT FALSE,

    expires_at TIMESTAMPTZ NOT NULL
        DEFAULT (NOW() + interval '7 days'),

    invited_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_invite_email_org
ON organisation_invites(email, organisation_id);

CREATE INDEX idx_invite_token
ON organisation_invites(token);