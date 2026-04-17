-- Drop overly permissive insert policy. Edge function uses SERVICE_ROLE which bypasses RLS.
DROP POLICY IF EXISTS "Anyone can insert payment records" ON public.payments;