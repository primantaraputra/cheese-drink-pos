import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center dark:border-stone-800">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-stone-500 max-w-sm mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="font-bold">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
