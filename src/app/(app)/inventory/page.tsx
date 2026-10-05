"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTrackedProductsAction,
  getIngredientsAction,
  getStockMovementsAction,
  createIngredientAction,
  recordStockMovementAction,
  type StockMovementPayload,
} from "@/actions/inventory.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Boxes,
  Package,
  Plus,
  ArrowDownLeft,
  AlertTriangle,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { StockMovementType } from "@/types/database.types";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");

  // Dialog States
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [newIngredientDialogOpen, setNewIngredientDialogOpen] = useState(false);

  // Movement Form
  const [movementForm, setMovementForm] = useState<{
    targetType: "product" | "ingredient";
    targetId: string;
    targetName: string;
    type: StockMovementType;
    qtyChange: number;
    unitCost: number;
    note: string;
  }>({
    targetType: "product",
    targetId: "",
    targetName: "",
    type: "purchase",
    qtyChange: 10,
    unitCost: 0,
    note: "",
  });

  // Ingredient Form
  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    unit: "pcs",
    stock_qty: 0,
    min_stock: 5,
    cost_per_unit: 0,
  });

  // Queries
  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ["inventory_products"],
    queryFn: () => getTrackedProductsAction(),
  });

  const { data: ingredients = [], isLoading: ingLoading } = useQuery({
    queryKey: ["inventory_ingredients"],
    queryFn: () => getIngredientsAction(),
  });

  const { data: movements = [], isLoading: moveLoading } = useQuery({
    queryKey: ["inventory_movements"],
    queryFn: () => getStockMovementsAction(),
  });

  // Mutations
  const movementMutation = useMutation({
    mutationFn: (payload: StockMovementPayload) => recordStockMovementAction(payload),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal mencatat mutasi");
        return;
      }
      toast.success("Mutasi stok berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["inventory_products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_movements"] });
      setMovementDialogOpen(false);
    },
  });

  const ingredientMutation = useMutation({
    mutationFn: (data: typeof ingredientForm) => createIngredientAction(data),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal menambahkan bahan baku");
        return;
      }
      toast.success("Bahan baku berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["inventory_ingredients"] });
      setNewIngredientDialogOpen(false);
      setIngredientForm({ name: "", unit: "pcs", stock_qty: 0, min_stock: 5, cost_per_unit: 0 });
    },
  });

  const openMovementDialog = (
    targetType: "product" | "ingredient",
    targetId: string,
    targetName: string,
    type: StockMovementType = "purchase"
  ) => {
    setMovementForm({
      targetType,
      targetId,
      targetName,
      type,
      qtyChange: type === "waste" ? -1 : 10,
      unitCost: 0,
      note: "",
    });
    setMovementDialogOpen(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.targetId) return;

    let finalQty = Math.abs(movementForm.qtyChange);
    if (movementForm.type === "waste") {
      finalQty = -finalQty;
    }

    movementMutation.mutate({
      targetType: movementForm.targetType,
      targetId: movementForm.targetId,
      type: movementForm.type,
      qtyChange: finalQty,
      unitCost: movementForm.unitCost || undefined,
      note: movementForm.note.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <Boxes className="h-8 w-8 text-amber-500" />
            Inventori & Stok Bahan Baku
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Pantau stok produk jadi, bahan baku resep, catat pembelian barang masuk, dan opname stok
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNewIngredientDialogOpen(true)}
            className="gap-2 font-bold shadow-md shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            Tambah Bahan Baku
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl">
          <TabsTrigger value="products" className="rounded-xl text-xs gap-1.5 font-bold">
            <Package className="h-3.5 w-3.5" />
            Stok Produk ({products.filter((p) => p.track_stock).length})
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="rounded-xl text-xs gap-1.5 font-bold">
            <Boxes className="h-3.5 w-3.5" />
            Bahan Baku Resep ({ingredients.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="rounded-xl text-xs gap-1.5 font-bold">
            <History className="h-3.5 w-3.5" />
            Riwayat Mutasi
          </TabsTrigger>
        </TabsList>

        {/* 1. Tab Stok Produk */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Stok Produk Jadi</CardTitle>
              <CardDescription>
                Hanya produk dengan opsi &quot;Lacak Stok&quot; yang dikurangi otomatis saat kasir memproses pesanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prodLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <EmptyState icon={Package} title="Belum ada produk" description="Tambahkan produk di menu Master Data." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Nama Menu</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Lacak Stok</th>
                        <th className="py-3 px-4">Sisa Stok</th>
                        <th className="py-3 px-4">Ambang Batas</th>
                        <th className="py-3 px-4 text-right">Aksi Mutasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {products.map((p) => {
                        const isLow = Boolean(
                          p.track_stock &&
                            Number(p.stock_qty || 0) <= Number(p.low_stock_threshold || 0)
                        );
                        return (
                          <tr key={p.id} className="hover:bg-amber-50/20">
                            <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                              {p.name}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-stone-500">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(p as any).category?.name || "-"}
                            </td>
                            <td className="py-3.5 px-4">
                              {p.track_stock ? (
                                <Badge variant="success">Aktif</Badge>
                              ) : (
                                <Badge variant="outline" className="text-stone-400">Tidak Dilacak</Badge>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold">
                              {p.track_stock ? (
                                <span className={isLow ? "text-red-600 flex items-center gap-1" : "text-stone-800 dark:text-stone-200"}>
                                  {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                                  {p.stock_qty ?? 0} porsi
                                </span>
                              ) : (
                                <span className="text-stone-400">Selalu Ada</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-stone-500">
                              {p.track_stock ? `${p.low_stock_threshold ?? 0} porsi` : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {p.track_stock && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openMovementDialog("product", p.id, p.name, "purchase")}
                                    className="h-8 gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                  >
                                    <ArrowDownLeft className="h-3.5 w-3.5" />
                                    Masuk
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openMovementDialog("product", p.id, p.name, "waste")}
                                    className="h-8 gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Rusak
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Tab Bahan Baku */}
        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Bahan Baku (Ingredients)</CardTitle>
              <CardDescription>
                Bahan dasar racikan dimsum dan minuman keju (kulit pangsit, serbuk keju, susu, cup, dsb.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ingLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : ingredients.length === 0 ? (
                <EmptyState
                  icon={Boxes}
                  title="Belum ada bahan baku"
                  description="Tambahkan bahan baku resep untuk memonitor persediaan bahan dapur."
                  actionLabel="Tambah Bahan Baku Sekarang"
                  onAction={() => setNewIngredientDialogOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Nama Bahan</th>
                        <th className="py-3 px-4">Satuan</th>
                        <th className="py-3 px-4">Stok Sekarang</th>
                        <th className="py-3 px-4">Batas Minimum</th>
                        <th className="py-3 px-4">Biaya / Satuan</th>
                        <th className="py-3 px-4 text-right">Aksi Mutasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {ingredients.map((ing) => {
                        const isLow = Number(ing.stock_qty || 0) <= Number(ing.min_stock || 0);
                        return (
                          <tr key={ing.id} className="hover:bg-amber-50/20">
                            <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                              {ing.name}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-stone-500">
                              {ing.unit}
                            </td>
                            <td className="py-3.5 px-4 font-bold">
                              <span className={isLow ? "text-red-600 flex items-center gap-1" : "text-stone-800 dark:text-stone-200"}>
                                {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                                {ing.stock_qty} {ing.unit}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-stone-500">
                              {ing.min_stock} {ing.unit}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-medium">
                              {formatIDR(ing.cost_per_unit)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openMovementDialog("ingredient", ing.id, ing.name, "purchase")}
                                  className="h-8 gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                >
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                  Masuk
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openMovementDialog("ingredient", ing.id, ing.name, "waste")}
                                  className="h-8 gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Basi/Rusak
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Tab Riwayat Mutasi */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pergerakan Stok</CardTitle>
              <CardDescription>Catatan audit keluar masuk barang dan pemotongan otomatis oleh kasir</CardDescription>
            </CardHeader>
            <CardContent>
              {moveLoading ? (
                <div className="flex items-center justify-center p-12 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : movements.length === 0 ? (
                <EmptyState icon={History} title="Belum ada riwayat mutasi" description="Pergerakan stok akan dicatat di sini." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Waktu</th>
                        <th className="py-3 px-4">Barang</th>
                        <th className="py-3 px-4">Tipe Mutasi</th>
                        <th className="py-3 px-4">Perubahan Qty</th>
                        <th className="py-3 px-4">Sisa Saldo</th>
                        <th className="py-3 px-4">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-amber-50/20 text-xs">
                          <td className="py-3 px-4 text-stone-500">
                            {formatDate(m.created_at, "dd/MM/yy HH:mm")}
                          </td>
                          <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(m as any).product?.name || (m as any).ingredient?.name}
                          </td>
                          <td className="py-3 px-4">
                            {m.type === "purchase" && <Badge variant="success">Pembelian</Badge>}
                            {m.type === "sale" && <Badge variant="outline">Penjualan</Badge>}
                            {m.type === "sale_void" && <Badge variant="destructive">Void Rollback</Badge>}
                            {m.type === "waste" && <Badge variant="destructive">Rusak/Basi</Badge>}
                            {m.type === "adjustment" && <Badge variant="secondary">Opname</Badge>}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            {Number(m.qty_change) > 0 ? (
                              <span className="text-emerald-600">+{m.qty_change}</span>
                            ) : (
                              <span className="text-red-600">{m.qty_change}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold">{m.balance_after}</td>
                          <td className="py-3 px-4 text-stone-500 max-w-xs truncate">{m.note || "-"}</td>
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

      {/* Modal Dialog Form Mutasi Stok */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleMovementSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-amber-500" />
                Catat Mutasi: {movementForm.targetName}
              </DialogTitle>
              <DialogDescription>
                Perbarui kuantitas persediaan barang masuk (beli) atau barang rusak/basi
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="move-type">Jenis Mutasi</Label>
                <select
                  id="move-type"
                  value={movementForm.type}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, type: e.target.value as StockMovementType })
                  }
                  className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-stone-800 dark:bg-stone-900 font-semibold"
                >
                  <option value="purchase">Barang Masuk / Pembelian (+)</option>
                  <option value="waste">Barang Rusak / Basi / Kadaluwarsa (-)</option>
                  <option value="adjustment">Penyesuaian Stok Opname</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qty-change">Jumlah Kuantitas</Label>
                <Input
                  id="qty-change"
                  type="number"
                  step="any"
                  min="0.1"
                  value={Math.abs(movementForm.qtyChange)}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, qtyChange: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              {movementForm.type === "purchase" && (
                <div className="space-y-1.5">
                  <Label htmlFor="unit-cost">Harga Beli Satuan (Opsional)</Label>
                  <CurrencyInput
                    id="unit-cost"
                    value={movementForm.unitCost}
                    onChange={(val) => setMovementForm({ ...movementForm, unitCost: val })}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="move-note">Catatan Mutasi</Label>
                <Input
                  id="move-note"
                  placeholder="Contoh: Beli dari Pasar Pagi, bungkus sobek, dsb."
                  value={movementForm.note}
                  onChange={(e) => setMovementForm({ ...movementForm, note: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMovementDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={movementMutation.isPending} className="font-bold">
                {movementMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan Mutasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah Bahan Baku Baru */}
      <Dialog open={newIngredientDialogOpen} onOpenChange={setNewIngredientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ingredientMutation.mutate(ingredientForm);
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-500" />
                Tambah Bahan Baku Baru
              </DialogTitle>
              <DialogDescription>
                Bahan baku untuk racikan minuman cheese atau isian dimsum
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ing-name">Nama Bahan Baku</Label>
                <Input
                  id="ing-name"
                  placeholder="Contoh: Cream Cheese Powder, Kulit Dimsum, Cup 16oz"
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ing-unit">Satuan Unit</Label>
                  <Input
                    id="ing-unit"
                    placeholder="gram, ml, pcs, lembar"
                    value={ingredientForm.unit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-current">Stok Awal</Label>
                  <Input
                    id="ing-current"
                    type="number"
                    value={ingredientForm.stock_qty}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        stock_qty: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ing-min">Batas Minimum</Label>
                  <Input
                    id="ing-min"
                    type="number"
                    value={ingredientForm.min_stock}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        min_stock: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-cost">Biaya / Satuan (HPP)</Label>
                  <CurrencyInput
                    id="ing-cost"
                    value={ingredientForm.cost_per_unit}
                    onChange={(val) => setIngredientForm({ ...ingredientForm, cost_per_unit: val })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewIngredientDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={ingredientMutation.isPending} className="font-bold">
                {ingredientMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Tambah Bahan Baku
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
