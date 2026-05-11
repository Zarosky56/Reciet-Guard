import { apiError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function requireApiUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      response: apiError("UNAUTHORIZED", "Log in to continue.", 401),
    };
  }

  return {
    supabase,
    user,
    response: null,
  };
}
