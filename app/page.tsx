import { LandingPage } from "@/components/landing/landing-page";

/**
 * Landing page (`/`) — public marketing entry point.
 *
 * The composition lives in `<LandingPage>` (a client component) so it can
 * drive scroll-reveal motion. It recreates the structure and motion
 * language of a calm, premium AI product landing page using Receipt
 * Guardian's own design tokens, original copy, and original assets — it
 * does not reproduce any third-party proprietary material.
 *
 * From here users sign up (`/signup`) or log in (`/login`).
 */
export default function HomePage() {
  return <LandingPage />;
}
