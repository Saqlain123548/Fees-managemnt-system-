# Payment Reminder System - Implementation Plan

## Project Overview
Implement an automatic payment reminder system that sends SMS and Gmail reminders to students between the 3rd and 10th of every month.

## Current State Analysis

### ✅ Already Implemented
1. **Database Schema** (`supabase/migrations/20240105000000_payment_reminder_system.sql`)
   - `payment_reminders` table for tracking sent reminders
   - `reminder_settings` table for configurable preferences
   - Notification preference columns in `students` table

2. **Backend Services** (`src/lib/services/notificationService.ts`)
   - SMS notifications via Twilio
   - Email notifications via Gmail/SMTP
   - Message templates for both SMS and Email

3. **API Routes** (`src/app/api/reminders/route.ts`)
   - GET endpoint for checking reminder status
   - POST endpoint for sending reminders (supports manual & cron triggers)

4. **Frontend UI** (`src/app/reminders/page.tsx`)
   - Overview dashboard with stats
   - Settings configuration panel
   - Reminder logs/history view

5. **Cron Setup** (`supabase/migrations/20240106000000_cron_job_setup.sql`)
   - SQL function for cron job
   - View for tracking students needing reminders

### ❌ What's Missing / Needs Configuration
1. Supabase pg_cron needs to be enabled and configured
2. Environment variables need to be set in `.env.local`
3. No automated cron job created yet (just the function)
4. No external cron service integration

---

## Implementation Plan

### Phase 1: Environment Configuration
**Goal**: Set up all required environment variables

**Files to modify**:
- `.env.local` (create if not exists)

**Required Environment Variables**:
```env
# Supabase Admin (required for cron jobs)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_CRON_KEY=your_cron_secret_key

# SMS (Twilio) - Optional but recommended
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email (Gmail) - Optional but recommended
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Phase 2: Supabase pg_cron Setup
**Goal**: Enable and configure automatic scheduling

**Steps**:
1. Enable pg_cron extension in Supabase
2. Create the cron job for days 3-10 at 9 AM

**SQL to run in Supabase Dashboard → SQL Editor**:
```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job (runs at 9 AM on days 3-10)
SELECT cron.schedule(
    'payment-reminders',
    '0 9 3-10 * *',
    $$
    SELECT
        net.http_post(
            url:='https://your-domain.com/api/reminders?manual=true',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_KEY"}'::jsonb
        ) AS request_id;
    $$
);
```

### Phase 3: External Cron Service (Alternative)
**Goal**: Set up backup automated scheduling

**Services to consider**:
- EasyCron (easycron.com)
- Cron-job.org (cron-job.org)

**Endpoint to call**:
```
POST https://your-domain.com/api/reminders?manual=true
Headers:
  Authorization: Bearer YOUR_CRON_KEY
  Content-Type: application/json
```

### Phase 4: Frontend Enhancements
**Goal**: Add quick actions and better UX

**Files to modify**:
- `src/components/ui/AppNavbar.tsx` - Add reminders link
- `src/app/reminders/page.tsx` - Add one-click cron setup guide

**Enhancements**:
1. Add "Setup Cron" button that shows SQL commands
2. Add "Test SMS" and "Test Email" buttons
3. Add status indicators for Twilio/SMTP configuration

### Phase 5: Documentation & Testing
**Goal**: Ensure system works end-to-end

**Tasks**:
1. Test SMS sending (with Twilio credentials)
2. Test Email sending (with Gmail credentials)
3. Test manual reminder trigger
4. Document the complete setup process

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `.env.local` | Create | Add environment variables |
| `src/app/reminders/page.tsx` | Modify | Add cron setup guide in UI |
| `src/components/ui/AppNavbar.tsx` | Modify | Add reminders navigation link |
| `SETUP.md` | Update | Add complete setup instructions |
| `README.md` | Update | Document payment reminder feature |

---

## Quick Start Guide

### For Immediate Use:
1. Navigate to `/reminders` in your app
2. Click "Send Reminders Now" to manually trigger reminders
3. Configure settings in the "Settings" tab

### For Full Automation:
1. Set environment variables in `.env.local`
2. Enable pg_cron in Supabase
3. Create cron job in Supabase Dashboard
4. Test the automated flow

---

## Reminder Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cron Job      │────▶│  /api/reminders │────▶│  Fetch Students │
│  (3rd-10th, 9AM)│     │    API Route    │     │  (unpaid only)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Log Results   │◀────│  Send SMS/Email │◀────│   Check Date    │
│   to Database   │     │  Notifications  │     │   (3-10 only)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Message Templates

### SMS Template
```
Dear {student_name}, Please pay your monthly fees between 3rd-10th of this month. - IT Center
```

### Email Template (HTML)
Professional HTML email with:
- Header with IT Center branding
- Student name personalization
- Clear reminder message
- Call-to-action

---

## Success Criteria

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SMS notifications working (Twilio)
- [ ] Email notifications working (Gmail/SMTP)
- [ ] Manual reminder trigger working
- [ ] Automated cron job configured
- [ ] Frontend UI tested and functional
- [ ] Logs displaying correctly

