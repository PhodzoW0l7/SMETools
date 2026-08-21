-- 1. Custom Access Token Hook
CREATE OR REPLACE FUNCTION custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
    claims      JSONB;
    user_org_id UUID;
    user_role   TEXT;
BEGIN
    claims := event->'claims';

    SELECT u.org_id, u.role
    INTO user_org_id, user_role
    FROM public.users u
    WHERE u.id = (event->>'user_id')::UUID;

    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    END IF;

    IF user_org_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id::TEXT));
    END IF;

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Secure token hook permissions
GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION custom_access_token_hook FROM PUBLIC;

-- 2. Safer default role
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'agent';

-- 3. Super admin: full access to organisations
DROP POLICY IF EXISTS "super admins see all organisations"
ON public.organisations;
CREATE POLICY "super admins see all organisations"
ON public.organisations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "super admins insert organisations" ON organisations;
CREATE POLICY "super admins insert organisations"
    ON organisations FOR INSERT
    TO authenticated
    WITH CHECK (auth_role() = 'super_admin');

DROP POLICY IF EXISTS "super admins update all organisations" ON organisations;
CREATE POLICY "super admins update all organisations"
    ON organisations FOR UPDATE
    USING (auth_role() = 'super_admin');

DROP POLICY IF EXISTS "super admins delete organisations" ON organisations;
CREATE POLICY "super admins delete organisations"
    ON organisations FOR DELETE
    USING (auth_role() = 'super_admin');

-- 4. Super admin: full access to users across all orgs
DROP POLICY IF EXISTS "super admins see all users" ON users;
CREATE POLICY "super admins see all users"
    ON users FOR SELECT
    USING (auth_role() = 'super_admin');

DROP POLICY IF EXISTS "super admins manage all users" ON users;
CREATE POLICY "super admins manage all users"
    ON users FOR ALL
    USING (auth_role() = 'super_admin')
    WITH CHECK (auth_role() = 'super_admin');

-- 5. Secure organisation_invites
ALTER TABLE organisation_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super admins manage all invites" ON organisation_invites;
CREATE POLICY "super admins manage all invites"
    ON organisation_invites FOR ALL
    USING (auth_role() = 'super_admin')
    WITH CHECK (auth_role() = 'super_admin');

DROP POLICY IF EXISTS "org members see own org invites" ON organisation_invites;
CREATE POLICY "org members see own org invites"
    ON organisation_invites FOR SELECT
    USING (organisation_id = auth_org_id());

DROP POLICY IF EXISTS "managers invite into own org" ON organisation_invites;
CREATE POLICY "managers invite into own org"
    ON organisation_invites FOR INSERT
    WITH CHECK (
        organisation_id = auth_org_id()
        AND auth_role() IN ('admin', 'manager')
    );

-- 6. RPC for Angular service
CREATE OR REPLACE FUNCTION public.create_organisation_and_invite_manager(
    organisation_name TEXT,
    organisation_slug TEXT,
    manager_name TEXT,
    manager_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    caller_role TEXT;
BEGIN
    -- Verify caller is the Super Admin
    SELECT role
    INTO caller_role
    FROM public.users
    WHERE id = auth.uid();

    IF caller_role IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'Only platform administrators can create organisations';
    END IF;

    -- Create organisation
    INSERT INTO public.organisations (name, slug)
    VALUES (organisation_name, organisation_slug)
    RETURNING id INTO new_org_id;

    -- Create Manager invitation
    INSERT INTO public.organisation_invites (email, organisation_id, role, invited_by)
    VALUES (LOWER(manager_email), new_org_id, 'manager', auth.uid());

    RETURN new_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organisation_and_invite_manager(TEXT, TEXT, TEXT, TEXT) TO authenticated;

GRANT SELECT ON public.users TO authenticated;

DROP POLICY IF EXISTS "users read own profile"
ON public.users;

CREATE POLICY "users read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.organisations
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.organisation_invites
TO authenticated;