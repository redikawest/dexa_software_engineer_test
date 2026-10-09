import { useState } from "react";

import { Alert, inputClass, primaryButton, secondaryButton } from "~/components/ui";
import { formatDate } from "~/lib/date";

export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

type DateRangeFilterProps = {
  value: DateRange;
  defaultValue: DateRange;
  onChange: (range: DateRange) => void;
  maxDays?: number;
};

/** Collapsible period picker. Inputs are kept as a draft until "Apply" is pressed. */
export function DateRangeFilter({ value, defaultValue, onChange, maxDays }: DateRangeFilterProps) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDefault = value.from === defaultValue.from && value.to === defaultValue.to;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.from || !draft.to) {
      setError("Enter a start date and an end date.");
      return;
    }
    if (draft.from > draft.to) {
      setError("Start date can't be after the end date.");
      return;
    }
    const days = (Date.parse(`${draft.to}T00:00:00Z`) - Date.parse(`${draft.from}T00:00:00Z`)) / 86_400_000 + 1;
    if (maxDays && days > maxDays) {
      setError(`Choose a period of at most ${maxDays} days.`);
      return;
    }
    setError(null);
    onChange(draft);
    setOpen(false);
  }

  function handleReset() {
    setDraft(defaultValue);
    setError(null);
    onChange(defaultValue);
    setOpen(false);
  }

  return (
    <details
      className="group rounded-xl border border-gray-200 bg-white"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
        <span>
          <span className="text-gray-500">Period: </span>
          <span className="font-medium">
            {formatDate(value.from)} &ndash; {formatDate(value.to)}
          </span>
          {isDefault && <span className="ml-2 text-gray-400">(this month)</span>}
        </span>
        <span className="text-blue-600 group-open:hidden">Change</span>
        <span className="hidden text-blue-600 group-open:inline">Close</span>
      </summary>

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="from" className="mb-1.5 block text-sm text-gray-600">
              From
            </label>
            <input
              id="from"
              type="date"
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              className={inputClass()}
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1.5 block text-sm text-gray-600">
              To
            </label>
            <input
              id="to"
              type="date"
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              className={inputClass()}
            />
          </div>
        </div>
        {error && <Alert kind="error">{error}</Alert>}
        <div className="flex gap-2">
          <button type="submit" className={primaryButton}>
            Apply
          </button>
          <button type="button" onClick={handleReset} className={secondaryButton}>
            This month
          </button>
        </div>
      </form>
    </details>
  );
}
