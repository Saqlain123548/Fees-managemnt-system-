-- =====================================================
-- FIXED: Add WhatsApp Support to Payment Reminder System
-- =====================================================
-- This migration adds WhatsApp support by:
-- 1. Renaming the column from sms to whatsapp
-- 2. Dropping old views and creating new ones
-- 3. Adding payment_dates column to settings

-- Step 1: Rename the column (if it exists as sms_notifications_enabled)
ALTER TABLE public.students RENAME COLUMN sms_notifications_enabled TO whatsapp_notifications_enabled;

-- Step 2: Add new columns if they don't exist
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.reminder_settings ADD COLUMN IF NOT EXISTS payment_dates TEXT DEFAULT '3rd-10th';

-- Step 3: Drop old views that reference old column names
DROP VIEW IF EXISTS public.reminders_summary;
DROP VIEW IF EXISTS public.students_needing_reminders;

-- Step 4: Create updated reminders_summary view
CREATE OR REPLACE VIEW public.reminders_summary AS
SELECT 
    s.id AS student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    s.contact,
    s.whatsapp_notifications_enabled,
    s.email_notifications_enabled,
    COUNT(pr.id) FILTER (WHERE pr.status = 'sent') AS total_reminders_sent,
    MAX(pr.sent_at) AS last_reminder_sent,
    COUNT(pr.id) FILTER (WHERE pr.status = 'failed') AS failed_reminders
FROM public.students s
LEFT JOIN public.payment_reminders pr ON s.id = pr.student_id
WHERE s.is_active = true
GROUP BY s.id, s.first_name, s.last_name, s.email, s.contact, s.whatsapp_notifications_enabled, s.email_notifications_enabled;

GRANT SELECT ON public.reminders_summary TO authenticated;

-- Step 5: Create updated students_needing_reminders view
CREATE OR REPLACE VIEW public.students_needing_reminders AS
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    s.contact,
    s.whatsapp_notifications_enabled,
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

-- Step 6: Create index for faster queries
DROP INDEX IF EXISTS idx_students_notifications_enabled;
CREATE INDEX IF NOT EXISTS idx_students_notifications_enabled ON public.students(whatsapp_notifications_enabled, email_notifications_enabled);

-- Success message
SELECT '✅ WhatsApp support migration completed successfully!' AS status;
SELECT 'Views updated and indexes created.' AS note;

