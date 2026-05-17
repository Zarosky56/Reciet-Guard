import { Bell, Inbox, LockKeyhole } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FadeIn } from "@/components/motion/motion-primitives";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { LogoutSection } from "@/components/settings/logout-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AmbientBackground } from "@/components/visual/ambient-background";
import { ensureProfile, requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const settingsNav = [
  { href: "#receipt-intake", label: "Receipt intake" },
  { href: "#notifications", label: "Notifications" },
  { href: "#account", label: "Account" },
];

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await ensureProfile(user.id);
  const forwardingAddress =
    profile?.forwarding_address ?? process.env.GMAIL_USER_EMAIL ?? "Not configured";

  return (
    <>
      <AmbientBackground variant="app" />
      <main className="relative mx-auto min-h-screen w-full max-w-6xl px-6 md:px-8">
        <DashboardHeader email={user.email} current="settings" />

        <div className="mx-auto grid w-full max-w-4xl gap-8 py-8 md:py-10">
          <FadeIn>
            <header>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Settings
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.015em] text-text-primary md:text-4xl">
                Keep things predictable
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary md:text-[15px]">
                Only controls that work today appear here. Account access and
                receipt intake stay intentionally sparse.
              </p>
            </header>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-[12rem_1fr]">
            <FadeIn delay={0.06}>
              <nav
                aria-label="Settings sections"
                className="flex flex-wrap items-start gap-1 rounded-xl border border-border bg-surface/60 p-1 shadow-inner-hair md:sticky md:top-24 md:flex-col md:items-stretch"
              >
                {settingsNav.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                  >
                    <a href={item.href}>{item.label}</a>
                  </Button>
                ))}
              </nav>
            </FadeIn>

            <div className="grid gap-6">
              <FadeIn delay={0.1}>
                <Card id="receipt-intake">
                  <CardContent className="grid gap-5 p-6">
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
                      <Badge className="border-border bg-bg-elevated text-text-secondary">
                        Manual
                      </Badge>
                    </SettingRow>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.16}>
                <Card id="notifications">
                  <CardContent className="grid gap-5 p-6">
                    <SectionHeading
                      icon={Bell}
                      title="Notifications"
                      description="Deadline reminders stay sparse by design, so alerts remain useful."
                    />

                    <SettingRow
                      label="Return deadline reminder"
                      description="A daily check sends one email when an active return window is within 3 days."
                    >
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-success">
                        Active
                      </Badge>
                    </SettingRow>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.22}>
                <Card id="account">
                  <CardContent className="grid gap-5 p-6">
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
              </FadeIn>
            </div>
          </div>
        </div>
      </main>
    </>
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
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-action shadow-inner-hair">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
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
    <div className="grid gap-3 border-t border-border/70 pt-5 md:grid-cols-[1fr_22rem] md:items-center">
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
