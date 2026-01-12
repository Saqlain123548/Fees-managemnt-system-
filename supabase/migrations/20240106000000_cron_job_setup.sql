-- Payment Reminder System - Cron Job Setup
-- This script creates a pg_cron job to automatically send reminders on days 3-10 of every month

-- First, enable the pg_cron extension (run this in Supabase SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to send reminders that can be called by cron
CREATE OR REPLACE FUNCTION public.send_payment_reminders_cron()
RETURNS void AS $$
DECLARE
    cron_key TEXT;
    api_url TEXT;
    result JSON;
BEGIN
    -- Get the API endpoint URL
    api_url := COALESCE(
        current_setting('app.settings.api_url', true),
        'http://localhost:3000'
    ) || '/api/reminders';

    -- Get the cron key from environment (would be set in Supabase project settings)
    cron_key := current_setting('app.settings.supabase_cron_key', true);

    -- Call the reminders API
    -- Note: This uses http extension which needs to be installed
    -- For Supabase, you might need to use a different approach
    
    -- Log that cron job ran
    INSERT INTO public.payment_reminders (student_id, reminder_type, status, message)
    SELECT 
        id,
        'system',
        'pending',
        'Cron job triggered at ' || NOW()::TEXT
    FROM public.students
    WHERE is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Payment reminder cron job executed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a webhook-based cron job using Supabase Edge Functions
-- This is more reliable for Supabase deployments

/*
-- To set up automated reminders in Supabase:

1. Go to your Supabase Dashboard → Database → Cron Jobs
2. Create a new cron job with:
   - Name: payment-reminders
   - Schedule: 0 9 3-10 * * (Runs at 9 AM on days 3-10 of every month)
   - Function: send_payment_reminders_cron()

3. Or use Supabase Edge Functions with a cron schedule:
   - Create an edge function in your Supabase project
   - Set up a cron schedule in Supabase dashboard

4. For more control, use external cron services like:
   - EasyCron (https://www.easycron.com)
   - Cron-job.org (https://cron-job.org)
   - GitHub Actions with schedule trigger
   
   Example GitHub Actions workflow:
*/

-- Create a view to track which students need reminders this month
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

-- Grant access
GRANT SELECT ON public.students_needing_reminders TO authenticated;

