"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loaders";
import type { UserRole } from "@/types/admin";

interface AdminUserControlsProps {
  userId: string;
  email: string | null;
  role: UserRole;
  bannedUntil: string | null;
  /** True when the admin is viewing their own account. */
  isSelf: boolean;
}

type PendingKind =
  | "ban"
  | "unban"
  | "role"
  | "reset"
  | "delete"
  | null;

const HARD_DELETE_ENABLED =
  process.env.NEXT_PUBLIC_ALLOW_HARD_DELETE === "true";

/**
 * Client controls for the admin user-detail page. Each button calls
 * the `/api/admin/users/:id` endpoint and refreshes the route so the
 * server-rendered state reflects the change. Destructive actions
 * (ban, delete) route through a confirm dialog.
 */
export function AdminUserControls({
  userId,
  email,
  role,
  bannedUntil,
  isSelf,
}: AdminUserControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pending, setPending] = useState<PendingKind>(null);
  const [confirmBan, setConfirmBan] = useState(false);
  const [confirmRole, setConfirmRole] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const isBanned =
    bannedUntil !== null && new Date(bannedUntil).getTime() > Date.now();
  const nextRole: UserRole = role === "admin" ? "user" : "admin";

  async function callAction(
    body: Record<string, unknown>,
    kind: PendingKind,
    successMessage: string,
  ) {
    setPending(kind);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error?.message ?? "Action failed.");
        return;
      }
      toast.success(successMessage);
      startTransition(() => router.refresh());
    } finally {
      setPending(null);
    }
  }

  async function doDelete() {
    setPending("delete");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error?.message ?? "Delete failed.");
        return;
      }
      toast.success("User deleted.");
      router.push("/admin/users");
      router.refresh();
    } finally {
      setPending(null);
      setConfirmDelete(false);
    }
  }

  const busy = isPending || pending !== null;

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Primary access control: ban / unban */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {isBanned ? "Access revoked" : "Access active"}
            </p>
            <p className="text-xs text-text-muted">
              {isBanned
                ? "This user cannot sign in until you restore access."
                : "Revoking blocks sign-in but keeps their data."}
            </p>
          </div>
          {isBanned ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              data-loading={pending === "unban" ? "true" : undefined}
              onClick={() =>
                callAction({ action: "unban" }, "unban", "Access restored.")
              }
            >
              {pending === "unban" ? <Loader size="sm" label="" /> : null}
              Restore access
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy || isSelf}
              onClick={() => setConfirmBan(true)}
            >
              Revoke access
            </Button>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Role */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">Role</p>
            <p className="text-xs text-text-muted">
              {role === "admin"
                ? "Full admin access to this console."
                : "Standard user access only."}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy || isSelf}
            data-loading={pending === "role" ? "true" : undefined}
            onClick={() => setConfirmRole(true)}
          >
            {pending === "role" ? <Loader size="sm" label="" /> : null}
            {role === "admin" ? "Demote to user" : "Promote to admin"}
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* Password reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">Password</p>
            <p className="text-xs text-text-muted">
              Send a password-reset email to {email ?? "this user"}.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy || !email}
            data-loading={pending === "reset" ? "true" : undefined}
            onClick={() =>
              callAction(
                { action: "password_reset" },
                "reset",
                "Password-reset email sent.",
              )
            }
          >
            {pending === "reset" ? <Loader size="sm" label="" /> : null}
            Send reset email
          </Button>
        </div>

        {/* Hard delete — only when explicitly enabled via env flag */}
        {HARD_DELETE_ENABLED ? (
          <>
            <div className="border-t border-border" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-danger">
                  Delete permanently
                </p>
                <p className="text-xs text-text-muted">
                  Removes the account and all data. Cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={busy || isSelf}
                onClick={() => setConfirmDelete(true)}
              >
                Delete user
              </Button>
            </div>
          </>
        ) : null}

        {isSelf ? (
          <p className="text-xs text-text-muted">
            You can&apos;t revoke, demote, or delete your own account.
          </p>
        ) : null}
      </div>

      {/* Confirm ban */}
      <Dialog
        open={confirmBan}
        onClose={() => setConfirmBan(false)}
        title="Revoke access?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            {email ?? "This user"} will be signed out and blocked from
            signing in. Their receipts and data are preserved, and you can
            restore access at any time.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmBan(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              data-loading={pending === "ban" ? "true" : undefined}
              onClick={() => {
                setConfirmBan(false);
                callAction({ action: "ban" }, "ban", "Access revoked.");
              }}
            >
              {pending === "ban" ? <Loader size="sm" label="" /> : null}
              Revoke access
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm role change */}
      <Dialog
        open={confirmRole}
        onClose={() => setConfirmRole(false)}
        title={nextRole === "admin" ? "Promote to admin?" : "Demote to user?"}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            {nextRole === "admin"
              ? `${email ?? "This user"} will be able to view users, audit logs, and access-management controls.`
              : `${email ?? "This user"} will lose access to the admin console.`}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmRole(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={nextRole === "admin" ? "primary" : "danger"}
              disabled={busy}
              data-loading={pending === "role" ? "true" : undefined}
              onClick={() => {
                setConfirmRole(false);
                callAction(
                  { action: "set_role", role: nextRole },
                  "role",
                  nextRole === "admin"
                    ? "Promoted to admin."
                    : "Demoted to user.",
                );
              }}
            >
              {pending === "role" ? <Loader size="sm" label="" /> : null}
              {nextRole === "admin" ? "Promote" : "Demote"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm hard delete (type-to-confirm) */}
      <Dialog
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setDeleteConfirmText("");
        }}
        title="Delete this user permanently?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            This permanently removes {email ?? "this account"} and all of
            their receipts. This cannot be undone. Type{" "}
            <span className="font-mono text-text-primary">DELETE</span> to
            confirm.
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busy || deleteConfirmText !== "DELETE"}
              data-loading={pending === "delete" ? "true" : undefined}
              onClick={doDelete}
            >
              {pending === "delete" ? <Loader size="sm" label="" /> : null}
              Delete permanently
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
