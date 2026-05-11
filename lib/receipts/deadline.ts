import {
  differenceInCalendarDays,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";

import type { ReceiptWithUrgency, Urgency } from "@/types/receipt";

export function getDaysRemaining(
  deadline: string | Date | null | undefined,
  now = new Date(),
) {
  if (!deadline) {
    return null;
  }

  const deadlineDate =
    typeof deadline === "string" ? parseISO(deadline) : deadline;
  if (!isValid(deadlineDate)) {
    return null;
  }

  return differenceInCalendarDays(startOfDay(deadlineDate), startOfDay(now));
}

export function getUrgency(
  deadline: string | Date | null | undefined,
  now = new Date(),
): Urgency {
  const days = getDaysRemaining(deadline, now);

  if (days === null || days < 3) {
    return "red";
  }

  if (days <= 7) {
    return "yellow";
  }

  return "green";
}

function urgencyWeight(receipt: ReceiptWithUrgency) {
  if (receipt.status !== "active") {
    return 10000;
  }

  if (receipt.days_remaining === null) {
    return 9999;
  }

  return receipt.days_remaining;
}

export function sortByUrgency(receipts: ReceiptWithUrgency[]) {
  return [...receipts].sort((a, b) => {
    const urgencyDiff = urgencyWeight(a) - urgencyWeight(b);
    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}
