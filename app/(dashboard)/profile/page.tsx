import { CalendarDays, ReceiptText, ShieldCheck } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Reveal } from "@/components/motion/motion-primitives";
import { LogoutSection } from "@/components/settings/logout-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ensureProfile, requireUser } from "@/lib/auth/session";
import { mapReceipts } from "@/lib/receipts/mapper";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Profile page — Premium UI Redesign (task 8.5).
 *
 * Layout (design-system/profile.md, design.md "Spacing, Layout, Radius"):
 *   - `<main>` is constrained by `max-w-narrow` (= `--container-narrow`,
 *     42rem) — the documented container for profile content per
 *     Requirement 4.4. The redesigned chrome (`<DashboardHeader>` and
 *     the `<MobileBottomNav>` rendered inside it) shares the same
 *     gutter as the dashboard and settings routes (Requirement 9.6).
 *   - The page is a single column of stacked sections — no multi-column
 *     grids (Requirement 4.5). The avatar header keeps the avatar and
 *     name side-by-side at >=`sm` via flex, which is not a multi-column
 *     grid.
 *
 * Vertical rhythm (design.md "Vertical rhythm" — Requirement 4.6):
 *   - Section gap (between top-level cards)        : `gap-8`  (32px)
 *   - Card-internal gap (between rows in a card)   : `gap-4`  (16px)
 *   - Label-to-value gap (within a row)            : `gap-2`  (8px)
 *
 * No `<AmbientBackground>` — the redesigned ambient layer is reserved
 * for the landing route's hero (`variant="hero"`); app routes render on
 * the plain canvas (Requirement 13.13).
 *
 * Implements: Requirements 4.5, 4.6, 9.6.
 */

function getInitials(email: string | undefined) {
  const name = email?.split("@")[0]?.replace(/[^a-z0-9]/gi, " ") ?? "";
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "RG";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await ensureProfile(user.id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", user.id);
  const receipts = mapReceipts(data);
  const activeReceipts = receipts.filter(
    (receipt) => receipt.status === "active",
  );
  const expiringSoon = activeReceipts.filter(
    (receipt) =>
      receipt.days_remaining !== null &&
      receipt.days_remaining >= 0 &&
      receipt.days_remaining <= 3,
  );
  const profileName = user.email?.split("@")[0] ?? "Receipt Guardian user";

  return (
    <main className="mx-auto min-h-screen w-full max-w-narrow px-4 sm:px-6 md:px-8">
      <DashboardHeader email={user.email} current="profile" />

      <div className="grid w-full gap-8 py-8 md:py-10">
        <Reveal>
          <header className="grid gap-2">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Profile
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
              Your account
            </h1>
            <p className="text-sm leading-6 text-text-secondary">
              A compact view of your identity and receipt activity.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.06}>
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
                <Avatar className="size-20 shrink-0">
                  <AvatarFallback className="text-accent">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 gap-2">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-text-primary">
                    {profileName}
                  </h2>
                  <p className="truncate text-sm text-text-secondary">
                    {user.email}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge variant="success">Active account</Badge>
                    <Badge>Member since {formatDate(user.created_at)}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          <Card>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                  Identity
                </h2>
                <p className="text-sm leading-6 text-text-secondary">
                  Your email is the account identity used for receipt
                  forwarding.
                </p>
              </div>

              <dl className="grid gap-4">
                <ProfileRow label="Email" value={user.email ?? "Unknown"} />
                <ProfileRow
                  label="Forwarding address"
                  value={profile?.forwarding_address ?? "Not configured"}
                />
                <ProfileRow
                  label="Account created"
                  value={formatDate(user.created_at)}
                />
              </dl>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.18}>
          <Card>
            <CardContent className="grid gap-4">
              <div className="grid gap-1">
                <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                  Activity summary
                </h2>
                <p className="text-sm leading-6 text-text-secondary">
                  Counts reflect your current dashboard data.
                </p>
              </div>

              <dl className="grid gap-4">
                <ActivityRow
                  icon={ReceiptText}
                  label="Receipts"
                  value={String(receipts.length)}
                />
                <ActivityRow
                  icon={CalendarDays}
                  label="Active"
                  value={String(activeReceipts.length)}
                />
                <ActivityRow
                  icon={ShieldCheck}
                  label="Due soon"
                  value={String(expiringSoon.length)}
                />
              </dl>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.24}>
          <Card>
            <CardContent>
              <LogoutSection bordered={false} />
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <dt className="text-xs uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="break-words font-mono text-sm leading-6 text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <dt className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon
          className="size-4 text-accent"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        {label}
      </dt>
      <dd className="font-mono text-base font-semibold text-text-primary tabular-nums">
        {value}
      </dd>
    </div>
  );
}
