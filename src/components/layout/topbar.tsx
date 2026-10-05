"use client";

import { useEffect, useState } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Moon,
  Wifi,
  WifiOff,
  LogOut,
  Clock,
  Sparkles,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface TopbarProps {
  user: Profile | null;
  activeShift?: { id: string; opened_at: string; status: string } | null;
}

export function Topbar({ user, activeShift }: TopbarProps) {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    syncTheme();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("theme-change", syncTheme);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("theme-change", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(nextDark);
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/90 lg:px-6">
      {/* Brand & Shift status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-400">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-amber-950">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="hidden font-bold tracking-tight sm:inline text-lg">
            Cheese Drink
          </span>
        </div>

        {/* Shift status badge */}
        {activeShift ? (
          <Badge variant="success" className="gap-1.5 py-1 px-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline font-semibold">Shift Aktif</span>
            <span className="sm:hidden font-semibold">Shift Buka</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-stone-500 border-amber-300 bg-amber-50/50 dark:bg-stone-800">
            <Clock className="h-3 w-3 text-amber-600" />
            <span className="font-semibold text-amber-800 dark:text-amber-400">Belum Ada Shift</span>
          </Badge>
        )}
      </div>

      {/* Right controls: Online/Offline, Theme Toggle, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network indicator */}
        {mounted && !isOnline ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full animate-bounce">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Mode Offline</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
            <Wifi className="h-3.5 w-3.5" />
            <span>Online</span>
          </div>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle tema gelap/terang"
          className="rounded-xl text-stone-600 dark:text-stone-300"
        >
          {mounted && isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User info & quick logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-bold text-stone-800 dark:text-stone-200 leading-tight">
              {user?.full_name || "Kasir"}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {user?.role === "owner" ? "Pemilik (Owner)" : "Kasir"}
            </span>
          </div>

          <form action={logoutAction}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="h-9 px-3 gap-1.5 rounded-xl border-stone-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/50"
              title="Keluar dari akun"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold">Keluar</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
