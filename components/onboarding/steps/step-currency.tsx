import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";

const CURRENCIES = [
  { code: "INR", label: "Indian rupee", sample: "₹1,499" },
  { code: "USD", label: "US dollar", sample: "$49" },
  { code: "EUR", label: "Euro", sample: "€45" },
  { code: "GBP", label: "British pound", sample: "£39" },
] as const;

export function normalizeOnboardingCurrency(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "";
}

export function StepCurrency({
  value,
  onChange,
}: {
  value: string;
  onChange: (currency: string) => void;
}) {
  const selectedPreset = CURRENCIES.some((currency) => currency.code === value);
  const customValue = selectedPreset ? "" : value;
  const customInvalid = customValue.length > 0 && !normalizeOnboardingCurrency(customValue);

  function updateCustom(nextValue: string) {
    const normalized = nextValue.trim().toUpperCase().slice(0, 3);
    onChange(normalized);
  }

  return (
    <div className="flex flex-1 flex-col justify-center overflow-y-auto px-5 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            Setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
            Choose your money format
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Receipts start with this currency. Every item can still be edited.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CURRENCIES.map((currency) => {
            const selected = value === currency.code;
            return (
              <button
                key={currency.code}
                type="button"
                onClick={() => onChange(currency.code)}
                aria-pressed={selected}
                className={cn(
                  "min-h-20 rounded-md border p-3 text-left transition-[background-color,border-color,transform] duration-default ease-standard active:scale-[0.985]",
                  selected
                    ? "border-accent bg-accent-tint text-text-primary"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-hover",
                )}
              >
                <span className="block text-sm font-semibold text-text-primary">
                  {currency.code}
                </span>
                <span className="mt-1 block text-xs leading-5">
                  {currency.label}
                </span>
                <span className="mt-2 block font-mono text-xs text-text-muted">
                  {currency.sample}
                </span>
              </button>
            );
          })}
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-primary">
            Custom currency
          </span>
          <Input
            value={customValue}
            onChange={(event) => updateCustom(event.target.value)}
            placeholder="AUD"
            aria-invalid={customInvalid}
            maxLength={3}
            inputMode="text"
            autoCapitalize="characters"
          />
          <span className={cn("text-xs leading-5", customInvalid ? "text-danger" : "text-text-muted")}>
            Use a 3-letter currency code, for example CAD, AED, or JPY.
          </span>
        </label>

        <p className="rounded-md border border-border bg-surface px-4 py-3 text-center text-sm text-text-secondary">
          Selected: <span className="font-semibold text-text-primary">{value}</span>
        </p>
      </div>
    </div>
  );
}
