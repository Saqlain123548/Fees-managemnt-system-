/**
 * Supabase Admin Client
 * Creates a client with service role key for operations that bypass RLS
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Get environment variables with fallbacks
function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  
  return {
    url,
    serviceKey,
    isConfigured: !!(url && serviceKey)
  };
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

  return createServerClient(url, serviceKey, {
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
 * Create an admin client without request context (for cron jobs, etc.)
 */
export function createSupabaseAdminClientWithoutCookies() {
  const { url, serviceKey, isConfigured } = getEnvVars();
  
  if (!isConfigured) {
    throw new Error(
      'Supabase admin is not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.'
    );
  }

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No cookies for server-side operations
      },
    },
  });
}

export { getEnvVars };

