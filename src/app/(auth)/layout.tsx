import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50/40 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-amber-950/20">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
