-- ============================================
-- FIX: Complete RLS Policy Fix for reminder_settings
-- ============================================
-- Run this in Supabase SQL Editor to fix the error:
-- "Error creating default settings: {}"
--
-- This script properly drops and recreates all RLS policies
-- for the reminder_settings table.
-- ============================================

-- Step 1: Drop existing policies (if any)
DROP POLICY IF EXISTS "Authenticated users can view reminder settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Authenticated users can insert reminder settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Authenticated users can update reminder settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Service role can do everything" ON public.reminder_settings;

-- Step 2: Recreate RLS policies with proper configuration
-- Allow authenticated users to SELECT (view) settings
CREATE POLICY "Authenticated users can view reminder settings" ON public.reminder_settings
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to INSERT (create) settings
CREATE POLICY "Authenticated users can insert reminder settings" ON public.reminder_settings
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to UPDATE (edit) settings
CREATE POLICY "Authenticated users can update reminder settings" ON public.reminder_settings
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow service role (admin) full access - useful for server-side operations
CREATE POLICY "Service role can do everything" ON public.reminder_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 3: Ensure default settings record exists
-- Use UPSERT to handle cases where record might already exist
INSERT INTO public.reminder_settings (
    id, 
    is_enabled, 
    reminder_days, 
    email_enabled, 
    message_template
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    true,
    ARRAY['3', '4', '5', '6', '7', '8', '9', '10'],
    true,
    'Dear {student_name}, This is a friendly reminder that your monthly fees payment is due. Please make your payment between 3rd-10th of this month. Contact us if you have any questions. Best regards, IT Center Fees Management'
) ON CONFLICT (id) DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    reminder_days = EXCLUDED.reminder_days,
    email_enabled = EXCLUDED.email_enabled,
    message_template = EXCLUDED.message_template,
    updated_at = NOW();

-- Step 4: Verify the policies were created
SELECT 
    policy_name,
    permrole AS role,
    cmd AS operation
FROM pg_policies
WHERE tablename = 'reminder_settings'
ORDER BY cmd, policy_name;

-- Step 5: Verify the default record exists
SELECT id, is_enabled, email_enabled, reminder_days 
FROM public.reminder_settings 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- Expected output after running this script:
-- ============================================
-- | policy_name                       | role         | operation |
-- |-----------------------------------|--------------|-----------|
-- | Authenticated users can view...   | authenticated | SELECT    |
-- | Authenticated users can insert... | authenticated | INSERT    |
-- | Authenticated users can update... | authenticated | UPDATE    |
-- | Service role can do everything   | service_role  | ALL       |
--
-- And a settings record should be shown with id = 00000000-...
-- ============================================

-- If you see all 4 policies and the settings record, the fix is complete!
-- Try refreshing the /reminders page now.

