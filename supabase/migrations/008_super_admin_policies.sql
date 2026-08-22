-- ============================================================
-- 009_invitation_acceptance.sql
-- Secure Manager / Agent invitation acceptance
-- + Super Admin bootstrap support
-- ============================================================


-- ============================================================
-- 1. GET INVITATION BY TOKEN
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_invite_by_token(
    invite_token UUID
)
RETURNS TABLE (
    email TEXT,
    organisation_id UUID,
    organisation_name TEXT,
    role TEXT,
    expires_at TIMESTAMPTZ,
    accepted BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        i.email,
        i.organisation_id,
        o.name AS organisation_name,
        i.role,
        i.expires_at,
        i.accepted
    FROM public.organisation_invites i
    JOIN public.organisations o
        ON o.id = i.organisation_id
    WHERE i.token = invite_token;
$$;


REVOKE ALL
ON FUNCTION public.get_invite_by_token(UUID)
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION public.get_invite_by_token(UUID)
TO anon, authenticated;



-- ============================================================
-- 2. USER CREATION TRIGGER FUNCTION
--
-- Super Admin:
--   Does NOT require an organisation invitation.
--
-- Manager / Agent:
--   MUST have a valid invitation.
--   Organisation and role come from the invitation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE

    supplied_token UUID;

    invite_record public.organisation_invites%ROWTYPE;

BEGIN

    -- ========================================================
    -- SUPER ADMIN BOOTSTRAP
    -- ========================================================

    IF LOWER(NEW.email) = 'test@mail.com' THEN

        INSERT INTO public.users (
            id,
            org_id,
            full_name,
            role
        )
        VALUES (
            NEW.id,
            NULL,
            COALESCE(
                NULLIF(
                    NEW.raw_user_meta_data->>'full_name',
                    ''
                ),
                'Phodzo Nagana'
            ),
            'super_admin'
        );

        RETURN NEW;

    END IF;



    -- ========================================================
    -- MANAGER / AGENT SIGNUP
    -- Must originate from an invitation.
    -- ========================================================

    IF NEW.raw_user_meta_data->>'invite_token' IS NULL THEN

        RAISE EXCEPTION
            'A valid organisation invitation is required';

    END IF;



    -- ========================================================
    -- CONVERT INVITE TOKEN TO UUID
    -- ========================================================

    BEGIN

        supplied_token :=
            (NEW.raw_user_meta_data->>'invite_token')::UUID;

    EXCEPTION

        WHEN invalid_text_representation THEN

            RAISE EXCEPTION
                'Invalid invitation token';

    END;



    -- ========================================================
    -- FIND VALID INVITATION
    -- ========================================================

    SELECT *
    INTO invite_record
    FROM public.organisation_invites
    WHERE token = supplied_token
      AND LOWER(email) = LOWER(NEW.email)
      AND accepted = FALSE
      AND expires_at > NOW();



    -- ========================================================
    -- INVITATION DOES NOT EXIST / EXPIRED / USED
    -- ========================================================

    IF NOT FOUND THEN

        RAISE EXCEPTION
            'Invitation is invalid, expired or already accepted';

    END IF;



    -- ========================================================
    -- CREATE APPLICATION USER PROFILE
    --
    -- IMPORTANT:
    -- role and org_id come from the DB invitation.
    -- Angular cannot choose them.
    -- ========================================================

    INSERT INTO public.users (
        id,
        org_id,
        full_name,
        role
    )
    VALUES (
        NEW.id,
        invite_record.organisation_id,

        COALESCE(
            NULLIF(
                NEW.raw_user_meta_data->>'full_name',
                ''
            ),
            'Unknown'
        ),

        invite_record.role
    );



    -- ========================================================
    -- MARK INVITATION AS ACCEPTED
    -- ========================================================

    UPDATE public.organisation_invites
    SET accepted = TRUE
    WHERE id = invite_record.id;



    RETURN NEW;

END;
$$;



-- ============================================================
-- 3. FUNCTION PERMISSIONS
-- ============================================================

REVOKE ALL
ON FUNCTION public.handle_new_user()
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION public.handle_new_user()
TO supabase_auth_admin;



-- ============================================================
-- 4. ENSURE AUTH USER TRIGGER POINTS TO THIS FUNCTION
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;


CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();