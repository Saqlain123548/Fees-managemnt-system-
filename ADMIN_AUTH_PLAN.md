# Admin Authentication Implementation Plan

## Problem Analysis
- Admin credentials are validated against environment variables
- Then `supabase.auth.signInWithPassword()` is called, which fails with 400 error
- Admin users don't exist in Supabase Auth, causing the failure

## Solution: Custom Admin Session Management

### Step 1: Create Admin Session Utility (`src/lib/adminSession.ts`)
Create utilities to manage admin sessions using cookies:
- `createAdminSession(email, response)` - Creates admin session cookie
- `getAdminSession(request)` - Validates and returns admin session
- `clearAdminSession(response)` - Clears admin session

### Step 2: Create Admin Auth API Route (`src/app/api/auth/admin/route.ts`)
API endpoint for admin login that creates custom session:
- Validates credentials against environment variables
- Creates JWT token for admin session
- Sets admin session cookie

### Step 3: Update Login Page (`src/app/auth/login/page.tsx`)
- Replace `supabase.auth.signInWithPassword()` with API call
- Call admin auth API to create session
- Handle response and redirect

### Step 4: Update Middleware (`src/middleware.ts`)
Add support for admin sessions:
- Check for admin session cookie
- Create custom session handling for admin users
- Protect routes for both Supabase and admin sessions

### Step 5: Create Logout API Route (`src/app/api/auth/admin/logout/route.ts`)
Handle admin logout:
- Clear admin session cookie
- Redirect to login page

### Step 6: Update AppNavbar (`src/components/ui/AppNavbar.tsx`)
Add admin indicator and logout functionality

## Environment Variables Needed
```
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
NEXT_PUBLIC_ADMIN_PASSWORDS=securepassword
```

## Files to Create/Modify
1. **Create:** `src/lib/adminSession.ts` - Session utilities
2. **Create:** `src/app/api/auth/admin/route.ts` - Admin auth API
3. **Create:** `src/app/api/auth/admin/logout/route.ts` - Logout API
4. **Modify:** `src/app/auth/login/page.tsx` - Use custom session
5. **Modify:** `src/middleware.ts` - Support admin sessions

