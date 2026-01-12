# Fees Management System - Supabase Setup Guide

## Quick Fix for "Could not find the table 'public.fees_records' in the schema cache"

This error occurs when Supabase hasn't recognized the new table. Here's how to fix it:

### Step 1: Apply the Migration in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `supabase/migrations/apply_migration.sql`
5. Click **Run** to execute the SQL

### Step 2: Verify the Tables

After running the migration, run this query to verify:

```sql
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'fees_records')
ORDER BY table_name;
```

You should see:
- `students` with 10 columns
- `fees_records` with 8 columns

### Step 3: Refresh the Schema Cache

Supabase automatically refreshes its schema cache, but if you still see the error:

1. Go to **API** settings in Supabase
2. Scroll down to **Schema caching**
3. Click **Reload schema** or wait a few minutes for automatic refresh

### Step 4: Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in:
1. Supabase Dashboard → Settings → API
2. Copy the "Project URL" and "anon public" key

## Files Created/Modified

| File | Purpose |
|------|---------|
| `supabase/migrations/apply_migration.sql` | Migration script to create tables |
| `supabase/migrate.ts` | Node.js helper script for migrations |
| `.env.example` | Environment variables template |
| `src/lib/supabase/server.ts` | Fixed server client factory |

## Troubleshooting

### Still getting "Could not find the table"?

1. **Check if migration ran**: Run the verification query above
2. **Wait for cache refresh**: Schema changes can take 1-2 minutes
3. **Restart dev server**: Run `npm run dev` again
4. **Check RLS policies**: Make sure policies were created

### Check existing tables:

```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Drop and recreate tables (if needed):

```sql
DROP TABLE IF EXISTS public.fees_records CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
-- Then re-run the migration script
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

# Payment Reminder System - Setup Guide

## New Environment Variables

Add these to your `.env.local` file for the payment reminder system:

### Supabase Admin (for cron jobs)
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_CRON_KEY=your_cron_secret_key  # Optional: for cron job authentication
```

### SMS Notifications (Twilio)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Email Notifications (Gmail SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Database Migrations

Run the new migration for payment reminders:

1. Copy and paste the contents of `supabase/migrations/20240105000000_payment_reminder_system.sql` into Supabase SQL Editor
2. Run the migration
3. Optionally, also run `20240106000000_cron_job_setup.sql` for cron job setup

## Features

- **Automatic Reminders**: Sends SMS and/or email reminders on days 3-10 of each month
- **Manual Trigger**: Click "Send Reminders Now" to send reminders immediately
- **Customizable Settings**: Configure which days, message templates, and notification types
- **Reminder History**: View all sent reminders with status (sent/failed/pending)
- **Smart Filtering**: Skips students who have already paid this month

## Scheduling Options

### Option 1: Supabase pg_cron (Recommended)
1. Enable pg_cron extension in Supabase SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```
2. Create a cron job in Supabase Dashboard → Database → Cron Jobs
   - Schedule: `0 9 3-10 * *` (9 AM on days 3-10)
   - Function: Call the `/api/reminders` endpoint

### Option 2: External Cron Service
Use services like EasyCron or cron-job.org to call:
```
POST https://yourdomain.com/api/reminders?manual=true
```

### Option 3: GitHub Actions
Set up a scheduled workflow in your repository.

## Testing

1. Navigate to `/reminders` in your app
2. Click "Send Reminders Now" to test
3. Check the "Logs" tab to see reminder history
4. Configure settings in the "Settings" tab

