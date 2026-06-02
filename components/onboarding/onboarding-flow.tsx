"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  onboardingReducer,
  type OnboardingAction,
} from "@/lib/onboarding/state";
import type { OnboardingStepIndex } from "@/lib/onboarding/types";

import { StepCover } from "./steps/step-cover";
import {
  StepNotifications,
  type NotificationPreference,
} from "./steps/step-notifications";
import { StepCameraPermission } from "./steps/step-camera-permission";
import {
  StepCurrency,
  normalizeOnboardingCurrency,
} from "./steps/step-currency";
import {
  StepReminders,
  thresholdsForReminderPreset,
  type ReminderPreset,
} from "./steps/step-reminders";
import {
  StepGmailImport,
  type GmailSetupChoice,
} from "./steps/step-gmail-import";
import {
  StepFirstReceipt,
  type FirstReceiptPreference,
} from "./steps/step-first-receipt";
import { StepFinish } from "./steps/step-finish";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OnboardingSetupResult {
  currency: string;
  notificationPreference: NotificationPreference;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  reminderPreset: ReminderPreset;
  reminderThresholds: number[];
  gmailSetupChoice: GmailSetupChoice;
  firstReceiptPreference: FirstReceiptPreference;
}

export interface OnboardingFlowProps {
  /** Initial step. Defaults to 1. Used when resuming from Onboarding_State.lastStep. */
  initialStep?: OnboardingStepIndex;
  defaultCurrency?: string;
  /** Called when the user taps Skip or Get started. */
  onComplete: (setup: OnboardingSetupResult) => void;
  /** Called whenever the active step changes; consumer may persist lastStep. */
  onStepChange?: (step: OnboardingStepIndex) => void;
}

// ---------------------------------------------------------------------------
// Step registry
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 8;

