# ============================================
# FEES MANAGEMENT SYSTEM - Twilio WhatsApp Setup
# ============================================

## STEP 1: Get Twilio Account (Free)
1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number
4. Once logged in, you'll see in your Dashboard:
   - Account SID (starts with AC...)
   - Auth Token (click "Show" to reveal)
   - WhatsApp Number (starts with +14155238886)

## STEP 2: Get Gmail App Password (Free)
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not enabled
3. Go to: https://myaccount.google.com/apppasswords
4. Create password for:
   - App: "Mail"
   - Device: "Windows" or any
5. Copy the 16-character password

## STEP 3: Add Credentials to .env.local

# ============================================
# SUPABASE (Get from Supabase Dashboard → Settings → API)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# TWILIO WHATSAPP (Get from Twilio Dashboard)
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_CONTENT_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e

# ============================================
# EMAIL NOTIFICATIONS (Gmail)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx

# ============================================
# OTHER SETTINGS
# ============================================
SUPABASE_CRON_KEY=your_secure_random_key_for_cron_jobs

