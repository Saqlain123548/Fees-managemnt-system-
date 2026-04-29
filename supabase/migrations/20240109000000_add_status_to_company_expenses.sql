-- Add status column to company_expenses table

-- Add status column with default 'Pending' and constraint
ALTER TABLE public.company_expenses
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending'
CHECK (status IN ('Paid', 'Pending', 'Due'));

-- Update existing rows to 'Pending' (already default, but explicit)
UPDATE public.company_expenses SET status = 'Pending' WHERE status IS NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_company_expenses_status ON public.company_expenses(status);
