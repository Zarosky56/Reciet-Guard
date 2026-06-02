import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import {
  banUser,
  hardDeleteUser,
  sendPasswordReset,
  setUserRole,
  unbanUser,
} from "@/lib/admin/actions";
import { getUserDetail } from "@/lib/admin/queries";
import type { UserRole } from "@/types/admin";

/**
 * Admin user mutation endpoint.
 *
 *   POST   /api/admin/users/:id   { action: "ban" | "unban"
 *                                   | "set_role" | "password_reset"
 *                                   ; role?: "user" | "admin" }
 *   DELETE /api/admin/users/:id   (hard delete, flag-gated)
 *
 * Every handler is gated by requireAdmin(); a non-admin is bounced
 * before reaching the action. An admin cannot ban or demote
 * themselves (guards below) to avoid self-lockout.
 */

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  const { id } = await params;

  let body: { action?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const { action, role } = body;

  // Self-protection guards.
  if (id === admin.id && (action === "ban" || action === "set_role")) {
    return NextResponse.json(
      { error: { message: "You cannot ban or change your own role." } },
      { status: 400 },
    );
  }

  try {
    switch (action) {
      case "ban":
        await banUser(id, { actorId: admin.id });
        break;
      case "unban":
        await unbanUser(id, { actorId: admin.id });
        break;
      case "set_role": {
        if (role !== "user" && role !== "admin") {
          return NextResponse.json(
            { error: { message: "role must be 'user' or 'admin'" } },
            { status: 400 },
          );
        }
        await setUserRole(id, role as UserRole, { actorId: admin.id });
        break;
      }
      case "password_reset": {
        const target = await getUserDetail(id);
        if (!target?.email) {
          return NextResponse.json(
            { error: { message: "User has no email on file." } },
            { status: 400 },
          );
        }
        await sendPasswordReset(id, target.email, { actorId: admin.id });
        break;
      }
      default:
        return NextResponse.json(
          { error: { message: `Unknown action: ${action}` } },
          { status: 400 },
        );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Admin action failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }

  const updated = await getUserDetail(id);
  return NextResponse.json({ user: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: { message: "You cannot delete your own account." } },
      { status: 400 },
    );
  }

  try {
    await hardDeleteUser(id, { actorId: admin.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
