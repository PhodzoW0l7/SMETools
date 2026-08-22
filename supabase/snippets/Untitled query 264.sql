SELECT
    i.id,
    i.email,
    i.token,
    i.role,
    i.accepted,
    i.expires_at,
    o.name AS organisation
FROM public.organisation_invites i
JOIN public.organisations o
    ON o.id = i.organisation_id
WHERE i.accepted = FALSE
ORDER BY i.created_at DESC;