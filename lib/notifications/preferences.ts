import "server-only";

export const DEFAULT_REMINDER_THRESHOLDS = [20, 7, 3, 1, 0] as const;
export type ReminderThreshold = (typeof DEFAULT_REMINDER_THRESHOLDS)[number];

export interface NotificationPreferences {
  defaultCurrency: string;
  onboardingCompleted: boolean;
  introToAppEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  reminderThresholds: ReminderThreshold[];
}

type ProfilePreferenceRow = {
  default_currency?: string | null;
  onboarding_completed?: boolean | null;
  intro_to_app_enabled?: boolean | null;
  email_notifications_enabled?: boolean | null;
  push_notifications_enabled?: boolean | null;
  reminder_thresholds?: number[] | null;
};

const ALLOWED_THRESHOLDS = new Set<number>(DEFAULT_REMINDER_THRESHOLDS);

export function normalizeCurrency(value: unknown) {
  if (typeof value !== "string") return "USD";
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "USD";
}

export function normalizeReminderThresholds(
  thresholds: unknown,
): ReminderThreshold[] {
  if (!Array.isArray(thresholds)) return [...DEFAULT_REMINDER_THRESHOLDS];

  const unique = Array.from(
    new Set(
      thresholds
        .map((value) => Number(value))
        .filter((value): value is ReminderThreshold =>
          ALLOWED_THRESHOLDS.has(value),
        ),
    ),
  ).sort((left, right) => right - left);

  return unique.length > 0 ? unique : [...DEFAULT_REMINDER_THRESHOLDS];
}

export function mapNotificationPreferences(
  row: ProfilePreferenceRow | null | undefined,
): NotificationPreferences {
  return {
    defaultCurrency: normalizeCurrency(row?.default_currency),
    onboardingCompleted: Boolean(row?.onboarding_completed),
    introToAppEnabled: Boolean(row?.intro_to_app_enabled),
    emailNotificationsEnabled: row?.email_notifications_enabled !== false,
    pushNotificationsEnabled: Boolean(row?.push_notifications_enabled),
    reminderThresholds: normalizeReminderThresholds(row?.reminder_thresholds),
  };
}
