"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShiftsAction,
  getShiftDetailsAction,
  closeShiftAction,
} from "@/actions/shift.actions";
import { getActiveShiftAction, openShiftAction } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyInput } from "@/components/shared/currency-input";
import { formatIDR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Clock,
  Plus,
  CheckCircle,
  AlertTriangle,
  Printer,
  Loader2,
  DollarSign,
  TrendingDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export default function ShiftsPage() {
  const queryClient = useQueryClient();

  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState(100000);

  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [shiftToCloseId, setShiftToCloseId] = useState<string | null>(null);
  const [actualCashInput, setActualCashInput] = useState(0);
  const [closeNote, setCloseNote] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Queries
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts_list"],
    queryFn: () => getShiftsAction(),
  });

  const { data: activeShift } = useQuery({
    queryKey: ["active_shift"],
    queryFn: () => getActiveShiftAction(),
  });

  const { data: shiftDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["shift_detail", selectedShiftId || shiftToCloseId],
    queryFn: () =>
      selectedShiftId || shiftToCloseId
        ? getShiftDetailsAction((selectedShiftId || shiftToCloseId)!)
        : null,
    enabled: Boolean(selectedShiftId || shiftToCloseId),
  });

  // Mutations
  const openMutation = useMutation({
    mutationFn: (cash: number) => openShiftAction(cash),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal membuka shift");
        return;
      }
      toast.success("Shift berhasil dibuka!");
      queryClient.invalidateQueries({ queryKey: ["shifts_list"] });
      queryClient.invalidateQueries({ queryKey: ["active_shift"] });
      setOpenShiftModal(false);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (payload: { shiftId: string; actualCash: number; note?: string }) =>
      closeShiftAction(payload),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal menutup shift");
        return;
      }
      toast.success("Shift kasir berhasil ditutup!");
      queryClient.invalidateQueries({ queryKey: ["shifts_list"] });
      queryClient.invalidateQueries({ queryKey: ["active_shift"] });
      setCloseShiftModal(false);
      setShiftToCloseId(null);
    },
  });

  // Kalkulasi estimasi kas untuk dialog tutup shift
  const openingCash = Number(shiftDetail?.shift.opening_cash || 0);
  const cashPayments = (shiftDetail?.payments || [])
    .filter((p) => p.method === "cash")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const drawerExpenses = (shiftDetail?.expenses || [])
    .filter((e) => e.paid_from_drawer)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const expectedCash = openingCash + cashPayments - drawerExpenses;
  const cashDifference = actualCashInput - expectedCash;

  const handlePrintRecap = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-500" />
            Manajemen Shift Kasir
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Pantau arus kas laci kasir, pembukaan modal awal, dan rekonsiliasi saat pergantian shift
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!activeShift ? (
            <Button
              onClick={() => {
                setOpeningCashInput(100000);
                setOpenShiftModal(true);
              }}
              className="gap-2 font-bold shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              Buka Shift Baru
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                setShiftToCloseId(activeShift.id);
                setActualCashInput(0);
                setCloseShiftModal(true);
              }}
              className="gap-2 font-bold"
            >
              <CheckCircle className="h-4 w-4" />
              Tutup Shift Aktif
            </Button>
          )}
        </div>
      </div>

      {/* Banner Shift Aktif */}
      {activeShift && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success">Shift Anda Sedang Aktif</Badge>
              <span className="text-xs text-stone-500">
                Dibuka sejak {formatDate(activeShift.opened_at, "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <p className="text-sm font-bold text-amber-950 dark:text-amber-300">
              Modal Awal: {formatIDR(activeShift.opening_cash)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedShiftId(activeShift.id);
              setDetailModalOpen(true);
            }}
            className="gap-2 text-xs font-bold"
          >
            <Eye className="h-4 w-4" />
            Lihat Arus Kas Shift
          </Button>
        </div>
      )}

      {/* Riwayat Shift Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Shift Kasir</CardTitle>
          <CardDescription>
            Rekap seluruh shift yang telah dibuka dan ditutup oleh kasir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : shifts.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum ada data shift"
              description="Buka shift kasir pertama Anda untuk mulai bertransaksi."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                    <th className="py-3 px-3">Kasir</th>
                    <th className="py-3 px-3">Waktu Buka</th>
                    <th className="py-3 px-3">Waktu Tutup</th>
                    <th className="py-3 px-3">Modal Awal</th>
                    <th className="py-3 px-3">Kas Aktual</th>
                    <th className="py-3 px-3">Selisih Kas</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {shifts.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedShiftId(s.id);
                        setDetailModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(s as any).cashier?.full_name || "-"}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-600">
                        {formatDate(s.opened_at, "dd/MM/yy HH:mm")}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-600">
                        {s.closed_at ? formatDate(s.closed_at, "dd/MM/yy HH:mm") : "-"}
                      </td>
                      <td className="py-3 px-3 text-xs">{formatIDR(s.opening_cash)}</td>
                      <td className="py-3 px-3 text-xs">
                        {s.actual_cash !== null ? formatIDR(s.actual_cash) : "-"}
                      </td>
                      <td className="py-3 px-3 text-xs font-bold">
                        {s.cash_difference !== null ? (
                          s.cash_difference === 0 ? (
                            <span className="text-emerald-600">Rp 0 (Sesuai)</span>
                          ) : s.cash_difference < 0 ? (
                            <span className="text-red-600">{formatIDR(s.cash_difference)}</span>
                          ) : (
                            <span className="text-emerald-600">+{formatIDR(s.cash_difference)}</span>
                          )
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {s.status === "open" ? (
                          <Badge variant="success">Sedang Buka</Badge>
                        ) : (
                          <Badge variant="outline" className="text-stone-500">Ditutup</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-600 hover:text-amber-600"
                            onClick={() => {
                              setSelectedShiftId(s.id);
                              setDetailModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {s.status === "open" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setShiftToCloseId(s.id);
                                setActualCashInput(0);
                                setCloseShiftModal(true);
                              }}
                            >
                              Tutup
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Buka Shift */}
      <Dialog open={openShiftModal} onOpenChange={setOpenShiftModal}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openMutation.mutate(openingCashInput);
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Buka Shift Kasir Baru
              </DialogTitle>
              <DialogDescription>
                Masukkan modal kas awal di laci (drawer) sebelum mulai melayani pelanggan.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="opening-cash">Modal Kas Awal (Rp)</Label>
                <CurrencyInput
                  id="opening-cash"
                  value={openingCashInput}
                  onChange={setOpeningCashInput}
                  autoFocus
                />
                <p className="text-[11px] text-stone-500">
                  Uang pecahan kembalian yang disiapkan di laci kasir.
                </p>
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-2">
                {[50000, 100000, 150000, 200000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setOpeningCashInput(preset)}
                    className="flex-1 py-1.5 rounded-lg border border-stone-200 text-xs font-bold hover:bg-amber-50 hover:border-amber-400 transition-colors"
                  >
                    {formatIDR(preset)}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenShiftModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={openMutation.isPending} className="font-bold">
                {openMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Buka Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Tutup Shift */}
      <Dialog open={closeShiftModal} onOpenChange={setCloseShiftModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!shiftToCloseId) return;
              closeMutation.mutate({
                shiftId: shiftToCloseId,
                actualCash: actualCashInput,
                note: closeNote.trim() || undefined,
              });
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <CheckCircle className="h-5 w-5 text-amber-500" />
                Rekap & Tutup Shift Kasir
              </DialogTitle>
              <DialogDescription>
                Hitung seluruh uang fisik di laci kasir dan masukkan nominal aktual di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 text-xs">
              {/* Rincian Kas Sistem */}
              <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-xl space-y-2 border border-stone-200 dark:border-stone-800">
                <div className="flex justify-between">
                  <span className="text-stone-500 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-stone-400" />
                    Modal Awal Laci
                  </span>
                  <span className="font-semibold">{formatIDR(openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 flex items-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-500 rotate-180" />
                    Total Penjualan Tunai Masuk
                  </span>
                  <span className="font-semibold text-emerald-600">+{formatIDR(cashPayments)}</span>
                </div>
                {drawerExpenses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-500 flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      Pengeluaran Kas Laci
                    </span>
                    <span className="font-semibold text-red-600">-{formatIDR(drawerExpenses)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-stone-200 dark:border-stone-700 pt-2 text-stone-900 dark:text-stone-100">
                  <span>Kas Diharapkan Sistem</span>
                  <span className="text-amber-600">{formatIDR(expectedCash)}</span>
                </div>
              </div>

              {/* Input Kas Fisik Aktual */}
              <div className="space-y-1.5">
                <Label htmlFor="actual-cash" className="font-bold text-sm">
                  Uang Tunai Fisik Aktual di Laci (Rp)
                </Label>
                <CurrencyInput
                  id="actual-cash"
                  value={actualCashInput}
                  onChange={setActualCashInput}
                  autoFocus
                />
              </div>

              {/* Indikator Selisih Kas */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  cashDifference === 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    : cashDifference < 0
                    ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
                    : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="font-bold">
                    {cashDifference === 0
                      ? "Kas Sempurna (Pas)"
                      : cashDifference < 0
                      ? "Kas Kurang (Minus)"
                      : "Kas Lebih (Surplus)"}
                  </span>
                </div>
                <span className="font-black text-sm">{formatIDR(cashDifference)}</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="close-note">Catatan Tutup Shift (Opsional)</Label>
                <Input
                  id="close-note"
                  placeholder="Misal: Selisih Rp 2.000 karena pembulatan atau uang kembalian tidak diambil"
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setCloseShiftModal(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={closeMutation.isPending}
                className="font-bold"
              >
                {closeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Konfirmasi Tutup Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detail & Cetak Rekap Shift */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {detailLoading || !shiftDetail ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Rekap Shift Kasir
                </DialogTitle>
              </DialogHeader>

              {/* Thermal Slip Preview for Shift */}
              <div className="bg-white text-black p-4 font-mono text-xs border border-stone-200 rounded-xl space-y-2">
                <div className="text-center border-b border-dashed border-black pb-2">
                  <h3 className="font-bold text-sm uppercase">REKAP SHIFT KASIR</h3>
                  <p className="text-[10px]">CHEESE DRINK</p>
                </div>

                <div className="text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Kasir</span>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <span className="font-bold">{(shiftDetail.shift as any).cashier?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu Buka</span>
                    <span>{formatDate(shiftDetail.shift.opened_at, "dd/MM/yy HH:mm")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu Tutup</span>
                    <span>
                      {shiftDetail.shift.closed_at
                        ? formatDate(shiftDetail.shift.closed_at, "dd/MM/yy HH:mm")
                        : "Masih Buka"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Modal Awal</span>
                    <span>{formatIDR(shiftDetail.shift.opening_cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penjualan Tunai</span>
                    <span>{formatIDR(cashPayments)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Pengeluaran Laci</span>
                    <span>-{formatIDR(drawerExpenses)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-black pt-1">
                    <span>Kas Diharapkan</span>
                    <span>{formatIDR(expectedCash)}</span>
                  </div>
                  {shiftDetail.shift.actual_cash !== null && (
                    <div className="flex justify-between">
                      <span>Kas Fisik Aktual</span>
                      <span>{formatIDR(shiftDetail.shift.actual_cash)}</span>
                    </div>
                  )}
                  {shiftDetail.shift.cash_difference !== null && (
                    <div className="flex justify-between font-bold">
                      <span>Selisih</span>
                      <span>{formatIDR(shiftDetail.shift.cash_difference)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-black pt-2 text-center text-[9px] text-stone-500">
                  Total Transaksi Selesai: {shiftDetail.orders.filter((o) => o.status === "completed").length}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={handlePrintRecap} className="gap-2 font-bold w-full">
                  <Printer className="h-4 w-4" />
                  Cetak Slip Rekap Shift
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
