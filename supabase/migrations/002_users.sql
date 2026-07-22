CREATE TABLE users (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    full_name   TEXT        NOT NULL,
    role        TEXT        NOT NULL DEFAULT 'super_admin'
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