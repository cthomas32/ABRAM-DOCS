"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Signs in a user using their email and password.
 * Done on the server side to correctly write session cookies to Next.js headers.
 */
export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Signs out the current authenticated user and clears session cookies.
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
