"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/utils/currency";
import { Plus, Minus, Check, Sparkles, X, Flame } from "lucide-react";
import { toast } from "sonner";
import type { ProductWithDetails } from "@/actions/product.actions";
import type { CartModifier } from "@/stores/cart.store";

interface VariantModifierDialogProps {
  product: ProductWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: {
    product_id: string;
    product_name: string;
    variant_id: string | null;
    variant_name: string | null;
    unit_price: number;
    qty: number;
    modifiers: CartModifier[];
    modifiers_total: number;
    note: string;
  }) => void;
}

interface VariantModifierFormProps {
  product: ProductWithDetails;
  onAddToCart: VariantModifierDialogProps["onAddToCart"];
  onClose: () => void;
}

function VariantModifierForm({ product, onAddToCart, onClose }: VariantModifierFormProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (product.variants.length > 0) {
      const defaultVar = product.variants.find((v) => v.is_default) || product.variants[0];
      return defaultVar?.id || null;
    }
    return null;
  });

  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>(() => {
    const initialMods: Record<string, string[]> = {};
    product.product_modifier_groups.forEach((pmg) => {
      const group = pmg.group;
      if (group.selection === "single" && group.modifiers.length > 0) {
        initialMods[group.id] = [group.modifiers[0].id];
      } else {
        initialMods[group.id] = [];
      }
    });
    return initialMods;
  });

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // Varian terpilih
  const currentVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return product.variants.find((v) => v.id === selectedVariantId) || null;
  }, [product, selectedVariantId]);

  const basePrice = currentVariant ? currentVariant.price : product.base_price;

  // Total delta modifier
  const { modifiersList, modifiersTotal } = useMemo(() => {
    const list: CartModifier[] = [];
    let total = 0;

    product.product_modifier_groups.forEach((pmg) => {
      const group = pmg.group;
      const selectedIds = selectedModifiers[group.id] || [];

      selectedIds.forEach((modId) => {
        const mod = group.modifiers.find((m) => m.id === modId);
        if (mod) {
          list.push({
            modifier_id: mod.id,
            name: mod.name,
            price_delta: mod.price_delta,
            group_name: group.name,
          });
          total += mod.price_delta;
        }
      });
    });

    return { modifiersList: list, modifiersTotal: total };
  }, [product, selectedModifiers]);

  const unitPrice = basePrice;
  const lineTotal = (unitPrice + modifiersTotal) * qty;

  const handleToggleModifier = (
    groupId: string,
    modifierId: string,
    selection: "single" | "multiple",
    maxSelect?: number | null
  ) => {
    const current = selectedModifiers[groupId] || [];

    if (selection === "single") {
      setSelectedModifiers({ ...selectedModifiers, [groupId]: [modifierId] });
    } else {
      if (current.includes(modifierId)) {
        setSelectedModifiers({
          ...selectedModifiers,
          [groupId]: current.filter((id) => id !== modifierId),
        });
      } else {
        if (maxSelect && current.length >= maxSelect) {
          toast.error(`Maksimal ${maxSelect} pilihan untuk grup ini`);
          return;
        }
        setSelectedModifiers({
          ...selectedModifiers,
          [groupId]: [...current, modifierId],
        });
      }
    }
  };

  const handleConfirm = () => {
    // Validasi required modifier groups
    for (const pmg of product.product_modifier_groups) {
      const group = pmg.group;
      const selected = selectedModifiers[group.id] || [];

      if (group.is_required && selected.length === 0) {
        toast.error(`Wajib memilih salah satu opsi pada '${group.name}'`);
        return;
      }
      if (group.min_select > 0 && selected.length < group.min_select) {
        toast.error(`Pilih minimal ${group.min_select} opsi pada '${group.name}'`);
        return;
      }
    }

    onAddToCart({
      product_id: product.id,
      product_name: product.name,
      variant_id: currentVariant?.id || null,
      variant_name: currentVariant?.name || null,
      unit_price: unitPrice,
      qty,
      modifiers: modifiersList,
      modifiers_total: modifiersTotal,
      note,
    });

    onClose();
  };

  return (
    <div className="flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden -m-6">
      {/* Header Banner Foto (Gacoan ESB Style) */}
      <div className="relative h-44 sm:h-52 w-full bg-stone-900 shrink-0 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700 text-amber-950 font-black text-4xl">
            {product.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        {/* Tombol Tutup X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Info Nama Menu di Atas Banner */}
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full">
              {product.category?.name || "Menu Spesial"}
            </span>
            {product.is_favorite && (
              <span className="text-[11px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="h-3 w-3" /> Favorit
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
            {product.name}
          </h2>
          <p className="text-base sm:text-lg font-extrabold text-amber-300 drop-shadow-sm mt-0.5">
            {formatIDR(basePrice)}
          </p>
        </div>
      </div>

      {/* Konten Pilihan Opsi & Topping (Scrollable Body) */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
        {product.description && (
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
            {product.description}
          </p>
        )}

        {/* Pilihan Varian Ukuran / Porsi */}
        {product.variants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                Pilih Varian / Ukuran
              </Label>
              <Badge variant="secondary" className="text-[10px] font-bold">Wajib (1)</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.variants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs"
                        : "border-stone-200 hover:border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900"
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-sm block">{v.name}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5 block">
                        {formatIDR(v.price)}
                      </span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-amber-500 bg-amber-500 text-amber-950"
                          : "border-stone-300 dark:border-stone-600"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grup Modifier (Level Pedas, Topping, dll) */}
        {product.product_modifier_groups.map((pmg) => {
          const group = pmg.group;
          const selected = selectedModifiers[group.id] || [];

          return (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    {group.name}
                  </Label>
                  <p className="text-[11px] text-stone-500">
                    {group.selection === "single"
                      ? "Pilih satu opsi"
                      : group.max_select
                      ? `Pilih hingga ${group.max_select} opsi`
                      : "Bisa pilih beberapa"}
                  </p>
                </div>
                {group.is_required ? (
                  <Badge variant="secondary" className="text-[10px] font-bold">Wajib (1)</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-stone-400">Opsional</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.modifiers.map((mod) => {
                  const isChecked = selected.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() =>
                        handleToggleModifier(
                          group.id,
                          mod.id,
                          group.selection,
                          group.max_select
                        )
                      }
                      className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isChecked
                          ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs"
                          : "border-stone-200 hover:border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900"
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-sm block">{mod.name}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 block">
                          {mod.price_delta > 0
                            ? `+ ${formatIDR(mod.price_delta)}`
                            : "Gratis (+ Rp 0)"}
                        </span>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isChecked
                            ? "border-amber-500 bg-amber-500 text-amber-950"
                            : "border-stone-300 dark:border-stone-600"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Catatan Khusus */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
            Catatan Khusus (Opsional)
          </Label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Saus dipisah, es sedikit, tidak pakai daun bawang..."
            className="w-full h-11 px-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Sticky Bottom Bar: Qty Stepper + Tombol Tambah Pesanan (Gacoan ESB Footer) */}
      <div className="p-4 sm:p-5 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 shrink-0 flex items-center gap-3">
        {/* Quantity Stepper */}
        <div className="flex items-center h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 rounded-xl hover:bg-white dark:hover:bg-stone-700 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-black text-sm">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="w-10 h-10 rounded-xl hover:bg-white dark:hover:bg-stone-700 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Tombol Tambah ke Keranjang */}
        <Button
          type="button"
          onClick={handleConfirm}
          className="flex-1 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-between px-5 active:scale-[0.98] transition-all"
        >
          <span>Tambah Pesanan</span>
          <span>{formatIDR(lineTotal)}</span>
        </Button>
      </div>
    </div>
  );
}

export function VariantModifierDialog({
  product,
  open,
  onOpenChange,
  onAddToCart,
}: VariantModifierDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-6 overflow-hidden rounded-3xl border-stone-200 dark:border-stone-800 shadow-2xl">
        <VariantModifierForm
          product={product}
          onAddToCart={onAddToCart}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
