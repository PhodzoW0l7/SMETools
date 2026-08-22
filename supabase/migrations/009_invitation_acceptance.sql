-- ============================================================
-- 009_invitation_acceptance.sql
-- Manager / Agent invitation acceptance
-- ============================================================

-- Publicly validate an invitation using its secret token.
CREATE OR REPLACE FUNCTION public.get_invite_by_token(invite_token UUID)
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
        o.name,
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


-- Replace signup trigger.
-- Role/org are derived from the invitation, NOT frontend metadata.
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

    -- New application accounts must be invitation based.
    IF NEW.raw_user_meta_data->>'invite_token' IS NULL THEN
        RAISE EXCEPTION 'A valid organisation invitation is required';
    END IF;

    BEGIN
        supplied_token :=
            (NEW.raw_user_meta_data->>'invite_token')::UUID;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Invalid invitation token';
    END;

    SELECT *
    INTO invite_record
    FROM public.organisation_invites
    WHERE token = supplied_token
      AND LOWER(email) = LOWER(NEW.email)
      AND accepted = FALSE
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation is invalid, expired or already accepted';
    END IF;

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
            NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
            'Unknown'
        ),
        invite_record.role
    );

    UPDATE public.organisation_invites
    SET accepted = TRUE
    WHERE id = invite_record.id;

    RETURN NEW;
END;
$$;