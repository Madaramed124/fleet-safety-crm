-- Add payment and charge status columns to the charges table
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS charge_status TEXT DEFAULT 'pending';

-- Ensure any future inserted charges have default status values
ALTER TABLE public.charges
  ALTER COLUMN payment_status SET DEFAULT 'unpaid',
  ALTER COLUMN charge_status SET DEFAULT 'pending';
