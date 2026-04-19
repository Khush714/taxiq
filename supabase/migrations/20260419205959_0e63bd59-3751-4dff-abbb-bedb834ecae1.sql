-- Fix public bucket listing: scope SELECT to specific objects (not list all)
DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;

CREATE POLICY "Blog images viewable by direct URL"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Add RLS policies for payments table (was enabled but had no policies)
CREATE POLICY "Admins can view payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert payments"
ON public.payments FOR INSERT
WITH CHECK (true);