function toStep(value: number): OnboardingStepIndex {
  return Math.min(TOTAL_STEPS, Math.max(1, value)) as OnboardingStepIndex;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * OnboardingFlow — full-bleed mobile onboarding overlay.
 *
 * Renders exactly one of five step components at a time, occupying the
 * full viewport minus safe-area insets. Handles swipe gestures, keyboard
 * activation, focus trapping, and reduced-motion compliance.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 1.12, 1.13, 7.5, 7.6
 */
export function OnboardingFlow({
  initialStep = 1,
  defaultCurrency = "USD",
  onComplete,
  onStepChange,
}: OnboardingFlowProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [currentStep, setCurrentStep] = useState<OnboardingStepIndex>(
    toStep(initialStep),
  );
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currency, setCurrency] = useState(
    normalizeOnboardingCurrency(defaultCurrency) || "USD",
  );
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference>("email_only");
  const [reminderPreset, setReminderPreset] =
    useState<ReminderPreset>("smart");
  const [gmailSetupChoice, setGmailSetupChoice] =
    useState<GmailSetupChoice>("manual_first");
  const [firstReceiptPreference, setFirstReceiptPreference] =
    useState<FirstReceiptPreference>("ai_paste");
  const reduceMotion = useReducedMotion();

  // Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // -------------------------------------------------------------------------
  // Dispatch helper
  // -------------------------------------------------------------------------

  const buildSetupResult = useCallback((): OnboardingSetupResult => {
    const safeCurrency = normalizeOnboardingCurrency(currency) || "USD";
    return {
      currency: safeCurrency,
      notificationPreference,
      emailNotificationsEnabled: notificationPreference !== "quiet",
      pushNotificationsEnabled: notificationPreference === "email_and_app",
      reminderPreset,
      reminderThresholds: thresholdsForReminderPreset(reminderPreset),
      gmailSetupChoice,
      firstReceiptPreference,
    };
  }, [
    currency,
    firstReceiptPreference,
    gmailSetupChoice,
    notificationPreference,
    reminderPreset,
  ]);

  const dispatch = useCallback(
    (action: OnboardingAction) => {
      const result = onboardingReducer(currentStep, action);

      if (result.type === "complete") {
        onComplete(buildSetupResult());
        return;
      }

      if (result.step !== currentStep) {
        setDirection(result.step > currentStep ? 1 : -1);
        setCurrentStep(result.step);
        onStepChange?.(result.step);
      }
    },
    [buildSetupResult, currentStep, onComplete, onStepChange],
  );

  // -------------------------------------------------------------------------
  // Focus management
  // -------------------------------------------------------------------------

  // Store the previously focused element on mount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }, []);

  // Focus the primary button on step change
  useEffect(() => {
    // Small delay to allow the DOM to settle after step transition
    const timer = setTimeout(() => {
      const btn = overlayRef.current?.querySelector<HTMLElement>(
        "[data-primary-action]",
      );
      btn?.focus();
    }, 20);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      // Restore focus to the dashboard's first interactive element
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") {
        // Use setTimeout to ensure the overlay is fully unmounted
        setTimeout(() => prev.focus(), 0);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Suppress dashboard Decorative_Element (Requirement 1.13)
  // -------------------------------------------------------------------------

  useEffect(() => {
    document.documentElement.setAttribute("data-onboarding-open", "true");
    return () => {
      document.documentElement.removeAttribute("data-onboarding-open");
    };
  }, []);

  // -------------------------------------------------------------------------
  // Focus trap
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Tab") {
        const overlay = overlayRef.current;
        if (!overlay) return;

        const focusable = overlay.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Touch/swipe handling
  // -------------------------------------------------------------------------

  const handleTouchStart = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    // Ignore multi-touch gestures (pinch-zoom) — never hijack them.
    // The user must be able to pinch-zoom the onboarding content.
    if (e.touches.length > 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      const start = touchStartRef.current;
      if (!start) return;

      // If a second finger was involved at any point, treat as a pinch and
      // do not commit a swipe.
      if (e.touches.length > 0 || e.changedTouches.length > 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      touchStartRef.current = null;

      // Dispatch swipe action — the reducer handles commit logic
      dispatch({ type: "swipe", deltaX, deltaY });
    },
    [dispatch],
  );

  // -------------------------------------------------------------------------
  // Transition end handler
  // -------------------------------------------------------------------------

  const handleTransitionEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  // Track animation state on step change
  useEffect(() => {
    setIsAnimating(true);
  }, [currentStep]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isLastStep = currentStep === TOTAL_STEPS;
  const primaryLabel = isLastStep ? "Get started" : "Continue";
  const stepContent =
    currentStep === 1 ? (
      <StepCover />
    ) : currentStep === 2 ? (
      <StepCurrency value={currency} onChange={setCurrency} />
    ) : currentStep === 3 ? (
      <StepReminders value={reminderPreset} onChange={setReminderPreset} />
    ) : currentStep === 4 ? (
      <StepNotifications
        value={notificationPreference}
        onChange={setNotificationPreference}
      />
    ) : currentStep === 5 ? (
      <StepCameraPermission />
    ) : currentStep === 6 ? (
      <StepGmailImport
        value={gmailSetupChoice}
        onChange={setGmailSetupChoice}
      />
    ) : currentStep === 7 ? (
      <StepFirstReceipt
        value={firstReceiptPreference}
        onChange={setFirstReceiptPreference}
      />
    ) : (
      <StepFinish />
    );

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
      className="fixed inset-0 z-50 flex flex-col bg-canvas"
      style={{
        width: "100vw",
        height: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Go back"
          disabled={currentStep === 1}
          onClick={() => dispatch({ type: "back" })}
          className={cn(currentStep === 1 && "opacity-0")}
        >
          <ArrowLeft data-icon="inline-start" />
        </Button>
        <div className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-text-secondary">
          {currentStep}/{TOTAL_STEPS}
        </div>
      </div>

      {/* Step content with transition wrapper */}
      <div
        className="relative flex flex-1 overflow-hidden"
        data-reduced-motion="static"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentStep}
            custom={direction}
            className={cn(
              "absolute inset-0 flex flex-col",
              isAnimating && "will-change-transform",
            )}
            initial={
              reduceMotion
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: direction > 0 ? 28 : -28 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              reduceMotion
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: direction > 0 ? -28 : 28 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: [0.2, 0, 0, 1],
            }}
            onAnimationComplete={handleTransitionEnd}
            data-step={currentStep}
          >
            {stepContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-4">
        {/* Progress indicator — five static accent dots */}
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label={`Step ${currentStep} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full transition-colors duration-default ease-standard",
                i + 1 === currentStep ? "bg-accent" : "bg-border-strong",
              )}
            />
          ))}
        </div>

        {/* Primary action button — first focus stop */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          data-primary-action
          disabled={!normalizeOnboardingCurrency(currency)}
          onClick={() => dispatch(isLastStep ? { type: "finish" } : { type: "advance" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dispatch(isLastStep ? { type: "finish" } : { type: "advance" });
            }
          }}
        >
          {primaryLabel}
        </Button>

        {/* Skip button — steps 1–4 only */}
        {!isLastStep && (
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => dispatch({ type: "skip" })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                dispatch({ type: "skip" });
              }
            }}
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}

export default OnboardingFlow;
