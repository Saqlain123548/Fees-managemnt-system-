-- Payment Reminder System - Database Migration
-- Migration: Create payment reminders tables

-- Create payment_reminders table to track all sent reminders
CREATE TABLE IF NOT EXISTS public.payment_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL DEFAULT 'email', -- 'sms', 'email', 'both'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    message TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_reminders
CREATE POLICY "Authenticated users can view payment reminders" ON public.payment_reminders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payment reminders" ON public.payment_reminders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment reminders" ON public.payment_reminders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payment reminders" ON public.payment_reminders
    FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_student_id ON public.payment_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON public.payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_created_at ON public.payment_reminders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON public.payment_reminders(sent_at DESC);


-- Create reminder_settings table for configurable reminder preferences
CREATE TABLE IF NOT EXISTS public.reminder_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT true,
    reminder_days TEXT[] DEFAULT ARRAY['3', '4', '5', '6', '7', '8', '9', '10'], -- Days of month to send reminders
    sms_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    message_template TEXT DEFAULT 'Dear {student_name}, This is a friendly reminder that your monthly fees payment is due. Please make your payment between 3rd-10th of this month. Contact us if you have any questions. Best regards, IT Center Fees Management',
    sms_message_template TEXT DEFAULT 'Dear {student_name}, Please pay your monthly fees between 3rd-10th of this month. - IT Center',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminder_settings
CREATE POLICY "Authenticated users can view reminder settings" ON public.reminder_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update reminder settings" ON public.reminder_settings
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Create only one default settings record
INSERT INTO public.reminder_settings (id, is_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_reminder_settings_is_enabled ON public.reminder_settings(is_enabled);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_reminder_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reminder_settings_updated_at ON public.reminder_settings;
CREATE TRIGGER set_reminder_settings_updated_at
    BEFORE UPDATE ON public.reminder_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_reminder_settings_updated_at();


-- Add notification preference columns to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_students_notifications_enabled ON public.students(sms_notifications_enabled, email_notifications_enabled);


-- Create view for reminder summary
CREATE OR REPLACE VIEW public.reminders_summary AS
SELECT 
    s.id AS student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    s.contact,
    COUNT(pr.id) FILTER (WHERE pr.status = 'sent') AS total_reminders_sent,
    MAX(pr.sent_at) AS last_reminder_sent,
    COUNT(pr.id) FILTER (WHERE pr.status = 'failed') AS failed_reminders
FROM public.students s
LEFT JOIN public.payment_reminders pr ON s.id = pr.student_id
WHERE s.is_active = true
GROUP BY s.id, s.first_name, s.last_name, s.email, s.contact;

-- Grant access to the view
GRANT SELECT ON public.reminders_summary TO authenticated;

