# Payment Reminder System - SIMPLE Setup Guide

## What You Need To Do (Just 2 Steps!)

### Step 1: Go to Supabase Dashboard

1. Open your browser and go to: **https://supabase.com/dashboard**
2. Login with your account (you already have one since you're using Supabase)
3. Click on your project **"nixvwxmtusiecohjgqsq"**
4. Click **"SQL Editor"** in the left sidebar
5. Copy the entire content from this file:
   `supabase/migrations/PAYMENT_REMINDER_TABLES.sql` **(Use this simpler file!)**
6. Paste it in the SQL Editor
7. Click **"Run"** button

### Step 2: You're Done! 🎉

That's it! The system is now set up.

---

## How to Use

### Manual Mode (Test it now):
1. Open your app and go to **/reminders**
2. Click **"Send Reminders Now"** button
3. Done! Reminders will be sent to all unpaid students

### Automatic Mode (Runs by itself):
- The system will **automatically** send reminders at **9 AM** on days **3-10** of every month
- No action needed from you!

---

## Optional: Add Email Notifications (Only if you want emails)

If you want the system to send Gmail emails to students, add this to your `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com       # Replace with YOUR Gmail email
SMTP_PASSWORD=your_app_password      # See instructions below
```

**How to get Gmail App Password:**
1. Go to: https://myaccount.google.com/security
2. Turn on **"2-Step Verification"** (if not already on)
3. Go to: https://myaccount.google.com/apppasswords
4. Click **"Create app password"**
5. Copy the password and paste it in `.env.local`

---

## Optional: Add SMS Notifications (Only if you want SMS)

If you want the system to send SMS to students, you need to create a **free Twilio account**:

1. Go to: **https://www.twilio.com**
2. Click **"Sign Up"** (it's free)
3. Verify your email and phone number
4. Copy these from your Twilio dashboard:
   - Account SID
   - Auth Token
   - Phone Number
5. Add them to `.env.local`:
   ```env
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

---

## Quick Summary

| Feature | What You Need | Cost |
|---------|---------------|------|
| Database Tables | ✅ Already done in Supabase | Free |
| Auto Reminders (3-10th) | ✅ Already set up | Free |
| Email Notifications | Optional - needs Gmail account | Free |
| SMS Notifications | Optional - needs Twilio account | Pay per SMS |

---

## Having Trouble?

If something doesn't work:
1. Go to `/reminders` in your app
2. Click the **"⚡ Setup Guide"** tab
3. Follow the step-by-step instructions there

