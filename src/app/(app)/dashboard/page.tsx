"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSalesSummaryAction,
  getSalesByDayAction,
  getSalesByHourAction,
  getTopProductsAction,
  getSalesByPaymentMethodAction,
} from "@/actions/report.actions";
import { getActiveShiftAction } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Coins,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PAYMENT_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#64748b"];

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");

  const getDateRange = () => {
    const today = new Date();
    const formatDateStr = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = formatDateStr(today);

    if (period === "today") {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (period === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      return { startDate: formatDateStr(past), endDate: todayStr };
    }
    const past = new Date(today);
    past.setDate(past.getDate() - 30);
    return { startDate: formatDateStr(past), endDate: todayStr };
  };

  const { startDate, endDate } = getDateRange();

  // Queries
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["sales_summary", startDate, endDate],
    queryFn: () => getSalesSummaryAction(startDate, endDate),
  });

  const { data: salesByDay = [] } = useQuery({
    queryKey: ["sales_by_day", startDate, endDate],
    queryFn: () => getSalesByDayAction(startDate, endDate),
  });

  const { data: salesByHour = [] } = useQuery({
    queryKey: ["sales_by_hour", startDate, endDate],
    queryFn: () => getSalesByHourAction(startDate, endDate),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top_products", startDate, endDate],
    queryFn: () => getTopProductsAction(startDate, endDate, 5),
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment_methods", startDate, endDate],
    queryFn: () => getSalesByPaymentMethodAction(startDate, endDate),
  });

  const { data: activeShift } = useQuery({
    queryKey: ["active_shift"],
    queryFn: () => getActiveShiftAction(),
  });

  const formattedChartData = salesByDay.map((d) => ({
    date: formatDate(d.sale_date, "dd/MM"),
    total: Number(d.total_sales),
    orders: Number(d.order_count),
  }));

  const formattedHourlyData = salesByHour.map((h) => ({
    hour: `${String(h.sale_hour).padStart(2, "0")}:00`,
    total: Number(h.total_sales),
    orders: Number(h.order_count),
  }));

  const formattedPaymentData = paymentMethods.map((p) => ({
    name: p.payment_method.toUpperCase(),
    value: Number(p.total_amount),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-amber-500" />
            Dashboard Ringkasan Usaha
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Pantau arus omzet, produk terlaris, jam sibuk, dan kinerja keuangan UMKM Cheese Drink
          </p>
        </div>

        {/* Filter Period Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setPeriod("today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === "today"
                ? "bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-white"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod("7days")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === "7days"
                ? "bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-white"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriod("30days")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === "30days"
                ? "bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-white"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Banner Shift Status & Quick POS Access */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-5 text-amber-950 shadow-lg shadow-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950 text-amber-300">
              {activeShift ? "SHIFT KASIR SEDANG AKTIF" : "BELUM ADA SHIFT BUKA"}
            </span>
            <span className="text-xs font-bold text-amber-950/80">
              WIB (Asia/Jakarta)
            </span>
          </div>
          <h2 className="text-xl font-black">
            {activeShift
              ? `Kasir sedang bertransaksi (Modal: ${formatIDR(activeShift.opening_cash)})`
              : "Buka shift kasir terlebih dahulu untuk memulai penjualan hari ini"}
          </h2>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button asChild className="font-black bg-amber-950 text-amber-300 hover:bg-black hover:text-amber-200 shadow-md">
            <Link href="/pos">
              Buka Layar Kasir (POS)
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Penjualan */}
        <Card className="border-amber-200 dark:border-amber-900/50 bg-white dark:bg-stone-900 shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Omzet</span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-400">
                {summaryLoading ? "..." : formatIDR(summary?.total_sales || 0)}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {summary?.total_orders || 0} transaksi berhasil
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rata-Rata Tiket */}
        <Card className="border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Rata-Rata Tiket</span>
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                {summaryLoading ? "..." : formatIDR(summary?.avg_ticket || 0)}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">per pelanggan / nota</p>
            </div>
          </CardContent>
        </Card>

        {/* Estimasi Laba Kotor */}
        <Card className="border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Laba Kotor</span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {summaryLoading ? "..." : formatIDR(summary?.gross_profit || 0)}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Omzet − HPP Bahan</p>
            </div>
          </CardContent>
        </Card>

        {/* Transaksi Batal (Void) */}
        <Card className="border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Transaksi Void</span>
              <div className="p-2 rounded-xl bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
                {summaryLoading ? "..." : summary?.void_count || 0}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Senilai {formatIDR(summary?.void_amount || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts: Tren Penjualan & Jam Sibuk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tren Penjualan (8 cols) */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Tren Penjualan ({period === "today" ? "Hari Ini" : period === "7days" ? "7 Hari" : "30 Hari"})</CardTitle>
            <CardDescription>
              Volume omzet penjualan bersih dari pesanan yang selesai
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formattedChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-stone-400 text-xs">
                Belum ada data transaksi pada rentang waktu ini
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedChartData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [formatIDR(Number(val) || 0), "Omzet"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Komposisi Metode Pembayaran (4 cols) */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
            <CardDescription>Porsi transaksi Tunai, QRIS, & Transfer</CardDescription>
          </CardHeader>
          <CardContent>
            {formattedPaymentData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-stone-400 text-xs">
                Belum ada transaksi pembayaran
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={formattedPaymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {formattedPaymentData.map((_, idx) => (
                        <Cell key={idx} fill={PAYMENT_COLORS[idx % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: unknown) => formatIDR(Number(val) || 0)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {formattedPaymentData.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-stone-600">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                      />
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Jam Tersibuk & Top 5 Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Jam Tersibuk (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Jam Tersibuk Pelanggan (00:00 - 23:00)</CardTitle>
            <CardDescription>
              Membantu penentuan jadwal karyawan dan waktu restock bahan baku
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formattedHourlyData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-stone-400 text-xs">
                Belum ada transaksi pada jam operasional
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedHourlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val: unknown) => [formatIDR(Number(val) || 0), "Omzet"]} />
                    <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Produk Terlaris (5 cols) */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top 5 Produk Terlaris</CardTitle>
              <CardDescription>Menu paling diminati pelanggan</CardDescription>
            </div>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-stone-400 text-xs">
                Belum ada penjualan produk
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.product_id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/40 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100">
                          {p.product_name}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          Terjual: {p.total_qty} porsi
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-amber-600">
                      {formatIDR(p.total_sales)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
