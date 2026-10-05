"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Store, Receipt, Clock, Menu, X } from "lucide-react";
import type { UserRole } from "@/types/database.types";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Sparkles,
  Boxes,
  Users,
  Tag,
  BarChart3,
  UserCheck,
  Settings,
  History,
  PauseCircle,
  ArrowDownCircle,
} from "lucide-react";

interface BottomNavProps {
  role?: UserRole;
}

export function BottomNav({ role = "cashier" }: BottomNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isOwner = role === "owner";

  const mainTabs = [
    { href: "/pos", label: "Kasir", icon: Store },
    { href: "/orders", label: "Pesanan", icon: Receipt },
    { href: "/shifts", label: "Shift", icon: Clock },
  ];

  const drawerItems = [
    { href: "/expenses", label: "Catat Pengeluaran", icon: ArrowDownCircle, forAll: true },
    { href: "/dashboard", label: "Dashboard Ringkasan", icon: LayoutDashboard, ownerOnly: true },
    { href: "/products", label: "Kelola Produk", icon: UtensilsCrossed, ownerOnly: true },
    { href: "/categories", label: "Kategori Produk", icon: Layers, ownerOnly: true },
    { href: "/modifiers", label: "Topping & Opsi", icon: Sparkles, ownerOnly: true },
    { href: "/inventory", label: "Stok & Inventori", icon: Boxes, ownerOnly: true },
    { href: "/customers", label: "Pelanggan", icon: Users, ownerOnly: true },
    { href: "/reports", label: "Laporan Keuangan", icon: BarChart3, ownerOnly: true },
    { href: "/users", label: "Kelola Kasir", icon: UserCheck, ownerOnly: true },
    { href: "/settings/store", label: "Pengaturan Toko", icon: Settings, ownerOnly: true },
    { href: "/audit-logs", label: "Audit Log", icon: History, ownerOnly: true },
  ];

  const filteredDrawerItems = drawerItems.filter(
    (item) => item.forAll || (isOwner && item.ownerOnly)
  );

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-t-3xl max-h-[80vh] flex flex-col p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="font-bold text-lg text-amber-950 dark:text-amber-400">
                Menu & Fitur Lainnya
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5"
                  title="Ganti Tema Gelap/Terang"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Tema</span>
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto py-3 grid grid-cols-2 gap-2">
              {filteredDrawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold border transition-all",
                      isActive
                        ? "bg-amber-500 text-amber-950 border-amber-500 font-bold"
                        : "border-stone-200 bg-stone-50/50 hover:bg-amber-50/40 text-stone-700 dark:border-stone-800 dark:bg-stone-800/40 dark:text-stone-300"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="truncate">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-stone-200 bg-white/95 px-2 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/95">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all",
                isActive
                  ? "text-amber-600 dark:text-amber-400 font-bold"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 font-medium"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-all",
                  isActive && "bg-amber-100 dark:bg-amber-950/60"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </a>
          );
        })}

        {/* Tombol Menu Lainnya */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all",
            drawerOpen
              ? "text-amber-600 dark:text-amber-400 font-bold"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 font-medium"
          )}
        >
          <div className="flex h-8 w-12 items-center justify-center rounded-full">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[11px] mt-0.5">Lainnya</span>
        </button>
      </nav>
    </>
  );
}
