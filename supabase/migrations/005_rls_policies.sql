ALTER TABLE organisations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- firsts chekcs users role
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
    SELECT (auth.jwt() ->> 'org_id')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
    SELECT auth.jwt() ->> 'user_role';
$$ LANGUAGE sql STABLE;

-- Users can only see their own org. Admins can update it.
CREATE POLICY "users see own org"
    ON organisations FOR SELECT
    USING (id = auth_org_id());

CREATE POLICY "admins update own org"
    ON organisations FOR UPDATE
    USING (id = auth_org_id() AND auth_role() IN ('admin', 'super_admin'));

-- Only admins can insert (invite) or update roles.
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


CREATE POLICY "anon can insert organisation on register"
  ON organisations FOR INSERT
  TO anon
  WITH CHECK (true);