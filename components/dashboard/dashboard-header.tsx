import { LogOut, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  email: string | undefined;
}

export function DashboardHeader({ email }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border py-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-action">
          <ReceiptText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-semibold text-text-primary">
            Receipt Guardian
          </p>
          <p className="text-sm text-text-secondary">{email}</p>
        </div>
      </div>
      <form action="/api/auth/logout" method="post">
        <Button type="submit" variant="secondary">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </form>
    </header>
  );
}
