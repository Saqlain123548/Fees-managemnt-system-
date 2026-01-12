-- IT Center - Fees Records Table
-- Simplified version for IT Center fee management

CREATE TABLE IF NOT EXISTS public.fees_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'card', 'other')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.fees_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view fees records" ON public.fees_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert fees records" ON public.fees_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update fees records" ON public.fees_records
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fees records" ON public.fees_records
    FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fees_records_student_id ON public.fees_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_records_payment_date ON public.fees_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_fees_records_created_at ON public.fees_records(created_at DESC);

-- View for fees summary per student
CREATE OR REPLACE VIEW public.students_fees_summary AS
SELECT 
    s.id AS student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    COALESCE(SUM(fr.amount), 0) AS total_paid,
    COUNT(fr.id) AS total_payments,
    MAX(fr.payment_date) AS last_payment_date
FROM public.students s
LEFT JOIN public.fees_records fr ON s.id = fr.student_id AND fr.is_active = true
WHERE s.is_active = true
GROUP BY s.id, s.first_name, s.last_name, s.email;

GRANT SELECT ON public.students_fees_summary TO authenticated;

