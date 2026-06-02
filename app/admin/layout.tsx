import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/**
 * Admin area layout. `requireAdmin()` runs server-side on every
 * admin page render — a second line of defence behind the
 * middleware guard, so even if middleware is bypassed the page data
 * never loads for a non-admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-canvas">
      <AdminHeader email={user.email} />
      <main className="mx-auto w-full max-w-wide px-4 pb-16 pt-6 sm:px-6 md:px-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
