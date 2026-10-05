"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSalesSummaryAction,
  getSalesByDayAction,
  getSalesByHourAction,
  getTopProductsAction,
  getSalesByCategoryAction,
  getSalesByPaymentMethodAction,
  getSalesByCashierAction,
  getProfitLossAction,
} from "@/actions/report.actions";
import { getShiftsAction } from "@/actions/shift.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { formatIDR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingUp,
  Package,
  CreditCard,
  Users,
  Coins,
  Clock,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [datePreset, setDatePreset] = useState<string>("today");

  const getDateRange = () => {
    const today = new Date();
    const formatDateStr = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = formatDateStr(today);

    if (datePreset === "today") {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (datePreset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const s = formatDateStr(y);
      return { startDate: s, endDate: s };
    }
    if (datePreset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      return { startDate: formatDateStr(past), endDate: todayStr };
    }
    if (datePreset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      return { startDate: formatDateStr(past), endDate: todayStr };
    }
    // This month (start of current month to today)
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: formatDateStr(firstDay), endDate: todayStr };
  };

  const { startDate, endDate } = getDateRange();

  // Queries for all 8 modules
  const { data: salesSummary } = useQuery({
    queryKey: ["report_sales_summary", startDate, endDate],
    queryFn: () => getSalesSummaryAction(startDate, endDate),
  });

  const { data: salesByDay = [], isLoading: dayLoading } = useQuery({
    queryKey: ["report_sales_by_day", startDate, endDate],
    queryFn: () => getSalesByDayAction(startDate, endDate),
  });

  const { data: topProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["report_top_products", startDate, endDate],
    queryFn: () => getTopProductsAction(startDate, endDate, 50),
  });

  const { data: salesByCategory = [], isLoading: catLoading } = useQuery({
    queryKey: ["report_sales_by_category", startDate, endDate],
    queryFn: () => getSalesByCategoryAction(startDate, endDate),
  });

  const { data: paymentMethods = [], isLoading: payLoading } = useQuery({
    queryKey: ["report_payment_methods", startDate, endDate],
    queryFn: () => getSalesByPaymentMethodAction(startDate, endDate),
  });

  const { data: cashierSales = [], isLoading: cashierLoading } = useQuery({
    queryKey: ["report_cashier_sales", startDate, endDate],
    queryFn: () => getSalesByCashierAction(startDate, endDate),
  });

  const { data: profitLoss, isLoading: plLoading } = useQuery({
    queryKey: ["report_profit_loss", startDate, endDate],
    queryFn: () => getProfitLossAction(startDate, endDate),
  });

  const { data: shifts = [], isLoading: shiftLoading } = useQuery({
    queryKey: ["report_shifts"],
    queryFn: () => getShiftsAction(),
  });

  const { data: salesByHour = [], isLoading: hourLoading } = useQuery({
    queryKey: ["report_sales_by_hour", startDate, endDate],
    queryFn: () => getSalesByHourAction(startDate, endDate),
  });

  // Export Handlers
  const exportToExcel = (data: unknown[], sheetName: string, filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}-${startDate}_to_${endDate}.xlsx`);
  };

  const exportToCSV = (data: unknown[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}-${startDate}_to_${endDate}.csv`, { bookType: "csv" });
  };

  const exportToPDF = (title: string, head: string[][], body: (string | number)[][], filename: string) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`CHEESE DRINK — ${title.toUpperCase()}`, 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Periode: ${formatDate(startDate, "dd/MM/yyyy")} s.d ${formatDate(endDate, "dd/MM/yyyy")} (WIB)`, 14, 21);

    autoTable(doc, {
      head,
      body,
      startY: 26,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 166, 35] },
    });

    doc.save(`${filename}-${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-amber-500" />
            Laporan Keuangan & Penjualan
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Analisis lengkap 8 modul laporan usaha, ekspor Excel/CSV/PDF untuk pembukuan UMKM
          </p>
        </div>

        {/* Periode Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-stone-400" />
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold dark:border-stone-800 dark:bg-stone-900 shadow-xs"
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
          </select>
        </div>
      </div>

      {/* Tabs Navigation for 8 Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl h-auto flex flex-wrap sm:flex-nowrap min-w-max gap-1">
            <TabsTrigger value="sales" className="rounded-xl text-xs gap-1.5 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              1. Penjualan
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl text-xs gap-1.5 font-bold">
              <Package className="h-3.5 w-3.5" />
              2. Produk
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-xl text-xs gap-1.5 font-bold">
              <Layers className="h-3.5 w-3.5" />
              3. Kategori
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl text-xs gap-1.5 font-bold">
              <CreditCard className="h-3.5 w-3.5" />
              4. Metode Bayar
            </TabsTrigger>
            <TabsTrigger value="cashiers" className="rounded-xl text-xs gap-1.5 font-bold">
              <Users className="h-3.5 w-3.5" />
              5. Kasir
            </TabsTrigger>
            <TabsTrigger value="profit" className="rounded-xl text-xs gap-1.5 font-bold">
              <Coins className="h-3.5 w-3.5" />
              6. Laba Rugi
            </TabsTrigger>
            <TabsTrigger value="shifts" className="rounded-xl text-xs gap-1.5 font-bold">
              <Clock className="h-3.5 w-3.5" />
              7. Kas / Shift
            </TabsTrigger>
            <TabsTrigger value="hourly" className="rounded-xl text-xs gap-1.5 font-bold">
              <BarChart3 className="h-3.5 w-3.5" />
              8. Jam Sibuk
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Laporan Penjualan */}
        <TabsContent value="sales">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Laporan Penjualan Harian</CardTitle>
                <CardDescription>
                  Total omzet: {formatIDR(salesSummary?.total_sales || 0)} dari{" "}
                  {salesSummary?.total_orders || 0} pesanan selesai
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportToExcel(
                      salesByDay.map((d) => ({
                        Tanggal: d.sale_date,
                        Total_Transaksi: d.order_count,
                        Omzet_Penjualan: d.total_sales,
                      })),
                      "Penjualan",
                      "laporan-penjualan"
                    )
                  }
                  className="gap-1.5 text-xs"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportToCSV(
                      salesByDay.map((d) => ({
                        Tanggal: d.sale_date,
                        Total_Transaksi: d.order_count,
                        Omzet_Penjualan: d.total_sales,
                      })),
                      "laporan-penjualan"
                    )
                  }
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportToPDF(
                      "Laporan Penjualan",
                      [["Tanggal", "Jumlah Transaksi", "Total Omzet"]],
                      salesByDay.map((d) => [
                        formatDate(d.sale_date, "dd/MM/yyyy"),
                        d.order_count,
                        formatIDR(d.total_sales),
                      ]),
                      "laporan-penjualan"
                    )
                  }
                  className="gap-1.5 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 text-red-600" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dayLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : salesByDay.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Tidak ada penjualan"
                  description="Belum ada transaksi selesai pada periode yang dipilih."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Jumlah Transaksi</th>
                        <th className="py-3 px-4 text-right">Total Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {salesByDay.map((d) => (
                        <tr key={d.sale_date} className="hover:bg-amber-50/20">
                          <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                            {formatDate(d.sale_date, "EEEE, dd MMMM yyyy")}
                          </td>
                          <td className="py-3.5 px-4">{d.order_count} transaksi</td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-600">
                            {formatIDR(d.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Laporan Produk */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Laporan Kinerja Produk</CardTitle>
                <CardDescription>Peringkat produk terlaris berdasarkan kuantitas dan omzet</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportToExcel(
                      topProducts.map((p, idx) => ({
                        Ranking: idx + 1,
                        Nama_Produk: p.product_name,
                        Porsi_Terjual: p.total_qty,
                        Total_Omzet: p.total_sales,
                      })),
                      "Produk",
                      "laporan-produk"
                    )
                  }
                  className="gap-1.5 text-xs"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportToPDF(
                      "Laporan Produk Terlaris",
                      [["Ranking", "Nama Produk", "Terjual (Porsi)", "Total Omzet"]],
                      topProducts.map((p, idx) => [
                        `#${idx + 1}`,
                        p.product_name,
                        p.total_qty,
                        formatIDR(p.total_sales),
                      ]),
                      "laporan-produk"
                    )
                  }
                  className="gap-1.5 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 text-red-600" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : topProducts.length === 0 ? (
                <EmptyState icon={Package} title="Belum ada data produk" description="Tidak ada penjualan produk pada periode ini." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Peringkat</th>
                        <th className="py-3 px-4">Nama Menu</th>
                        <th className="py-3 px-4">Terjual</th>
                        <th className="py-3 px-4 text-right">Total Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {topProducts.map((p, idx) => (
                        <tr key={p.product_id} className="hover:bg-amber-50/20">
                          <td className="py-3.5 px-4 font-bold text-amber-600">#{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                            {p.product_name}
                          </td>
                          <td className="py-3.5 px-4">{p.total_qty} porsi</td>
                          <td className="py-3.5 px-4 text-right font-black text-stone-900 dark:text-stone-100">
                            {formatIDR(p.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Laporan Kategori */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Kontribusi Penjualan per Kategori</CardTitle>
                <CardDescription>Porsi penjualan antara Dimsum vs Aneka Minuman</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  exportToPDF(
                    "Laporan Penjualan per Kategori",
                    [["Kategori", "Total Porsi", "Total Omzet"]],
                    salesByCategory.map((c) => [c.category_name, c.total_qty, formatIDR(c.total_sales)]),
                    "laporan-kategori"
                  )
                }
                className="gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5 text-red-600" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              {catLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : salesByCategory.length === 0 ? (
                <EmptyState icon={Layers} title="Belum ada data kategori" description="Tidak ada penjualan dalam kategori pada periode ini." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Nama Kategori</th>
                        <th className="py-3 px-4">Porsi Terjual</th>
                        <th className="py-3 px-4 text-right">Total Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {salesByCategory.map((c) => (
                        <tr key={c.category_id} className="hover:bg-amber-50/20">
                          <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                            {c.category_name}
                          </td>
                          <td className="py-3.5 px-4">{c.total_qty} item</td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-600">
                            {formatIDR(c.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Laporan Metode Pembayaran */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Laporan Metode Pembayaran</CardTitle>
                <CardDescription>Distribusi nominal dan frekuensi transaksi per channel bayar</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  exportToPDF(
                    "Laporan Metode Pembayaran",
                    [["Metode Bayar", "Jumlah Transaksi", "Total Nominal"]],
                    paymentMethods.map((p) => [p.payment_method.toUpperCase(), p.transaction_count, formatIDR(p.total_amount)]),
                    "laporan-pembayaran"
                  )
                }
                className="gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5 text-red-600" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              {payLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <EmptyState icon={CreditCard} title="Belum ada data pembayaran" description="Tidak ada transaksi pada periode ini." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Metode Bayar</th>
                        <th className="py-3 px-4">Frekuensi</th>
                        <th className="py-3 px-4 text-right">Total Masuk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {paymentMethods.map((p) => (
                        <tr key={p.payment_method} className="hover:bg-amber-50/20">
                          <td className="py-3.5 px-4 font-bold uppercase text-stone-900 dark:text-stone-100">
                            {p.payment_method}
                          </td>
                          <td className="py-3.5 px-4">{p.transaction_count} transaksi</td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-600">
                            {formatIDR(p.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Laporan Kasir */}
        <TabsContent value="cashiers">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Laporan Kinerja Kasir</CardTitle>
                <CardDescription>Akuntabilitas penjualan dan catatan pembatalan (void) per karyawan</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  exportToPDF(
                    "Laporan Kinerja Kasir",
                    [["Nama Kasir", "Transaksi Sukses", "Jumlah Void", "Total Omzet"]],
                    cashierSales.map((c) => [c.cashier_name, c.total_orders, c.void_count, formatIDR(c.total_sales)]),
                    "laporan-kasir"
                  )
                }
                className="gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5 text-red-600" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              {cashierLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : cashierSales.length === 0 ? (
                <EmptyState icon={Users} title="Belum ada data kasir" description="Tidak ada aktivitas transaksi kasir." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Nama Kasir</th>
                        <th className="py-3 px-4">Transaksi Sukses</th>
                        <th className="py-3 px-4">Jumlah Void</th>
                        <th className="py-3 px-4 text-right">Total Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {cashierSales.map((c) => (
                        <tr key={c.cashier_id} className="hover:bg-amber-50/20">
                          <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                            {c.cashier_name}
                          </td>
                          <td className="py-3.5 px-4">{c.total_orders} transaksi</td>
                          <td className="py-3.5 px-4">
                            {c.void_count > 0 ? (
                              <span className="font-bold text-red-600">{c.void_count} void</span>
                            ) : (
                              <span className="text-stone-400">0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-600">
                            {formatIDR(c.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Laporan Laba Rugi Sederhana */}
        <TabsContent value="profit">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Laporan Laba Rugi Sederhana</CardTitle>
                <CardDescription>
                  Omzet − Diskon − HPP Bahan = Laba Kotor; − Biaya Operasional = Laba Bersih
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  exportToPDF(
                    "Laporan Laba Rugi",
                    [["Komponen", "Nominal"]],
                    [
                      ["Penjualan Kotor (Gross Sales)", formatIDR(profitLoss?.gross_sales || 0)],
                      ["Potongan Diskon / Promo", `-${formatIDR(profitLoss?.discounts || 0)}`],
                      ["Penjualan Bersih (Net Sales)", formatIDR(profitLoss?.net_sales || 0)],
                      ["Harga Pokok Penjualan (HPP)", `-${formatIDR(profitLoss?.cogs || 0)}`],
                      ["Laba Kotor (Gross Profit)", formatIDR(profitLoss?.gross_profit || 0)],
                      ["Beban Pengeluaran Operasional", `-${formatIDR(profitLoss?.expenses || 0)}`],
                      ["LABA BERSIH (NET PROFIT)", formatIDR(profitLoss?.net_profit || 0)],
                    ],
                    "laporan-laba-rugi"
                  )
                }
                className="gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5 text-red-600" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              {plLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !profitLoss ? (
                <EmptyState icon={Coins} title="Belum ada data" description="Data laba rugi belum dapat dikalkulasi." />
              ) : (
                <div className="max-w-2xl mx-auto space-y-4 py-2">
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-600 dark:text-stone-400">Penjualan Kotor (Gross Sales)</span>
                      <span className="font-bold">{formatIDR(profitLoss.gross_sales)}</span>
                    </div>
                    {profitLoss.discounts > 0 && (
                      <div className="flex justify-between py-1 text-red-600">
                        <span>Diskon / Promo Penjualan</span>
                        <span>-{formatIDR(profitLoss.discounts)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-t border-stone-200 dark:border-stone-700 font-bold">
                      <span>Penjualan Bersih (Net Sales)</span>
                      <span>{formatIDR(profitLoss.net_sales)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-stone-600 dark:text-stone-400">
                      <span>Harga Pokok Penjualan (HPP Bahan Baku)</span>
                      <span>-{formatIDR(profitLoss.cogs)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-stone-200 dark:border-stone-700 font-black text-emerald-600 text-base">
                      <span>Laba Kotor (Gross Profit)</span>
                      <span>{formatIDR(profitLoss.gross_profit)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-stone-600 dark:text-stone-400">
                      <span>Pengeluaran Operasional (Gas, Kemasan, Gaji, dll)</span>
                      <span>-{formatIDR(profitLoss.expenses)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-amber-500 font-black text-lg text-amber-950 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl mt-2">
                      <span>LABA BERSIH (NET PROFIT)</span>
                      <span>{formatIDR(profitLoss.net_profit)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Laporan Kas / Shift */}
        <TabsContent value="shifts">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Laporan Rekap Shift Kasir</CardTitle>
                <CardDescription>Akuntabilitas fisik uang kas laci saat pergantian jam kerja</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {shiftLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : shifts.length === 0 ? (
                <EmptyState icon={Clock} title="Belum ada riwayat shift" description="Buka shift kasir terlebih dahulu." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Kasir</th>
                        <th className="py-3 px-4">Waktu Buka</th>
                        <th className="py-3 px-4">Modal Awal</th>
                        <th className="py-3 px-4">Kas Fisik</th>
                        <th className="py-3 px-4">Selisih</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {shifts.map((s) => (
                        <tr key={s.id} className="hover:bg-amber-50/20">
                          <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(s as any).cashier?.full_name}
                          </td>
                          <td className="py-3.5 px-4 text-xs">{formatDate(s.opened_at, "dd/MM/yy HH:mm")}</td>
                          <td className="py-3.5 px-4">{formatIDR(s.opening_cash)}</td>
                          <td className="py-3.5 px-4">{s.actual_cash !== null ? formatIDR(s.actual_cash) : "-"}</td>
                          <td className="py-3.5 px-4 font-bold">
                            {s.cash_difference !== null ? (
                              s.cash_difference === 0 ? (
                                <span className="text-emerald-600">Rp 0</span>
                              ) : s.cash_difference < 0 ? (
                                <span className="text-red-600">{formatIDR(s.cash_difference)}</span>
                              ) : (
                                <span className="text-emerald-600">+{formatIDR(s.cash_difference)}</span>
                              )
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs capitalize font-semibold">{s.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. Laporan Jam Sibuk */}
        <TabsContent value="hourly">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Analisis Pola Jam Sibuk (Hourly Traffic)</CardTitle>
                <CardDescription>Pola kepadatan transaksi per jam operasional</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {hourLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : salesByHour.length === 0 ? (
                <EmptyState icon={BarChart3} title="Belum ada transaksi" description="Tidak ada aktivitas transaksi pada jam operasional." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Rentang Jam</th>
                        <th className="py-3 px-4">Jumlah Transaksi</th>
                        <th className="py-3 px-4 text-right">Total Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {salesByHour.map((h) => (
                        <tr key={h.sale_hour} className="hover:bg-amber-50/20">
                          <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                            {String(h.sale_hour).padStart(2, "0")}:00 - {String(h.sale_hour).padStart(2, "0")}:59 WIB
                          </td>
                          <td className="py-3.5 px-4">{h.order_count} transaksi</td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-600">
                            {formatIDR(h.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
