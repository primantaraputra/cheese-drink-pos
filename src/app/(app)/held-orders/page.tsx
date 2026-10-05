"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function HeldOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pos");
  }, [router]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-stone-500">
      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      <p className="text-sm font-medium">Mengalihkan ke Kasir POS...</p>
    </div>
  );
}
