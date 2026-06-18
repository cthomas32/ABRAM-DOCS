"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

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

/**
 * Sends a password recovery/reset email to a user using their email.
 * This utilizes Supabase's native SMTP / email sending flow.
 */
export async function requestPasswordReset(email: string) {
  try {
    const supabase = await createClient();

    // 1. Retrieve host to construct the dynamic absolute callback URL
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // 2. Trigger Supabase's native recovery email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        return { 
          error: "Rate limit exceeded. Please wait a few minutes before requesting another reset link." 
        };
      }
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "An unexpected error occurred." };
  }
}

