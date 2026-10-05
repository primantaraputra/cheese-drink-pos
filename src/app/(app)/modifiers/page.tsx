"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModifierGroupsAction,
  createModifierGroupAction,
  updateModifierGroupAction,
  deleteModifierGroupAction,
  createModifierItemAction,
  updateModifierItemAction,
  deleteModifierItemAction,
} from "@/actions/modifier.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Sparkles, Edit2, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";
import type { ModifierGroupFormData, ModifierItemFormData } from "@/lib/validators/modifier.schema";

type ModifierGroup = Database["public"]["Tables"]["modifier_groups"]["Row"] & {
  modifiers: Database["public"]["Tables"]["modifiers"]["Row"][];
};
type ModifierItem = Database["public"]["Tables"]["modifiers"]["Row"];

export default function ModifiersPage() {
  const queryClient = useQueryClient();
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [editingItem, setEditingItem] = useState<ModifierItem | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string>("");

  const [deleteGroupDialog, setDeleteGroupDialog] = useState<string | null>(null);
  const [deleteItemDialog, setDeleteItemDialog] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState<ModifierGroupFormData>({
    name: "",
    selection: "multiple",
    is_required: false,
    min_select: 0,
    max_select: null,
    sort_order: 1,
    is_active: true,
  });

  const [itemForm, setItemForm] = useState<ModifierItemFormData>({
    group_id: "",
    name: "",
    price_delta: 0,
    cost_delta: 0,
    sort_order: 1,
    is_active: true,
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["modifier_groups"],
    queryFn: () => getModifierGroupsAction(),
  });

  // Group mutations
  const createGroupMutation = useMutation({
    mutationFn: (data: ModifierGroupFormData) => createModifierGroupAction(data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal membuat grup");
      toast.success("Grup modifier berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["modifier_groups"] });
      setGroupDialogOpen(false);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ModifierGroupFormData> }) =>
      updateModifierGroupAction(id, data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal update grup");
      toast.success("Grup modifier diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["modifier_groups"] });
      setGroupDialogOpen(false);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => deleteModifierGroupAction(id),
    onSuccess: () => {
      toast.success("Grup modifier berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["modifier_groups"] });
      setDeleteGroupDialog(null);
    },
  });

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: (data: ModifierItemFormData) => createModifierItemAction(data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal membuat opsi");
      toast.success("Pilihan modifier ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["modifier_groups"] });
      setItemDialogOpen(false);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ModifierItemFormData> }) =>
      updateModifierItemAction(id, data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal update opsi");
      toast.success("Pilihan modifier diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["modifier_groups"] });
      setItemDialogOpen(false);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteModifierItemAction(id),
    onSuccess: () => {
      toast.success("Pilihan modifier dihapus!");
      queryClient.invalidateQueries({ queryKey: ["modifier_groups"] });
      setDeleteItemDialog(null);
    },
  });

  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: "",
      selection: "multiple",
      is_required: false,
      min_select: 0,
      max_select: null,
      sort_order: groups.length + 1,
      is_active: true,
    });
    setGroupDialogOpen(true);
  };

  const handleOpenEditGroup = (group: ModifierGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      selection: group.selection,
      is_required: group.is_required,
      min_select: group.min_select,
      max_select: group.max_select,
      sort_order: group.sort_order,
      is_active: group.is_active,
    });
    setGroupDialogOpen(true);
  };

  const handleOpenCreateItem = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingItem(null);
    setItemForm({
      group_id: groupId,
      name: "",
      price_delta: 0,
      cost_delta: 0,
      sort_order: 1,
      is_active: true,
    });
    setItemDialogOpen(true);
  };

  const handleOpenEditItem = (item: ModifierItem) => {
    setActiveGroupId(item.group_id);
    setEditingItem(item);
    setItemForm({
      group_id: item.group_id,
      name: item.name,
      price_delta: item.price_delta,
      cost_delta: item.cost_delta,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setItemDialogOpen(true);
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupForm });
    } else {
      createGroupMutation.mutate(groupForm);
    }
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemForm });
    } else {
      createItemMutation.mutate({ ...itemForm, group_id: activeGroupId });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-amber-500" />
            Topping & Opsi Tambahan
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Atur pilihan topping minuman cheese, level gula, es batu, dan aneka saus dimsum
          </p>
        </div>
        <Button onClick={handleOpenCreateGroup} className="gap-2 font-bold shadow-md shadow-amber-500/20">
          <Plus className="h-4 w-4" />
          Tambah Grup Opsi
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Belum ada grup opsi modifier"
          description="Tambahkan grup opsi seperti Topping Minuman, Level Gula, atau Saus Dimsum."
          actionLabel="Tambah Grup Opsi Sekarang"
          onAction={handleOpenCreateGroup}
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <Card key={group.id} className="overflow-hidden border-stone-200 dark:border-stone-800">
              <CardHeader className="bg-stone-50/70 dark:bg-stone-800/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {group.selection === "single" ? "Pilih Satu (Radio)" : "Pilih Banyak (Checkbox)"}
                      </Badge>
                      {group.is_required && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-900">
                          Wajib Dipilih
                        </Badge>
                      )}
                      {group.max_select && (
                        <Badge variant="outline" className="text-xs">
                          Maks {group.max_select} opsi
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCreateItem(group.id)}
                      className="gap-1 text-xs font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Opsi
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditGroup(group)}
                      className="h-8 w-8 text-stone-500 hover:text-amber-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteGroupDialog(group.id)}
                      className="h-8 w-8 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {group.modifiers.length === 0 ? (
                  <div className="p-6 text-center text-sm text-stone-400">
                    Belum ada pilihan di dalam grup ini. Klik &quot;Tambah Opsi&quot; di atas.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {group.modifiers.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-stone-50/50 dark:hover:bg-stone-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                              {item.price_delta > 0 ? `+${formatIDR(item.price_delta)}` : "Gratis (+Rp 0)"}
                            </div>
                            {item.cost_delta > 0 && (
                              <div className="text-xs text-stone-400">
                                HPP: +{formatIDR(item.cost_delta)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditItem(item)}
                              className="h-8 w-8 text-stone-500 hover:text-amber-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteItemDialog(item.id)}
                              className="h-8 w-8 text-stone-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Grup Modifier */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <form onSubmit={handleGroupSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Ubah Grup Opsi" : "Tambah Grup Opsi Baru"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="grp-name">Nama Grup</Label>
                <Input
                  id="grp-name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Contoh: Topping Minuman, Level Gula"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grp-selection">Tipe Pemilihan</Label>
                <select
                  id="grp-selection"
                  value={groupForm.selection}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      selection: e.target.value as "single" | "multiple",
                    })
                  }
                  className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                >
                  <option value="multiple">Pilih Banyak (Multiple / Checkbox)</option>
                  <option value="single">Pilih Salah Satu Saja (Single / Radio)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="grp-req"
                  checked={groupForm.is_required}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, is_required: e.target.checked })
                  }
                  className="rounded h-4 w-4 text-amber-500"
                />
                <Label htmlFor="grp-req" className="cursor-pointer">
                  Wajib Dipilih oleh Pelanggan
                </Label>
              </div>

              {groupForm.selection === "multiple" && (
                <div className="space-y-1.5">
                  <Label htmlFor="grp-max">Batas Maksimal Opsi (Kosongkan jika bebas)</Label>
                  <Input
                    id="grp-max"
                    type="number"
                    min={1}
                    value={groupForm.max_select ?? ""}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        max_select: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Contoh: 3"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                className="font-bold"
              >
                {(createGroupMutation.isPending || updateGroupMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Simpan Grup
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Item Modifier */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <form onSubmit={handleItemSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Ubah Pilihan Opsi" : "Tambah Pilihan Opsi"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="item-name">Nama Pilihan</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Contoh: Cheese Foam, Boba, Less Ice"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tambahan Harga Jual</Label>
                  <CurrencyInput
                    value={itemForm.price_delta}
                    onChange={(val) => setItemForm({ ...itemForm, price_delta: val })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tambahan HPP (Modal)</Label>
                  <CurrencyInput
                    value={itemForm.cost_delta}
                    onChange={(val) => setItemForm({ ...itemForm, cost_delta: val })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createItemMutation.isPending || updateItemMutation.isPending}
                className="font-bold"
              >
                {(createItemMutation.isPending || updateItemMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Simpan Opsi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Grup */}
      <ConfirmDialog
        open={Boolean(deleteGroupDialog)}
        onOpenChange={(open) => !open && setDeleteGroupDialog(null)}
        title="Hapus Grup Opsi?"
        description="Semua pilihan di dalam grup ini juga akan terhapus."
        confirmLabel="Ya, Hapus Grup"
        isLoading={deleteGroupMutation.isPending}
        onConfirm={() => deleteGroupDialog && deleteGroupMutation.mutate(deleteGroupDialog)}
      />

      {/* Dialog Konfirmasi Hapus Item */}
      <ConfirmDialog
        open={Boolean(deleteItemDialog)}
        onOpenChange={(open) => !open && setDeleteItemDialog(null)}
        title="Hapus Pilihan Opsi?"
        description="Pilihan modifier ini tidak akan dapat dipilih lagi di POS."
        confirmLabel="Ya, Hapus Opsi"
        isLoading={deleteItemMutation.isPending}
        onConfirm={() => deleteItemDialog && deleteItemMutation.mutate(deleteItemDialog)}
      />
    </div>
  );
}
