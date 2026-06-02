import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns true when the given user id has `role = 'admin'` in
 * profiles. Uses the request-scoped (RLS-respecting) client; the
 * `profiles_admin_all` policy lets an admin read their own row, and
 * a user can always read their own profile row.
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === "admin";
}

/**
 * Returns the current user's admin status (or false if signed out).
 * Safe to call from any server component.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isUserAdmin(user.id);
}

/**
 * Guard for admin server components and route handlers. Redirects
 * unauthenticated users to /login and authenticated non-admins to
 * /dashboard (so the admin area's existence is not leaked to
 * ordinary users). Returns the admin user when the check passes.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    redirect("/dashboard");
  }

  return user;
}
