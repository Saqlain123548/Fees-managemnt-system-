-- ============================================
-- Payment Reminder System - Complete Setup
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Enable pg_cron extension
-- This allows scheduled jobs in the database
SELECT 'Enabling pg_cron extension...' AS status;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- Step 2: Create payment_reminders table
-- Tracks all sent reminders
-- ============================================
SELECT 'Creating payment_reminders table...' AS status;

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
DROP POLICY IF EXISTS "Authenticated users can view payment reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Authenticated users can insert payment reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Authenticated users can update payment reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Authenticated users can delete payment reminders" ON public.payment_reminders;

CREATE POLICY "Authenticated users can view payment reminders" ON public.payment_reminders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payment reminders" ON public.payment_reminders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment reminders" ON public.payment_reminders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payment reminders" ON public.payment_reminders
    FOR DELETE TO authenticated USING (true);

-- Indexes
DROP INDEX IF EXISTS idx_payment_reminders_student_id;
DROP INDEX IF EXISTS idx_payment_reminders_status;
DROP INDEX IF EXISTS idx_payment_reminders_created_at;
DROP INDEX IF EXISTS idx_payment_reminders_sent_at;

CREATE INDEX IF NOT EXISTS idx_payment_reminders_student_id ON public.payment_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON public.payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_created_at ON public.payment_reminders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON public.payment_reminders(sent_at DESC);

-- ============================================
-- Step 3: Create reminder_settings table
-- Configurable reminder preferences
-- ============================================
SELECT 'Creating reminder_settings table...' AS status;

CREATE TABLE IF NOT EXISTS public.reminder_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT true,
    reminder_days TEXT[] DEFAULT ARRAY['3', '4', '5', '6', '7', '8', '9', '10'],
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
DROP POLICY IF EXISTS "Authenticated users can view reminder settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Authenticated users can update reminder settings" ON public.reminder_settings;

CREATE POLICY "Authenticated users can view reminder settings" ON public.reminder_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update reminder settings" ON public.reminder_settings
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Index
DROP INDEX IF EXISTS idx_reminder_settings_is_enabled;
CREATE INDEX IF NOT EXISTS idx_reminder_settings_is_enabled ON public.reminder_settings(is_enabled);

-- Create default settings record
INSERT INTO public.reminder_settings (id, is_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_reminder_settings_updated_at ON public.reminder_settings;
CREATE OR REPLACE FUNCTION update_reminder_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reminder_settings_updated_at
    BEFORE UPDATE ON public.reminder_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_reminder_settings_updated_at();

-- ============================================
-- Step 4: Add notification preference columns
-- ============================================
SELECT 'Adding notification columns to students table...' AS status;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Index
DROP INDEX IF EXISTS idx_students_notifications_enabled;
CREATE INDEX IF NOT EXISTS idx_students_notifications_enabled ON public.students(sms_notifications_enabled, email_notifications_enabled);

-- ============================================
-- Step 5: Create helper views
-- ============================================
SELECT 'Creating helper views...' AS status;

-- View for reminder summary
DROP VIEW IF EXISTS public.reminders_summary;
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

-- View for students needing reminders
DROP VIEW IF EXISTS public.students_needing_reminders;
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

-- Grant access to views
GRANT SELECT ON public.reminders_summary TO authenticated;
GRANT SELECT ON public.students_needing_reminders TO authenticated;

-- ============================================
-- Step 6: Create cron job function
-- ============================================
SELECT 'Creating cron job function...' AS status;

DROP FUNCTION IF EXISTS public.send_payment_reminders_cron();
CREATE OR REPLACE FUNCTION public.send_payment_reminders_cron()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Payment reminder cron job executed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 7: Grant pg_monitor role for cron
-- This is needed for the cron job to work
-- ============================================
SELECT 'Granting pg_monitor role...' AS status;
GRANT pg_monitor TO postgres;

-- ============================================
-- Step 8: Create cron job for automated reminders
-- Runs at 9 AM on days 3-10 of every month
-- ============================================
SELECT 'Creating automated cron job...' AS status;

-- Unschedule any existing job with the same name (supabase specific)
-- Note: If this fails, you can manually delete from Supabase Dashboard → Cron Jobs

-- Create the cron job
-- IMPORTANT: Replace 'https://your-domain.com' with your actual domain
-- IMPORTANT: Replace 'YOUR_CRON_KEY' with the key from your .env.local
-- IMPORTANT: If pg_cron is not enabled in your Supabase project, skip this step
-- You can use an external cron service instead (see Setup Guide)

-- First, check if pg_cron is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'payment-reminders',
            '0 9 3-10 * *',
            $$
            SELECT
                net.http_post(
                    url:='https://nixvwxmtusiecohjgqsq.supabase.co/api/reminders?manual=true',
                    headers:='{"Content-Type": "application/json", "Authorization": "Bearer your_secure_cron_key_here"}'::jsonb
                ) AS request_id;
            $$
        );
        RAISE NOTICE 'Cron job created successfully!';
    ELSE
        RAISE WARNING 'pg_cron extension is not enabled. Skipping cron job creation.';
        RAISE NOTICE 'You can use an external cron service like cron-job.org instead.';
    END IF;
END $$;

-- ============================================
-- Verification
-- ============================================
SELECT 'Verification - Listing created tables...' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payment_reminders', 'reminder_settings')
ORDER BY table_name;

SELECT 'Verification - Listing cron jobs...' AS status;
SELECT jobid, jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'payment-reminders';

SELECT '========================================' AS status;
SELECT 'Setup Complete!' AS status;
SELECT '========================================' AS status;
SELECT '' AS status;
SELECT 'Next Steps:' AS status;
SELECT '1. Update the cron job URL with your actual domain' AS status;
SELECT '2. Update the cron job with your actual CRON_KEY from .env.local' AS status;
SELECT '3. Configure Twilio credentials in .env.local for SMS' AS status;
SELECT '4. Configure Gmail SMTP credentials in .env.local for Email' AS status;
SELECT '5. Navigate to /reminders in your app to test' AS status;
SELECT '' AS status;
SELECT 'To test manually, run this in your terminal:' AS status;
SELECT 'curl -X POST "http://localhost:3000/api/reminders?manual=true"' AS status;

