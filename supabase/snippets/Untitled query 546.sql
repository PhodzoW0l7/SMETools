DROP POLICY IF EXISTS "Allow anonymous organisation creation" ON public.organisations;

-- 2. Remove the anonymous select policy
DROP POLICY IF EXISTS "Allow anonymous organisation lookups" ON public.organisations;