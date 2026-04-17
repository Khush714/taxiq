-- Payments log table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  user_email TEXT,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (edge function uses service role, but we also allow anon
-- so the logging path is resilient). No SELECT policy = nobody can read via anon/auth keys.
CREATE POLICY "Anyone can insert payment records"
ON public.payments
FOR INSERT
WITH CHECK (true);

-- Helpful index for lookups
CREATE INDEX idx_payments_email ON public.payments(user_email);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);