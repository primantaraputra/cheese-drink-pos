"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductAvailabilityAction,
  type ProductWithDetails,
} from "@/actions/product.actions";
import { getCurrentUserProfile } from "@/actions/auth.actions";
import { getCategoriesAction } from "@/actions/category.actions";
import { getModifierGroupsAction } from "@/actions/modifier.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Plus,
  UtensilsCrossed,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  ImageIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductFormData } from "@/lib/validators/product.schema";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category_id: "",
    sku: "",
    description: "",
    image_url: "",
    base_price: 15000,
    cost_price: 8000,
    track_stock: false,
    stock_qty: 0,
    low_stock_threshold: 10,
    is_available: true,
    is_active: true,
    is_favorite: false,
    sort_order: 1,
    variants: [],
    modifier_group_ids: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategoriesAction(),
  });

  const { data: modifierGroups = [] } = useQuery({
    queryKey: ["modifier_groups"],
    queryFn: () => getModifierGroupsAction(),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", selectedCategory, searchQuery],
    queryFn: () =>
      getProductsAction({
        categoryId: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery || undefined,
      }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => createProductAction(data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal membuat produk");
      toast.success("Produk berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      updateProductAction(id, data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal memperbarui produk");
      toast.success("Produk berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductAction(id),
    onSuccess: () => {
      toast.success("Produk berhasil diarsipkan!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteId(null);
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      toggleProductAvailabilityAction(id, is_available),
    onSuccess: () => {
      toast.success("Status ketersediaan berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["current_user_profile"],
    queryFn: () => getCurrentUserProfile(),
  });
  const isOwner = userProfile?.role === "owner";

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category_id: categories[0]?.id || "",
      sku: "",
      description: "",
      image_url: "",
      base_price: 15000,
      cost_price: 8000,
      track_stock: false,
      stock_qty: 0,
      low_stock_threshold: 10,
      is_available: true,
      is_active: true,
      is_favorite: false,
      sort_order: products.length + 1,
      variants: [],
      modifier_group_ids: [],
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: ProductWithDetails) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id,
      sku: p.sku || "",
      description: p.description || "",
      image_url: p.image_url || "",
      base_price: p.base_price,
      cost_price: p.cost_price,
      track_stock: p.track_stock,
      stock_qty: p.stock_qty,
      low_stock_threshold: p.low_stock_threshold,
      is_available: p.is_available,
      is_active: p.is_active,
      is_favorite: p.is_favorite,
      sort_order: p.sort_order,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        cost_price: v.cost_price,
        sku: v.sku,
        is_default: v.is_default,
      })),
      modifier_group_ids: p.product_modifier_groups.map((pmg) => pmg.group.id),
    });
    setDialogOpen(true);
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          name: "",
          price: formData.base_price,
          cost_price: formData.cost_price,
          sku: "",
          is_default: formData.variants.length === 0,
        },
      ],
    });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Nama produk wajib diisi");
    if (!formData.category_id) return toast.error("Pilih kategori produk");

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-amber-500" />
            Produk & Katalog Menu
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Kelola harga jual, modal HPP, varian porsi/ukuran, dan ketersediaan stok menu
          </p>
        </div>
        {isOwner ? (
          <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-md shadow-amber-500/20">
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        ) : (
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
            Mode Kasir (Hanya Owner yang dapat mengubah menu)
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-amber-500 text-amber-950 shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
            }`}
          >
            Semua Menu ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-amber-500 text-amber-950 shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Cari produk / SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Product List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UtensilsCrossed}
                title="Produk tidak ditemukan"
                description="Belum ada produk dalam kategori ini atau pencarian tidak cocok."
                actionLabel="Tambah Produk Baru"
                onAction={handleOpenCreate}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold bg-stone-50/50 dark:bg-stone-800/40">
                    <th className="py-3.5 px-4">Nama Produk</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Harga Jual</th>
                    <th className="py-3.5 px-4">HPP (Modal)</th>
                    <th className="py-3.5 px-4">Varian / Opsi</th>
                    <th className="py-3.5 px-4">Status Kasir</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400 font-black text-sm shrink-0">
                              {product.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                              {product.name}
                              {product.is_favorite && (
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <div className="text-xs text-stone-400 font-mono">
                              {product.sku || "Tanpa SKU"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-stone-600 dark:text-stone-300">
                        {product.category?.name || "-"}
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-600 dark:text-amber-400">
                        {formatIDR(product.base_price)}
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-500">
                        {formatIDR(product.cost_price)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 text-xs">
                          {product.variants.length > 0 ? (
                            <span className="font-semibold text-stone-700 dark:text-stone-300">
                              {product.variants.length} Varian
                            </span>
                          ) : (
                            <span className="text-stone-400">Porsi Standar</span>
                          )}
                          {product.product_modifier_groups.length > 0 && (
                            <span className="text-[11px] text-amber-700 dark:text-amber-400">
                              +{product.product_modifier_groups.length} Grup Topping
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {/* Quick Toggle Ketersediaan (Habis / Tersedia) */}
                        <button
                          onClick={() =>
                            toggleAvailabilityMutation.mutate({
                              id: product.id,
                              is_available: !product.is_available,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            product.is_available
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                          title="Klik untuk ubah ketersediaan di kasir"
                        >
                          {product.is_available ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Tersedia
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Habis
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isOwner ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(product)}
                                className="h-8 w-8 text-stone-500 hover:text-amber-600"
                                title="Ubah Produk"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(product.id)}
                                className="h-8 w-8 text-stone-400 hover:text-red-600"
                                title="Hapus Produk"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-stone-400 italic">Lihat Saja</span>
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

      {/* Modal Dialog Form Tambah / Edit Produk */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Ubah Produk & Menu" : "Tambah Produk Baru"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Info Dasar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="prod-name">Nama Produk</Label>
                  <Input
                    id="prod-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Thai Tea Cheese, Siomay Ayam"
                    required
                  />
                </div>

                {/* Foto / Gambar Menu */}
                <div className="space-y-2 sm:col-span-2 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Foto / Gambar Menu
                    </Label>
                    {formData.image_url && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                        className="text-[11px] text-red-500 hover:underline font-semibold"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Preview Menu"
                        className="w-16 h-16 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center text-stone-400 shrink-0">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-2">
                      <Input
                        placeholder="Tempel URL Gambar atau pilih file di bawah..."
                        value={formData.image_url || ""}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="h-9 text-xs"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 shadow-2xs">
                          <Upload className="h-3.5 w-3.5 text-amber-600" />
                          <span>Pilih Foto dari HP / Laptop</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setFormData({ ...formData, image_url: result });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prod-cat">Kategori</Label>
                  <select
                    id="prod-cat"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                    required
                  >
                    <option value="" disabled>Pilih Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prod-sku">SKU (Kode Menu)</Label>
                  <Input
                    id="prod-sku"
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Contoh: DR-THAI-01"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Harga Jual Dasar (Rupiah)</Label>
                  <CurrencyInput
                    value={formData.base_price}
                    onChange={(val) => setFormData({ ...formData, base_price: val })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>HPP / Biaya Modal (Rupiah)</Label>
                  <CurrencyInput
                    value={formData.cost_price}
                    onChange={(val) => setFormData({ ...formData, cost_price: val })}
                  />
                </div>
              </div>

              {/* Varian Produk */}
              <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-base font-bold">Varian Ukuran / Porsi</Label>
                    <p className="text-xs text-stone-500">
                      Misal: Reguler/Large, Isi 3/Isi 5. Jika tidak ada, harga dasar yang dipakai.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariant}
                    className="text-xs font-bold gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Varian
                  </Button>
                </div>

                {formData.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 mb-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 items-center"
                  >
                    <div className="col-span-5">
                      <Input
                        placeholder="Nama Varian (Reguler)"
                        value={variant.name}
                        onChange={(e) => {
                          const updated = [...formData.variants];
                          updated[index].name = e.target.value;
                          setFormData({ ...formData, variants: updated });
                        }}
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <CurrencyInput
                        value={variant.price}
                        onChange={(val) => {
                          const updated = [...formData.variants];
                          updated[index].price = val;
                          setFormData({ ...formData, variants: updated });
                        }}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <CurrencyInput
                        value={variant.cost_price}
                        onChange={(val) => {
                          const updated = [...formData.variants];
                          updated[index].cost_price = val;
                          setFormData({ ...formData, variants: updated });
                        }}
                        placeholder="HPP"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hubungkan Grup Modifier */}
              <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
                <Label className="text-base font-bold mb-2 block">Pilihan Topping & Opsi Tambahan</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {modifierGroups.map((group) => {
                    const isChecked = formData.modifier_group_ids.includes(group.id);
                    return (
                      <label
                        key={group.id}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isChecked
                            ? "bg-amber-50 border-amber-500 text-amber-950 dark:bg-amber-950/40 dark:text-amber-300"
                            : "border-stone-200 hover:bg-stone-50 dark:border-stone-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                modifier_group_ids: [...formData.modifier_group_ids, group.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                modifier_group_ids: formData.modifier_group_ids.filter(
                                  (id) => id !== group.id
                                ),
                              });
                            }
                          }}
                          className="rounded h-4 w-4 text-amber-500"
                        />
                        <span>{group.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Lacak Stok & Pengaturan Tambahan */}
              <div className="border-t border-stone-100 dark:border-stone-800 pt-4 space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.track_stock}
                      onChange={(e) =>
                        setFormData({ ...formData, track_stock: e.target.checked })
                      }
                      className="rounded h-4 w-4 text-amber-500"
                    />
                    Lacak Stok Produk
                  </label>

                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_favorite}
                      onChange={(e) =>
                        setFormData({ ...formData, is_favorite: e.target.checked })
                      }
                      className="rounded h-4 w-4 text-amber-500"
                    />
                    Produk Favorit (Tampil Teratas)
                  </label>
                </div>

                {formData.track_stock && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>Jumlah Stok Saat Ini</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.stock_qty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock_qty: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Peringatan Stok Menipis</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.low_stock_threshold ?? 10}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            low_stock_threshold: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
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
                {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Produk */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Arsipkan Produk Ini?"
        description="Produk akan disembunyikan dari kasir dan katalog (soft delete), namun data riwayat transaksi terdahulu tetap terjaga rapi."
        confirmLabel="Ya, Arsipkan"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
