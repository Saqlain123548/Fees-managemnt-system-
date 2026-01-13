import { NextRequest, NextResponse } from 'next/server';

// Environment variable names for admin credentials
const ADMIN_EMAILS_ENV = 'NEXT_PUBLIC_ADMIN_EMAILS';
const ADMIN_PASSWORDS_ENV = 'NEXT_PUBLIC_ADMIN_PASSWORDS';

// Session cookie name
export const ADMIN_SESSION_COOKIE = 'admin_session';

// Session expiration time (24 hours)
const SESSION_EXPIRY = 60 * 60 * 24;

/**
 * Get admin credentials from environment variables
 */
export function getAdminCredentials(): { emails: string[]; passwords: string[] } {
  const emailsEnv = process.env[ADMIN_EMAILS_ENV] || '';
  const passwordsEnv = process.env[ADMIN_PASSWORDS_ENV] || '';
  
  const emails = emailsEnv.split(',').map(e => e.trim()).filter(Boolean);
  const passwords = passwordsEnv.split(',').map(p => p.trim()).filter(Boolean);
  
  // Fallback to single email/password if new format not used
  if (emails.length === 0) {
    const singleEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
    const singlePassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
    if (singleEmail && singlePassword) {
      return { emails: [singleEmail], passwords: [singlePassword] };
    }
  }
  
  return { emails, passwords };
}

/**
 * Validate admin credentials against environment variables
 * Returns the email if valid, null otherwise
 */
export function validateAdminCredentials(email: string, password: string): string | null {
  const { emails, passwords } = getAdminCredentials();
  
  // Check if the credentials match any admin account
  const emailIndex = emails.indexOf(email);
  
  if (emailIndex === -1 || passwords[emailIndex] !== password) {
    return null;
  }
  
  return email;
}

/**
 * Create a simple session token (base64 encoded JSON)
 * In production, consider using JWT with proper signing
 */
function createSessionToken(email: string): string {
  const payload = {
    email,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY * 1000,
  };
  
  // Simple base64 encoding (not cryptographically secure, but sufficient for internal use)
  // For production, use proper JWT signing
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  return token;
}

/**
 * Validate and decode session token
 */
export function validateSessionToken(token: string): { email: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check expiration
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }
    
    if (payload.email) {
      return { email: payload.email };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get admin session from request cookies
 */
export function getAdminSession(request: NextRequest): { email: string } | null {
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE);
  
  if (!cookie) {
    return null;
  }
  
  return validateSessionToken(cookie.value);
}

/**
 * Create admin session response with cookie set
 */
export function createAdminSession(email: string): NextResponse {
  const token = createSessionToken(email);
  
  const response = NextResponse.json({
    success: true,
    message: 'Admin login successful',
    email,
  });
  
  // Set the admin session cookie
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
    path: '/',
  });
  
  return response;
}

/**
 * Clear admin session cookie
 */
export function clearAdminSession(): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: 'Admin logout successful',
  });
  
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  
  return response;
}

/**
 * Check if request has valid admin session
 */
export function isAdminAuthenticated(request: NextRequest): boolean {
  const session = getAdminSession(request);
  return session !== null;
}

