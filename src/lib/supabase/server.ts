import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("SUPABASE_URL:", supabaseUrl);
    console.log("SUPABASE_ANON_KEY:", supabaseKey);
    throw new Error(
      "Supabase URL or Key missing! Check your .env.local"
    );
  }

  return createServerClient({
    supabaseUrl,
    supabaseKey,
    cookies,
  });
}
