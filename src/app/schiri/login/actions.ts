"use server";

import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(
  password: string,
): Promise<{ error: string | null; needsMFA: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.SCHIRI_EMAIL!,
    password,
  });
  if (error) {
    return { error: "Falsches Passwort. Bitte erneut versuchen.", needsMFA: false };
  }
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needsMFA =
    aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2";
  return { error: null, needsMFA };
}
