"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import type { AdminUserStatusFilter } from "@/types/admin";

/**
 * Search box for the admin users table. Submits by navigating to
 * `/admin/users?q=...`, which re-runs the server query. Kept as a
 * tiny client island so the table itself stays a server component.
 */
export function AdminUserSearch({
  initialQuery,
  status = "all",
}: {
  initialQuery: string;
  status?: AdminUserStatusFilter;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (status !== "all") params.set("status", status);
    const qs = params.toString();
    router.push(qs ? `/admin/users?${qs}` : "/admin/users");
  }

  return (
    <form onSubmit={submit} className="relative w-full sm:max-w-xs">
      <span className="sr-only">Search users by email</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by email"
        className="pl-9"
      />
    </form>
  );
}
