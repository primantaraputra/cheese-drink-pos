"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Store,
  Receipt,
  PauseCircle,
  Clock,
  ArrowDownCircle,
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
  Printer,
} from "lucide-react";
import type { UserRole } from "@/types/database.types";

interface SidebarProps {
  role?: UserRole;
}

export function Sidebar({ role = "cashier" }: SidebarProps) {
  const pathname = usePathname();
  const isOwner = role === "owner";

  const staffNavItems = [
    { href: "/pos", label: "Kasir (POS)", icon: Store },
    { href: "/orders", label: "Riwayat Pesanan", icon: Receipt },
    { href: "/shifts", label: "Shift Kasir", icon: Clock },
    { href: "/expenses", label: "Pengeluaran", icon: ArrowDownCircle },
  ];

  const ownerNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Produk & Menu", icon: UtensilsCrossed },
    { href: "/categories", label: "Kategori", icon: Layers },
    { href: "/modifiers", label: "Topping & Opsi", icon: Sparkles },
    { href: "/inventory", label: "Inventori Stok", icon: Boxes },
    { href: "/customers", label: "Pelanggan", icon: Users },
    { href: "/reports", label: "Laporan Keuangan", icon: BarChart3 },
    { href: "/users", label: "Kelola Kasir", icon: UserCheck },
    { href: "/settings/store", label: "Pengaturan Toko", icon: Settings },
    { href: "/settings/receipt", label: "Desain Struk", icon: Printer },
    { href: "/audit-logs", label: "Audit Log", icon: History },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 shrink-0">
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-4 gap-6">
        {/* Menu Kasir & Operasional */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Operasional Kasir
          </div>
          <nav className="space-y-1">
            {staffNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/pos" && pathname.startsWith(item.href));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-amber-500 text-amber-950 shadow-sm shadow-amber-500/10 font-bold"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-amber-950" : "text-stone-500")} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Menu Khusus Owner */}
        {isOwner && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
              Manajemen Pemilik
            </div>
            <nav className="space-y-1">
              {ownerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      isActive
                        ? "bg-amber-500 text-amber-950 shadow-sm shadow-amber-500/10 font-bold"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-amber-950" : "text-stone-500")} />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
