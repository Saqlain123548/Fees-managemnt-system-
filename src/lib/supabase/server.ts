/**
 * Supabase Server Client Factory
 * 
 * IMPORTANT: This file creates Supabase server clients for API routes.
 * It handles both authenticated and anonymous access patterns.
 */

import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Get environment variables with fallbacks
function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return {
    url: url || '',
    anonKey: anonKey || '',
    serviceKey: serviceKey || '',
    isConfigured: !!(url && anonKey)
  };
}

/**
 * Create a server client for use in API routes
 * Uses the standard @supabase/ssr pattern
 */
export async function createSupabaseServerClient(request?: NextRequest, response?: NextResponse) {
  const { url, anonKey, isConfigured } = getEnvVars();
  
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    );
  }

  const cookieStore = await cookies();

  return _createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}

/**
 * Create an admin client with service role key
 * Use this for operations that bypass RLS
 */
export async function createSupabaseAdminClient(request?: NextRequest) {
  const { url, serviceKey, isConfigured } = getEnvVars();
  
  if (!isConfigured) {
    throw new Error(
      'Supabase admin is not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.'
    );
  }

  const cookieStore = await cookies();

  return _createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Admin client doesn't need to set cookies
      },
    },
  });
}

/**
 * Create a client for use in Server Components
 * Uses cookies from the request headers
 */
export function createServerComponentClient(request: NextRequest) {
  const { url, anonKey, isConfigured } = getEnvVars();
  
  if (!isConfigured) {
    console.warn('Supabase is not configured. Server components may not work correctly.');
    return null;
  }

  return _createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // This won't work in Server Components
      },
    },
  });
}

// Export environment check for debugging
export { getEnvVars };

