"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cart.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/utils/currency";
import { calculateOrderTotals, type StoreTaxServiceSettings } from "@/lib/utils/calc";
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type Discount = Database["public"]["Tables"]["discounts"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];

interface CartPanelProps {
  settings: StoreTaxServiceSettings;
  discounts: Discount[];
  customers?: Customer[];
  onOpenPayment: () => void;
  isProcessing?: boolean;
}

export function CartPanel({
  settings,
  discounts,
  customers = [],
  onOpenPayment,
  isProcessing = false,
}: CartPanelProps) {
  const {
    items,
    customerName,
    discountId,
    updateQty,
    removeItem,
    updateItemNote,
    setCustomer,
    setDiscountId,
    clearCart,
  } = useCartStore();

  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);

  // Hitung total dengan utility calc.ts (Murni tanpa diskon promo)
  const totals = calculateOrderTotals(
    items.map((it) => ({
      unitPrice: it.unit_price,
      modifiersTotal: it.modifiers_total,
      qty: it.qty,
    })),
    settings,
    null
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
      {/* Header: Keranjang & Input Pelanggan */}
      <div className="p-3 sm:p-4 border-b border-stone-100 dark:border-stone-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
            Keranjang
          </h3>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Kosongkan keranjang?")) clearCart();
              }}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              Hapus Semua
            </button>
          )}
        </div>

        {/* Customer Name Input */}
        <div>
          <Input
            list="pos-customers-list"
            placeholder="Nama Pelanggan (opsional)..."
            value={customerName}
            onChange={(e) => {
              const val = e.target.value;
              const matched = customers.find(
                (c) => c.name.toLowerCase() === val.toLowerCase() || c.phone === val
              );
              if (matched) {
                setCustomer(matched.id, matched.name);
              } else {
                setCustomer(null, val);
              }
            }}
            className="h-9 text-xs rounded-xl"
          />
          {customers.length > 0 && (
            <datalist id="pos-customers-list">
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.phone ? `${c.phone} • ${c.visit_count}x kunjungan` : `${c.visit_count}x kunjungan`}
                </option>
              ))}
            </datalist>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {items.length > 0 && (
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {items.length} Item Ditambahkan
            </span>
          </div>
        )}
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <ShoppingBag className="h-10 w-10 text-stone-300 dark:text-stone-700 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold">Keranjang masih kosong</p>
            <p className="text-xs text-stone-400 max-w-[200px] mt-1">
              Pilih menu dimsum atau minuman di samping untuk menambahkan item
            </p>
          </div>
        ) : (
          items.map((item) => {
            const itemTotal = (item.unit_price + item.modifiers_total) * item.qty;
            const isEditingNote = activeNoteItemId === item.id;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col p-3 rounded-2xl border border-stone-100 hover:border-amber-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {item.product_name}
                    </h4>
                    {item.variant_name && (
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
                        {item.variant_name}
                      </span>
                    )}

                    {/* Modifiers Badges */}
                    {item.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.modifiers.map((m) => (
                          <span
                            key={m.modifier_id}
                            className="inline-flex items-center text-[10px] bg-white dark:bg-stone-900 px-1.5 py-0.5 rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium"
                          >
                            +{m.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Catatan Item */}
                    {item.note && !isEditingNote && (
                      <div className="text-[11px] text-stone-500 italic mt-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{item.note}</span>
                      </div>
                    )}
                  </div>

                  <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 shrink-0">
                    {formatIDR(itemTotal)}
                  </span>
                </div>

                {/* Inline Note Editor */}
                {isEditingNote && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Input
                      placeholder="Tulis catatan (misal: pedas/manis)..."
                      value={item.note}
                      onChange={(e) => updateItemNote(item.id, e.target.value)}
                      className="h-8 text-xs rounded-lg"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveNoteItemId(null)}
                      className="h-8 px-2 text-xs"
                    >
                      OK
                    </Button>
                  </div>
                )}

                {/* Bottom Row: Qty Controls & Note Toggle */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                  <button
                    type="button"
                    onClick={() => setActiveNoteItemId(isEditingNote ? null : item.id)}
                    className="text-[11px] font-semibold text-stone-400 hover:text-amber-600 flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    {item.note ? "Ubah Catatan" : "Catatan"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, -1)}
                      className="h-7 w-7 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-200 hover:bg-stone-100 active:scale-95"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-extrabold text-xs w-6 text-center">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, 1)}
                      className="h-7 w-7 rounded-lg bg-amber-500 text-amber-950 flex items-center justify-center hover:bg-amber-600 active:scale-95 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-stone-300 hover:text-red-500 p-1 ml-1"
                      title="Hapus Item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Kalkulasi dan Tombol Bayar */}
      {items.length > 0 && (
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900 space-y-3">
          {/* Rincian Finansial */}
          <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {formatIDR(totals.subtotal)}
              </span>
            </div>

            {totals.serviceAmount > 0 && (
              <div className="flex justify-between">
                <span>Biaya Layanan ({settings.servicePercent}%)</span>
                <span>{formatIDR(totals.serviceAmount)}</span>
              </div>
            )}

            {totals.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Pajak Restoran ({settings.taxPercent}%)</span>
                <span>{formatIDR(totals.taxAmount)}</span>
              </div>
            )}

            {totals.roundingAmount !== 0 && (
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Pembulatan Kasir</span>
                <span>{totals.roundingAmount > 0 ? `+${formatIDR(totals.roundingAmount)}` : formatIDR(totals.roundingAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 dark:border-stone-800">
              <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                TOTAL
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatIDR(totals.total)}
              </span>
            </div>
          </div>

          {/* Tombol Aksi: Bayar Sekarang */}
          <div className="pt-1">
            <Button
              type="button"
              onClick={onOpenPayment}
              disabled={isProcessing}
              className="w-full h-13 font-black text-base gap-2 rounded-2xl shadow-lg shadow-amber-500/25 bg-amber-500 hover:bg-amber-600 text-amber-950 transition-all hover:scale-[1.01]"
            >
              <CreditCard className="h-5 w-5" />
              <span>Bayar Pesanan ({formatIDR(totals.total)})</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
