-- Fees Management System Database Schema
-- Migration: Create fees_records table for tracking payments

-- Create fees_records table
CREATE TABLE IF NOT EXISTS public.fees_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.fees_records ENABLE ROW LEVEL SECURITY;

-- Create policies for fees_records
-- Allow authenticated users to view all fees records
CREATE POLICY "Allow authenticated users to view fees records"
    ON public.fees_records
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert fees records
CREATE POLICY "Allow authenticated users to insert fees records"
    ON public.fees_records
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to delete fees records (soft delete or hard delete)
CREATE POLICY "Allow authenticated users to delete fees records"
    ON public.fees_records
    FOR DELETE
    TO authenticated
    USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fees_records_student_id ON public.fees_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_records_created_at ON public.fees_records(created_at DESC);

-- Create a view for fees summary per student
CREATE OR REPLACE VIEW public.students_fees_summary AS
SELECT 
    s.id AS student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    COALESCE(SUM(fr.amount), 0) AS total_paid,
    COALESCE(
        (SELECT SUM(amount) FROM public.fees_records WHERE student_id = s.id),
        0
    ) AS total_paid_alternate
FROM public.students s
LEFT JOIN public.fees_records fr ON s.id = fr.student_id
WHERE s.is_active = true
GROUP BY s.id, s.first_name, s.last_name, s.email;

-- Grant access to the view
GRANT SELECT ON public.students_fees_summary TO authenticated;

