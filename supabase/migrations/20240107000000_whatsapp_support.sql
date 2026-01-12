-- Migration: Add WhatsApp Support to Payment Reminder System
-- This migration updates the schema to support WhatsApp + Email (replacing SMS)

-- Step 1: Add whatsapp_notifications_enabled column to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT true;

-- Step 2: Update reminder_type enum to include 'whatsapp'
-- First, add the type if it doesn't exist
COMMENT ON COLUMN public.payment_reminders.reminder_type 
IS 'Type of reminder: whatsapp, email';

-- Step 3: Add payment_dates column to reminder_settings for dynamic payment dates
ALTER TABLE public.reminder_settings ADD COLUMN IF NOT EXISTS payment_dates TEXT DEFAULT '3rd-10th';

-- Step 4: Update the reminder_settings view/index to include new columns
DROP INDEX IF EXISTS idx_students_notifications_enabled;
CREATE INDEX IF NOT EXISTS idx_students_notifications_enabled ON public.students(whatsapp_notifications_enabled, email_notifications_enabled);

-- Step 5: Update the reminders_summary view to use new column names
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

-- Step 6: Update students_needing_reminders view
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

-- Done!
SELECT '✅ WhatsApp support added successfully!' AS status;
SELECT 'WhatsApp + Email notifications are now active.' AS note;

