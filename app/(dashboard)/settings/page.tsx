import { Bell, Inbox, LockKeyhole } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Reveal } from "@/components/motion/motion-primitives";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { LogoutSection } from "@/components/settings/logout-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ensureProfile, requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Settings page — Premium UI Redesign (task 8.6).
 *
 * Layout (design-system/settings.md, design.md "Spacing, Layout, Radius"):
 *   - `<main>` constrained by `max-w-content` (56rem, design
 *     "Container width tokens"). Single column of stacked sections —
 *     no multi-column grid inside settings (Requirement 4.5).
 *   - The redesigned `<DashboardHeader>` renders inline at the top of
 *     `<main>`; its sticky chrome is shared with the dashboard and
 *     profile routes (Requirement 9.6).
 *
 * Vertical rhythm (design.md "Vertical rhythm"):
 *   - Section gap (page-level)        : `gap-8`  (32px)
 *   - Card-internal gap (within Card) : `gap-4`  (16px)
 *   - Label-to-input gap              : `gap-2`  (8px)
 *
 * The redesigned chrome (`<DashboardHeader>` + `<MobileBottomNav>`
 * rendered inside the header) is shared with the dashboard and profile
 * routes. No `AmbientBackground` is rendered on app screens; the
 * "hero" tonal band is reserved for the landing route.
 *
 * Implements: Requirements 4.5, 4.6, 9.6.
 */
export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await ensureProfile(user.id);
  const forwardingAddress =
    profile?.forwarding_address ?? process.env.GMAIL_USER_EMAIL ?? "Not configured";

  return (
    <main className="mx-auto min-h-screen w-full max-w-content px-4 sm:px-6 md:px-8">
      <DashboardHeader email={user.email} current="settings" />

      <div className="grid w-full gap-8 py-8 md:py-10">
        <Reveal>
          <header className="grid gap-2">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Settings
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
              Keep things predictable
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-text-secondary">
              Only controls that work today appear here. Account access and
              receipt intake stay intentionally sparse.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.06}>
          <Card id="receipt-intake">
            <CardContent className="grid gap-4">
              <SectionHeading
                icon={Inbox}
                title="Receipt intake"
                description="Forward order emails from your signed-in address, then import them from the dashboard."
              />

              <SettingRow
                label="Forwarding address"
                description="Use this shared inbox for forwarded receipts."
              >
                <CopyForwardingAddress address={forwardingAddress} />
              </SettingRow>

              <SettingRow
                label="Inbox import"
                description="Receipt Guardian imports mail only when you ask it to check."
              >
                <Badge>Manual</Badge>
              </SettingRow>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          <Card id="notifications">
            <CardContent className="grid gap-4">
              <SectionHeading
                icon={Bell}
                title="Notifications"
                description="Deadline reminders stay sparse by design, so alerts remain useful."
              />

              <SettingRow
                label="Return deadline reminder"
                description="A daily check sends one email when an active return window is within 3 days."
              >
                <Badge variant="success">Active</Badge>
              </SettingRow>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.18}>
          <Card id="account">
            <CardContent className="grid gap-4">
              <SectionHeading
                icon={LockKeyhole}
                title="Account"
                description="Your login email is managed by the authentication system."
              />

              <label className="grid gap-2 text-sm font-medium text-text-primary">
                Email
                <Input value={user.email ?? ""} readOnly aria-readonly />
              </label>

              <LogoutSection />
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </main>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-1">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-text-primary">
        <Icon className="size-5 text-accent" aria-hidden="true" />
        {title}
      </h2>
      <p className="text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-medium text-text-primary">{label}</h3>
        <p className="mt-1 text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
