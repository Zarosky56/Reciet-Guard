#!/usr/bin/env node
// ============================================================
// Bootstrap admin user
// ------------------------------------------------------------
// Creates a Supabase auth user with the email/password from env
// vars (or promotes an existing user with the same email), then
// sets their `profiles.role = 'admin'`.
//
// Usage (from the project root):
//
//   1. Apply supabase/migrations/20260530_admin_role_and_audit.sql
//      in Supabase Studio -> SQL Editor.
//
//   2. Add to your local `.env.local` (DO NOT COMMIT):
//        ADMIN_EMAIL=Akash7250@gmail.com
//        ADMIN_PASSWORD=your-password-here
//      The script reads them once and does nothing else with
//      them. Delete both lines after the script finishes.
//
//   3. Run:
//        npm run setup:admin
//
// What it does:
//   - Calls supabase.auth.admin.createUser({ email, password,
//     email_confirm: true }). If the user already exists, the
//     script catches the error and looks them up by email.
//   - Ensures a row in `public.profiles` for the user.
//   - Updates `profiles.role` to 'admin'.
//   - Prints the user id and confirms success.
//
// Env vars required:
//   NEXT_PUBLIC_SUPABASE_URL          (already set)
//   SUPABASE_SERVICE_ROLE_KEY         (already set)
//   ADMIN_EMAIL                       (you add)
//   ADMIN_PASSWORD                    (you add)
// ============================================================

import process from "node:process";

import { createClient } from "@supabase/supabase-js";

// Env vars are loaded by Node's `--env-file=.env.local` flag in the
// `setup:admin` npm script. If you prefer running the file directly,
// pass `--env-file=.env.local` manually:
//   node --env-file=.env.local scripts/bootstrap-admin.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function fail(message) {
  console.error(`\n[error] ${message}\n`);
  process.exit(1);
}

if (!SUPABASE_URL) fail("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
if (!SERVICE_ROLE_KEY) fail("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
if (!ADMIN_EMAIL) fail("ADMIN_EMAIL is not set in .env.local");
if (!ADMIN_PASSWORD) fail("ADMIN_PASSWORD is not set in .env.local");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------
// Step 1 - find or create the auth user
// ------------------------------------------------------------

async function findUserByEmail(email) {
  // listUsers paginates; for an MVP we scan up to 1000 rows.
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 5) return null; // hard cap (~1000 users)
  }
}

async function ensureAuthUser() {
  console.log(`\n[1/3] Looking for existing user ${ADMIN_EMAIL} ...`);
  const existing = await findUserByEmail(ADMIN_EMAIL);
  if (existing) {
    console.log(`      found existing auth user id=${existing.id}`);
    // Update password so the value in env wins (idempotent run).
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      throw new Error(`Failed to refresh password: ${error.message}`);
    }
    console.log(`      password updated to match ADMIN_PASSWORD`);
    return existing;
  }

  console.log(`      not found - creating new auth user ...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser failed: ${error.message}`);
  if (!data.user) throw new Error("createUser returned no user");
  console.log(`      created auth user id=${data.user.id}`);
  return data.user;
}

// ------------------------------------------------------------
// Step 2 - ensure a profiles row + flip role to admin
// ------------------------------------------------------------

async function ensureProfileAndPromote(userId) {
  console.log(`\n[2/3] Ensuring profile row exists ...`);
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Profile lookup failed: ${selectError.message}`);
  }

  if (!existingProfile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      role: "admin",
    });
    if (insertError) {
      throw new Error(`Profile insert failed: ${insertError.message}`);
    }
    console.log(`      profile created with role=admin`);
    return;
  }

  if (existingProfile.role === "admin") {
    console.log(`      profile already has role=admin (no change)`);
    return;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Profile update failed: ${updateError.message}`);
  }

  console.log(
    `      profile role flipped from ${existingProfile.role} -> admin`,
  );
}

// ------------------------------------------------------------
// Step 3 - sanity check the role column / is_admin() helper
// ------------------------------------------------------------

async function sanityCheck(userId) {
  console.log(`\n[3/3] Verifying is_admin() helper ...`);
  const { data, error } = await supabase.rpc("is_admin", { uid: userId });
  if (error) {
    throw new Error(
      `is_admin() RPC failed: ${error.message}\n` +
        `Did you run the SQL migration first?`,
    );
  }
  if (data !== true) {
    throw new Error(
      `is_admin(${userId}) returned ${data}; expected true.`,
    );
  }
  console.log(`      is_admin() returned true (ok)`);
}

// ------------------------------------------------------------
// Run
// ------------------------------------------------------------

async function main() {
  try {
    const user = await ensureAuthUser();
    await ensureProfileAndPromote(user.id);
    await sanityCheck(user.id);
    console.log(
      `\nDone. ${ADMIN_EMAIL} can now sign in and reach /admin.`,
    );
    console.log(
      `Remember to delete ADMIN_EMAIL and ADMIN_PASSWORD from .env.local now.`,
    );
  } catch (err) {
    console.error(`\n[error] ${err && err.stack ? err.stack : String(err)}\n`);
    process.exit(1);
  }
}

main();
