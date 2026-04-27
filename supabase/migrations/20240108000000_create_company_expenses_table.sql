-- Company Expenses Table
-- Tracks company expenses like Rent, Salary, Utilities, etc.

CREATE TABLE IF NOT EXISTS public.company_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view expenses" ON public.company_expenses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert expenses" ON public.company_expenses
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses" ON public.company_expenses
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expenses" ON public.company_expenses
    FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_expenses_date ON public.company_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_company_expenses_type ON public.company_expenses(type);
CREATE INDEX IF NOT EXISTS idx_company_expenses_created_at ON public.company_expenses(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_company_expenses_updated_at ON public.company_expenses;
CREATE TRIGGER set_company_expenses_updated_at
    BEFORE UPDATE ON public.company_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_company_expenses_updated_at();

