"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AddMenu } from "@/components/dashboard/add-menu";
import { Button } from "@/components/ui/button";

/**
 * `<HeaderAddButton>` — top-right `+ Add` trigger that opens the
 * shared `<AddMenu>` directly under itself. Reuses the same menu the
 * floating composer FAB shows so the user has one mental model.
 *
 * Each menu action navigates to a dashboard route with a `?action=`
 * query param. The dashboard reads the param on mount and opens the
 * corresponding flow (camera / upload / paste / manual / settings),
 * stripping the param on completion so refreshes never re-trigger.
 *
 * This deep-link pattern keeps the header decoupled from the
 * dashboard's React state — the header lives in the layout, the
 * dashboard mounts only on /dashboard, and URL is the contract.
 */
export function HeaderAddButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <AddMenu
      open={open}
      onClose={() => setOpen(false)}
      align="top-right"
      onCapture={() => router.push("/dashboard?action=capture")}
      onUpload={() => router.push("/dashboard?action=upload")}
      onPasteEmail={() => router.push("/dashboard?action=paste")}
      onAddManual={() => router.push("/dashboard?action=manual")}
      onSettings={() => router.push("/settings")}
      trigger={
        <Button
          type="button"
          size="sm"
          aria-label="Add receipt"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Plus data-icon aria-hidden="true" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      }
    />
  );
}
