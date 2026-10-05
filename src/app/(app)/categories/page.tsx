"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/category.actions";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Plus, Layers, Edit2, Trash2, Loader2, Utensils, Coffee, Folder } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";
import type { CategoryFormData } from "@/lib/validators/category.schema";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "food",
    sort_order: 1,
    is_active: true,
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategoriesAction(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => createCategoryAction(data),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal membuat kategori");
        return;
      }
      toast.success("Kategori berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      updateCategoryAction(id, data),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal memperbarui kategori");
        return;
      }
      toast.success("Kategori berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryAction(id),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal menghapus kategori");
        return;
      }
      toast.success("Kategori berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteId(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type: "food",
      sort_order: categories.length + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <Layers className="h-8 w-8 text-amber-500" />
            Kategori Produk
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Kelola pengelompokan menu dimsum, minuman cheese, dan aneka snack
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-md shadow-amber-500/20">
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori Menu</CardTitle>
          <CardDescription>
            Urutan kategori akan mempengaruhi tampilan tab di layar kasir (POS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Belum ada kategori"
              description="Buat kategori pertama Anda untuk mengelompokkan makanan dan minuman."
              actionLabel="Tambah Kategori Sekarang"
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                    <th className="py-3 px-4">Urutan</th>
                    <th className="py-3 px-4">Nama Kategori</th>
                    <th className="py-3 px-4">Tipe Menu</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40">
                      <td className="py-3.5 px-4 font-bold text-stone-400">{cat.sort_order}</td>
                      <td className="py-3.5 px-4 font-bold text-stone-800 dark:text-stone-200">
                        {cat.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {cat.type === "food" && (
                          <Badge variant="secondary" className="gap-1">
                            <Utensils className="h-3 w-3" />
                            Makanan (Dimsum)
                          </Badge>
                        )}
                        {cat.type === "drink" && (
                          <Badge variant="default" className="gap-1 bg-amber-500 text-amber-950">
                            <Coffee className="h-3 w-3" />
                            Minuman
                          </Badge>
                        )}
                        {cat.type === "other" && (
                          <Badge variant="outline" className="gap-1">
                            <Folder className="h-3 w-3" />
                            Lainnya
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {cat.is_active ? (
                          <Badge variant="success">Aktif</Badge>
                        ) : (
                          <Badge variant="outline" className="text-stone-400">Nonaktif</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(cat)}
                            className="h-8 w-8 text-stone-600 hover:text-amber-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(cat.id)}
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

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Ubah Kategori Menu" : "Tambah Kategori Baru"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Nama Kategori</Label>
                <Input
                  id="cat-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Dimsum Mentai, Minuman Cheese"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-type">Tipe Produk</Label>
                <select
                  id="cat-type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "food" | "drink" | "other",
                    })
                  }
                  className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                >
                  <option value="food">Makanan / Dimsum</option>
                  <option value="drink">Minuman Cheese / Segar</option>
                  <option value="other">Snack & Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-sort">Urutan Tampilan</Label>
                  <Input
                    id="cat-sort"
                    type="number"
                    min={1}
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer h-11 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="rounded h-4 w-4 text-amber-500"
                    />
                    Status Aktif
                  </label>
                </div>
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
                {editingCategory ? "Simpan Perubahan" : "Tambah Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Kategori?"
        description="Kategori hanya bisa dihapus jika tidak ada produk yang masih terhubung dengannya."
        confirmLabel="Ya, Hapus"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
