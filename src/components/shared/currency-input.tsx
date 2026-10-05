"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatNumber, parseIDR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, prefix = "Rp", className, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      value > 0 ? formatNumber(value) : ""
    );

    React.useEffect(() => {
      setDisplayValue(value > 0 ? formatNumber(value) : "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const numeric = parseIDR(raw);
      setDisplayValue(numeric > 0 ? formatNumber(numeric) : "");
      onChange(numeric);
    };

    return (
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 text-sm font-bold text-stone-400 select-none">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0"
          className={cn(prefix && "pl-11 font-medium", className)}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
