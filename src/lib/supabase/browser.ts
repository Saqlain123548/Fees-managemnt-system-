"use client";

import { createBrowserClient } from "@supabase/ssr";

// STATIC export so Turbopack can detect it
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
