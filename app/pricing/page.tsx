import type { Metadata } from "next";

import { PricingPage } from "@/components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing | Receipt Guardian",
  description:
    "Compare Receipt Guardian plans for receipt tracking, reminders, Gmail import, PWA notifications, and warranty tracking.",
};

export default function PricingRoute() {
  return <PricingPage />;
}
