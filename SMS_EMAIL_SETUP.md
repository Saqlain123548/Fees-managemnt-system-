# ============================================
# SMS & EMAIL SETUP GUIDE (REAL-TIME NOTIFICATIONS)
# ============================================

## STEP 1: Get Twilio SMS Keys (Free Account)

1. Go to: https://www.twilio.com/try-twilio
2. Click "Sign Up" (free trial)
3. Fill in your details and verify email/phone
4. Once logged in, you'll see your Dashboard with:
   - Account SID (starts with AC...)
   - Auth Token (click to reveal)
   - Phone Number (they provide one)

## STEP 2: Get Gmail App Password (Free)

1. Go to: https://myaccount.google.com/security
2. Make sure "2-Step Verification" is ON
3. Go to: https://myaccount.google.com/apppasswords
4. Create a password for:
   - App: "Mail"
   - Device: "Windows PC" (or any)
5. Copy the 16-character password

## STEP 3: Update Your .env.local File

Open `.env.local` and add these lines:

```env
# ============================================
# SMS Notifications (Twilio) - Copy from your Twilio Dashboard
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# ============================================
# Email Notifications (Gmail) - Copy from your Gmail account
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com           # Your Gmail address
SMTP_PASSWORD=xxxx xxxx xxxx xxxx        # The 16-char app password
```

## STEP 4: Restart Your App

After adding the keys, restart your app:
```bash
npm run dev
```

## STEP 5: Test It

1. Go to `/reminders` in your app
2. Click "Send Reminders Now"
3. Students should receive real SMS and Emails!

---

## COST (For Your Information)

| Service | Cost |
|---------|------|
| Twilio SMS | ~$0.0075 per SMS (very cheap) |
| Gmail | Free (using your existing Gmail) |
| Supabase | Free tier available |

---

## IMPORTANT NOTES

1. **Twilio Trial Account**: 
   - Trial accounts can only send to verified phone numbers
   - Upgrade to paid account to send to anyone

2. **Gmail App Password**:
   - Only works if you have 2-Step Verification enabled
   - Regular Gmail password won't work - must use app password

3. **Testing**:
   - SMS will go to the student's contact number
   - Email will go to the student's email address
   - Check the "Logs" tab at `/reminders` to see results

---

## IF SMS/EMAIL DON'T WORK

1. Check console for errors
2. Verify keys are correct in `.env.local`
3. Make sure you restarted the app
4. Check Supabase logs for any issues

