"use client";

import { WifiOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-stone-50 dark:bg-stone-950">
      <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
        <WifiOff className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 mb-2">
        Koneksi Internet Terputus
      </h1>
      <p className="text-stone-500 max-w-sm mb-6 text-sm">
        Aplikasi Cheese Drink POS sedang tidak dapat terhubung ke server. Periksa jaringan WiFi atau kuota data Anda.
      </p>
      <Button
        onClick={() => window.location.reload()}
        className="gap-2 font-bold px-6"
      >
        <RotateCcw className="w-4 h-4" />
        Muat Ulang Halaman
      </Button>
    </div>
  );
}
