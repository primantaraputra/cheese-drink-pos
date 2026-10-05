"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDiscountsAction,
  createDiscountAction,
  updateDiscountAction,
  deleteDiscountAction,
  toggleDiscountStatusAction,
} from "@/actions/discount.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CurrencyInput } from "@/components/shared/currency-input";
import { formatIDR } from "@/lib/utils/currency";
import { Plus, Tag, Edit2, Trash2, Loader2, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";
import type { DiscountFormData } from "@/lib/validators/discount.schema";

type Discount = Database["public"]["Tables"]["discounts"]["Row"];

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<DiscountFormData>({
    name: "",
    code: "",
    type: "percent",
    value: 10,
    max_discount: 15000,
    min_purchase: 25000,
    start_at: null,
    end_at: null,
    is_active: true,
  });

  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: () => getDiscountsAction(false),
  });

  const createMutation = useMutation({
    mutationFn: (data: DiscountFormData) => createDiscountAction(data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal membuat diskon");
      toast.success("Diskon berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DiscountFormData> }) =>
      updateDiscountAction(id, data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal memperbarui diskon");
      toast.success("Diskon berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setDialogOpen(false);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleDiscountStatusAction(id, is_active),
    onSuccess: () => {
      toast.success("Status diskon diperbarui");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDiscountAction(id),
    onSuccess: () => {
      toast.success("Diskon berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setDeleteId(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setFormData({
      name: "",
      code: "",
      type: "percent",
      value: 10,
      max_discount: null,
      min_purchase: 0,
      start_at: null,
      end_at: null,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (d: Discount) => {
    setEditingDiscount(d);
    setFormData({
      name: d.name,
      code: d.code || "",
      type: d.type,
      value: d.value,
      max_discount: d.max_discount,
      min_purchase: d.min_purchase,
      start_at: d.start_at ? d.start_at.substring(0, 10) : null,
      end_at: d.end_at ? d.end_at.substring(0, 10) : null,
      is_active: d.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Nama promo wajib diisi");

    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <Tag className="h-8 w-8 text-amber-500" />
            Diskon & Voucher Promo
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Kelola diskon persentase dan nominal potongan harga untuk transaksi kasir
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-md shadow-amber-500/20">
          <Plus className="h-4 w-4" />
          Tambah Diskon
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Tag}
                title="Belum ada promo aktif"
                description="Buat program promo seperti diskon opening atau voucher hemat untuk menarik pelanggan."
                actionLabel="Buat Promo Pertama"
                onAction={handleOpenCreate}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold bg-stone-50/50 dark:bg-stone-800/40">
                    <th className="py-3.5 px-4">Nama Diskon</th>
                    <th className="py-3.5 px-4">Kode Kupon</th>
                    <th className="py-3.5 px-4">Nilai Potongan</th>
                    <th className="py-3.5 px-4">Ketentuan Minimal</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {discounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40">
                      <td className="py-4 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {discount.name}
                      </td>
                      <td className="py-4 px-4">
                        {discount.code ? (
                          <Badge variant="outline" className="font-mono text-xs uppercase border-amber-300">
                            {discount.code}
                          </Badge>
                        ) : (
                          <span className="text-stone-400 text-xs">Otomatis / Manual</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-600 dark:text-amber-400">
                        {discount.type === "percent" ? (
                          <span className="flex items-center gap-1">
                            <Percent className="h-3.5 w-3.5" />
                            {discount.value}% {discount.max_discount && `(Maks ${formatIDR(discount.max_discount)})`}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatIDR(discount.value)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-500">
                        {discount.min_purchase > 0
                          ? `Min. Belanja ${formatIDR(discount.min_purchase)}`
                          : "Tanpa minimum"}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: discount.id,
                              is_active: !discount.is_active,
                            })
                          }
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            discount.is_active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-stone-100 text-stone-500 dark:bg-stone-800"
                          }`}
                        >
                          {discount.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(discount)}
                            className="h-8 w-8 text-stone-500 hover:text-amber-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(discount.id)}
                            className="h-8 w-8 text-stone-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Modal Form Diskon */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? "Ubah Diskon & Promo" : "Tambah Diskon Baru"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="disc-name">Nama Promo</Label>
                <Input
                  id="disc-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Diskon Grand Opening 15%"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="disc-code">Kode Kupon (Opsional)</Label>
                  <Input
                    id="disc-code"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Contoh: OPENING15"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="disc-type">Tipe Potongan</Label>
                  <select
                    id="disc-type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "percent" | "fixed",
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Besaran Potongan {formData.type === "percent" ? "(%)" : "(Rp)"}</Label>
                  {formData.type === "percent" ? (
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  ) : (
                    <CurrencyInput
                      value={formData.value}
                      onChange={(val) => setFormData({ ...formData, value: val })}
                    />
                  )}
                </div>

                {formData.type === "percent" ? (
                  <div className="space-y-1.5">
                    <Label>Batas Maks Diskon (Rp)</Label>
                    <CurrencyInput
                      value={formData.max_discount ?? 0}
                      onChange={(val) =>
                        setFormData({ ...formData, max_discount: val > 0 ? val : null })
                      }
                      placeholder="Tanpa batas"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Min. Pembelian (Rp)</Label>
                    <CurrencyInput
                      value={formData.min_purchase}
                      onChange={(val) => setFormData({ ...formData, min_purchase: val })}
                    />
                  </div>
                )}
              </div>

              {formData.type === "percent" && (
                <div className="space-y-1.5">
                  <Label>Min. Pembelian (Rp)</Label>
                  <CurrencyInput
                    value={formData.min_purchase}
                    onChange={(val) => setFormData({ ...formData, min_purchase: val })}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="font-bold"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Simpan Diskon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Promo Diskon?"
        description="Diskon yang dihapus tidak akan dapat dipilih lagi di layar kasir."
        confirmLabel="Ya, Hapus"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
