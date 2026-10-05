"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExpensesAction,
  createExpenseAction,
  deleteExpenseAction,
  type CreateExpensePayload,
} from "@/actions/expense.actions";
import { getActiveShiftAction } from "@/actions/order.actions";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CurrencyInput } from "@/components/shared/currency-input";
import { formatIDR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Wallet,
  Plus,
  Trash2,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Bahan Baku Tambahan",
  "Gas LPG",
  "Listrik & Air",
  "Kemasan & Plastik Cup",
  "Gaji & Uang Makan",
  "Kebersihan & Perlengkapan",
  "Lain-lain",
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<CreateExpensePayload>({
    category: EXPENSE_CATEGORIES[0],
    amount: 15000,
    description: "",
    paid_from_drawer: true,
  });

  // Queries
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses_list", categoryFilter],
    queryFn: () => getExpensesAction({ category: categoryFilter }),
  });

  const { data: activeShift } = useQuery({
    queryKey: ["active_shift"],
    queryFn: () => getActiveShiftAction(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpenseAction(payload),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal mencatat pengeluaran");
        return;
      }
      toast.success("Pengeluaran operasional berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["expenses_list"] });
      queryClient.invalidateQueries({ queryKey: ["active_shift"] });
      queryClient.invalidateQueries({ queryKey: ["shifts_list"] });
      setCreateDialogOpen(false);
      setForm({
        category: EXPENSE_CATEGORIES[0],
        amount: 15000,
        description: "",
        paid_from_drawer: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpenseAction(id),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal menghapus pengeluaran");
        return;
      }
      toast.success("Pengeluaran berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["expenses_list"] });
      queryClient.invalidateQueries({ queryKey: ["shifts_list"] });
      setDeleteId(null);
    },
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const drawerExpenseAmount = expenses
    .filter((e) => e.paid_from_drawer)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-amber-500" />
            Pengeluaran Operasional
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Catat pengeluaran harian kedai, pembelian gas, plastik, dan pemotongan uang kas laci
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 font-bold shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Catat Pengeluaran
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-stone-500">
                Total Seluruh Pengeluaran
              </span>
              <div className="text-2xl font-black text-amber-950 dark:text-amber-400">
                {formatIDR(totalExpenseAmount)}
              </div>
              <p className="text-[11px] text-stone-500">{expenses.length} transaksi tercatat</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-stone-500">
                Diambil Dari Kas Laci Kasir
              </span>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {formatIDR(drawerExpenseAmount)}
              </div>
              <p className="text-[11px] text-stone-500">
                Memotong saldo kas saat kasir tutup shift
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Riwayat Pengeluaran</CardTitle>
            <CardDescription>Daftar rincian biaya operasional kedai Cheese Drink</CardDescription>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold dark:border-stone-800 dark:bg-stone-900"
            >
              <option value="all">Semua Kategori</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Belum ada catatan pengeluaran"
              description="Catat pengeluaran pertama Anda jika ada biaya belanja gas, es batu, atau perlengkapan."
              actionLabel="Catat Pengeluaran Sekarang"
              onAction={() => setCreateDialogOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Kategori Biaya</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4">Sumber Dana</th>
                    <th className="py-3 px-4">Dicatat Oleh</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-amber-50/20">
                      <td className="py-3.5 px-4 text-xs font-semibold text-stone-600">
                        {formatDate(exp.expense_date, "dd/MM/yyyy")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {exp.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-500 max-w-xs truncate">
                        {exp.description || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        {exp.paid_from_drawer ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Kas Laci
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Kas Luar / Owner
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-stone-700 dark:text-stone-300">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(exp as any).creator?.full_name || "Kasir"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-amber-600">
                        {formatIDR(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-400 hover:text-red-600"
                          onClick={() => setDeleteId(exp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog Catat Pengeluaran */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-500" />
                Catat Pengeluaran Baru
              </DialogTitle>
              <DialogDescription>
                Catat biaya operasional kedai dan tentukan apakah uang diambil dari laci kasir
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="exp-cat">Kategori Pengeluaran</Label>
                <select
                  id="exp-cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-stone-800 dark:bg-stone-900 font-semibold"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp-amount">Nominal Pengeluaran (Rp)</Label>
                <CurrencyInput
                  id="exp-amount"
                  value={form.amount}
                  onChange={(val) => setForm({ ...form, amount: val })}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp-desc">Keterangan / Catatan</Label>
                <Input
                  id="exp-desc"
                  placeholder="Contoh: Isi ulang tabung gas 3kg, beli es batu 2 karung"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Toggle Potong Kas Laci */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-stone-800 dark:bg-stone-900/60 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.paid_from_drawer}
                    onChange={(e) => setForm({ ...form, paid_from_drawer: e.target.checked })}
                    className="mt-0.5 rounded text-amber-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      Ambil dari Uang Kas Laci (Drawer)
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Otomatis memotong uang kas shift saat ini sehingga perhitungan kas fisik pada saat tutup shift tetap akurat.
                    </p>
                  </div>
                </label>

                {form.paid_from_drawer && !activeShift && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Peringatan: Belum ada shift kasir aktif. Anda harus membuka shift terlebih dahulu.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || (form.paid_from_drawer && !activeShift)}
                className="font-bold"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan Pengeluaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Catatan Pengeluaran?"
        description="Data pengeluaran ini akan dihapus dari buku kas. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
