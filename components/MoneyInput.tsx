"use client";

import { useState } from "react";
import {
  formatMoneyDisplay,
  parseMoneyInput,
  roundToCents,
} from "@/lib/money-format";

type MoneyInputProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  id?: string;
  required?: boolean;
  optional?: boolean;
  allowNegative?: boolean;
  min?: number;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
};

export function MoneyInput({
  value,
  onChange,
  id,
  required = false,
  optional = false,
  allowNegative = false,
  min,
  className = "w-full rounded-lg border border-zinc-300 px-3 py-2",
  placeholder = "0.00",
  readOnly = false,
}: MoneyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const displayValue = readOnly
    ? value === undefined
      ? ""
      : formatMoneyDisplay(value)
    : isFocused
      ? draft
      : value === undefined
        ? ""
        : formatMoneyDisplay(value);

  function commitValue(raw: string) {
    const parsed = parseMoneyInput(raw);

    if (parsed === null) {
      onChange(optional ? undefined : 0);
      return;
    }

    let next = roundToCents(parsed);
    if (!allowNegative && next < 0) {
      next = 0;
    }
    if (min !== undefined && next < min) {
      next = min;
    }

    onChange(next);
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    if (readOnly) return;
    setIsFocused(true);
    setDraft(value === undefined ? "" : String(value));
    event.target.select();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (readOnly) return;
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    if (nextDraft === "" || nextDraft === "-") {
      if (optional) {
        onChange(undefined);
      }
      return;
    }

    const parsed = parseMoneyInput(nextDraft);
    if (parsed === null) {
      return;
    }

    if (!allowNegative && parsed < 0) {
      return;
    }

    onChange(roundToCents(parsed));
  }

  function handleBlur() {
    if (readOnly) return;
    setIsFocused(false);
    commitValue(draft);
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      required={required}
      placeholder={placeholder}
      className={
        readOnly
          ? className.replace("border-zinc-300", "border-zinc-200 bg-zinc-50 text-zinc-800")
          : className
      }
      value={displayValue}
      readOnly={readOnly}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

type MoneyFieldProps = MoneyInputProps & {
  label: string;
  helperText?: string;
};

export function MoneyField({
  label,
  helperText,
  className,
  readOnly = false,
  ...inputProps
}: MoneyFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <MoneyInput
        className={className ?? "w-full rounded-lg border border-zinc-300 px-3 py-2"}
        readOnly={readOnly}
        {...inputProps}
      />
      {helperText && !readOnly ? (
        <span className="mt-1 block text-xs text-zinc-500">{helperText}</span>
      ) : null}
    </label>
  );
}
