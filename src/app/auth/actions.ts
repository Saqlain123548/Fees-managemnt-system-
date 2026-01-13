"use client";

import { supabase } from "@/lib/supabase/browser";

export async function logout() {
  try {
    // 1. Clear Supabase Auth session
    await supabase.auth.signOut();

    // 2. Clear admin session cookie via API
    await fetch('/api/auth/admin/logout', {
      method: 'POST',
    });

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'Failed to logout' };
  }
}

export async function registerUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string
) {
  // 1️⃣ Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        role: "admin",
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2️⃣ Insert into profiles table
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user?.id,
    first_name: firstName,
    last_name: lastName,
    role: "admin",
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { success: true };
}
