-- ============================================
-- Payment Reminder System - Tables Only
-- Run this in Supabase SQL Editor first
-- ============================================

-- Step 1: Create payment_reminders table
CREATE TABLE IF NOT EXISTS public.payment_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'pending',
    message TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payment reminders" ON public.payment_reminders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payment reminders" ON public.payment_reminders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment reminders" ON public.payment_reminders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_student_id ON public.payment_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON public.payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_created_at ON public.payment_reminders(created_at DESC);

-- Step 2: Create reminder_settings table
CREATE TABLE IF NOT EXISTS public.reminder_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT true,
    reminder_days TEXT[] DEFAULT ARRAY['3', '4', '5', '6', '7', '8', '9', '10'],
    sms_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    message_template TEXT DEFAULT 'Dear {student_name}, This is a friendly reminder that your monthly fees payment is due.',
    sms_message_template TEXT DEFAULT 'Dear {student_name}, Please pay your monthly fees between 3rd-10th.',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reminder settings" ON public.reminder_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update reminder settings" ON public.reminder_settings
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Create default settings record
INSERT INTO public.reminder_settings (id, is_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

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

-- Step 3: Add notification columns to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Index
CREATE INDEX IF NOT EXISTS idx_students_notifications_enabled ON public.students(sms_notifications_enabled, email_notifications_enabled);

-- Step 4: Create helper view
CREATE OR REPLACE VIEW public.students_needing_reminders AS
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    s.contact,
    s.sms_notifications_enabled,
    s.email_notifications_enabled,
    COALESCE(
        (SELECT MAX(payment_date) FROM public.fees_records WHERE student_id = s.id),
        '1970-01-01'::date
    ) as last_payment_date,
    CASE 
        WHEN COALESCE(
            (SELECT MAX(payment_date) FROM public.fees_records WHERE student_id = s.id),
            '1970-01-01'::date
        ) >= DATE_TRUNC('month', CURRENT_DATE)
        THEN false
        ELSE true
    END as needs_reminder
FROM public.students s
WHERE s.is_active = true;

GRANT SELECT ON public.students_needing_reminders TO authenticated;

-- Done!
SELECT '✅ Payment reminder tables created successfully!' AS status;
SELECT 'Now go to /reminders in your app and click "Send Reminders Now" to test.' AS next_step;

