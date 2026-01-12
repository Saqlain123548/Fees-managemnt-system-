-- Migration: Fix fees_records table structure
-- Date: 20240103
-- Purpose: Recreate fees_records table with correct schema and RLS policies

-- Drop existing table and dependent objects
DROP TABLE IF EXISTS public.fees_records CASCADE;

-- Create fees_records table with all required columns
CREATE TABLE IF NOT EXISTS public.fees_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'card', 'cheque', 'online')),
    payment_type TEXT DEFAULT 'monthly',
    notes TEXT,
    receipt_number TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.fees_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Allow authenticated users to view fees records" ON public.fees_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert fees records" ON public.fees_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update fees records" ON public.fees_records
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete fees records" ON public.fees_records
    FOR DELETE TO authenticated USING (true);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fees_records_student_id ON public.fees_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_records_payment_date ON public.fees_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_fees_records_created_at ON public.fees_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fees_records_is_active ON public.fees_records(is_active);

