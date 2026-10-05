"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils/currency";
import { Star, AlertCircle, Sparkles, Plus, Minus } from "lucide-react";
import type { ProductWithDetails } from "@/actions/product.actions";

interface ProductCardProps {
  product: ProductWithDetails;
  onSelect: (product: ProductWithDetails) => void;
  cartQty?: number;
  onQuickAdd?: (product: ProductWithDetails) => void;
  onQuickRemove?: (product: ProductWithDetails) => void;
}

export function ProductCard({
  product,
  onSelect,
  cartQty = 0,
  onQuickAdd,
  onQuickRemove,
}: ProductCardProps) {
  const isOutOfStock = !product.is_available || (product.track_stock && product.stock_qty <= 0);
  const isLowStock =
    product.track_stock &&
    product.stock_qty > 0 &&
    product.stock_qty <= (product.low_stock_threshold ?? 10);
  const hasCustomization =
    product.variants.length > 0 || product.product_modifier_groups.length > 0;

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    if (hasCustomization) {
      onSelect(product);
    } else {
      if (onQuickAdd) {
        onQuickAdd(product);
      } else {
        onSelect(product);
      }
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickRemove) {
      onQuickRemove(product);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(product);
    }
  };

  return (
    <div
      onClick={() => !isOutOfStock && onSelect(product)}
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isOutOfStock) {
          e.preventDefault();
          onSelect(product);
        }
      }}
      className={`group relative flex items-stretch justify-between gap-3.5 sm:gap-4 p-3 sm:p-4 rounded-3xl border transition-all duration-200 text-left ${
        isOutOfStock
          ? "border-stone-200/60 bg-stone-100/50 opacity-60 cursor-not-allowed dark:border-stone-800/60 dark:bg-stone-900/30"
          : "border-stone-200 bg-white hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-500/80 cursor-pointer active:scale-[0.99]"
      }`}
    >
      {/* Kolom Kiri: Informasi Menu (Gacoan ESB Style) */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
        <div>
          {/* Tag Favorit / Kategori */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {product.is_favorite && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/50 px-2 py-0.5 rounded-full shadow-2xs">
                <Star className="h-3 w-3 fill-rose-500 text-rose-500" />
                Favorit
              </span>
            )}

            {product.category?.name && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                {product.category.name}
              </span>
            )}

            {isLowStock && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/70 px-1.5 py-0.5 rounded-md">
                <AlertCircle className="h-2.5 w-2.5 text-amber-600" />
                Sisa {product.stock_qty}
              </span>
            )}
          </div>

          {/* Nama Produk */}
          <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>

          {/* Deskripsi Menu */}
          {product.description && (
            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Harga & Indikator Opsi */}
        <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-baseline justify-between gap-2 flex-wrap">
          <div>
            {hasCustomization && (
              <span className="text-[10px] text-stone-400 block leading-none font-medium mb-0.5">
                Mulai dari
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
              {formatIDR(product.base_price)}
            </span>
          </div>

          {hasCustomization && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Opsi Level
            </span>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Foto Menu + Tombol Tambah (Gacoan ESB Signature Layout) */}
      <div className="flex flex-col items-center justify-between shrink-0 w-24 sm:w-28 gap-2">
        {/* Gambar Menu */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-xs border border-stone-200/80 dark:border-stone-800">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950 dark:to-stone-900 text-amber-800 dark:text-amber-400">
              <span className="font-black text-2xl sm:text-3xl">{product.name.charAt(0)}</span>
              <span className="text-[9px] font-bold tracking-wider mt-1 opacity-70">CHEESE</span>
            </div>
          )}

          {/* Overlay Jika Habis */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-white font-black text-xs uppercase tracking-wider bg-rose-600/90 px-2.5 py-1 rounded-md shadow-md">
                Habis
              </span>
            </div>
          )}
        </div>

        {/* Tombol Aksi Tambah / Stepper (Gacoan ESB Style) */}
        {!isOutOfStock && (
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            {cartQty > 0 && !hasCustomization ? (
              <div className="flex items-center justify-between w-full h-8 sm:h-9 bg-amber-500 text-amber-950 rounded-xl px-1 font-black shadow-sm">
                <button
                  type="button"
                  onClick={handleMinusClick}
                  className="w-7 h-7 rounded-lg hover:bg-amber-600/30 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-black px-1">{cartQty}</span>
                <button
                  type="button"
                  onClick={handlePlusClick}
                  className="w-7 h-7 rounded-lg hover:bg-amber-600/30 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleActionClick}
                className="w-full h-8 sm:h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs shadow-xs hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>{cartQty > 0 ? `Tambah (${cartQty})` : "Tambah"}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
