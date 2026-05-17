import { CalendarDays, ReceiptText, ShieldCheck } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FadeIn } from "@/components/motion/motion-primitives";
import { LogoutSection } from "@/components/settings/logout-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AmbientBackground } from "@/components/visual/ambient-background";
import { ensureProfile, requireUser } from "@/lib/auth/session";
import { mapReceipts } from "@/lib/receipts/mapper";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  const activeReceipts = receipts.filter((receipt) => receipt.status === "active");
  const expiringSoon = activeReceipts.filter(
    (receipt) =>
      receipt.days_remaining !== null &&
      receipt.days_remaining >= 0 &&
      receipt.days_remaining <= 3,
  );
  const profileName = user.email?.split("@")[0] ?? "Receipt Guardian user";

  return (
    <>
      <AmbientBackground variant="app" />
      <main className="relative mx-auto min-h-screen w-full max-w-6xl px-6 md:px-8">
        <DashboardHeader email={user.email} current="profile" />

        <div className="mx-auto grid w-full max-w-2xl gap-8 py-8 md:py-10">
          <FadeIn>
            <header>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.015em] text-text-primary md:text-4xl">
                Your account
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary md:text-[15px]">
                A compact view of your identity and receipt activity.
              </p>
            </header>
          </FadeIn>

          <FadeIn delay={0.08}>
            <Card className="relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-24 h-56 bg-aurora-soft opacity-80"
              />
              <CardContent className="relative p-6 md:p-7">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <Avatar className="border-conic-soft size-24 text-action">
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-semibold tracking-[-0.01em] text-text-primary md:text-[26px]">
                      {profileName}
                    </h2>
                    <p className="mt-1.5 truncate text-sm text-text-secondary">
                      {user.email}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-success">
                        Active account
                      </Badge>
                      <Badge className="border-border bg-bg-elevated text-text-secondary">
                        Member since {formatDate(user.created_at)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.14}>
            <Card>
              <CardContent className="grid gap-5 p-6 md:p-7">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
                    Identity
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
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
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card>
              <CardContent className="grid gap-5 p-6 md:p-7">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
                    Activity summary
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Counts reflect your current dashboard data.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <ActivityMetric
                    icon={ReceiptText}
                    label="Receipts"
                    value={String(receipts.length)}
                  />
                  <ActivityMetric
                    icon={CalendarDays}
                    label="Active"
                    value={String(activeReceipts.length)}
                  />
                  <ActivityMetric
                    icon={ShieldCheck}
                    label="Due soon"
                    value={String(expiringSoon.length)}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.26}>
            <Card>
              <CardContent className="p-6 md:p-7">
                <LogoutSection bordered={false} />
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </main>
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
      <dt className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="break-words font-mono text-[13px] leading-6 text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function ActivityMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated/60 p-4 shadow-inner-hair">
      <Icon className="size-[18px] text-action" aria-hidden="true" />
      <p className="mt-4 text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-xl font-semibold text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}
