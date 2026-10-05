"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductsAction, type ProductWithDetails } from "@/actions/product.actions";
import { getCategoriesAction } from "@/actions/category.actions";
import { getCustomersAction } from "@/actions/customer.actions";
import { getStoreSettingsAction } from "@/actions/settings.actions";
import {
  getActiveShiftAction,
  openShiftAction,
  createOrderAction,
  type CreateOrderPayload,
} from "@/actions/order.actions";
import { useCartStore } from "@/stores/cart.store";
import { ProductCard } from "@/components/pos/product-card";
import { VariantModifierDialog } from "@/components/pos/variant-modifier-dialog";
import { CartPanel } from "@/components/pos/cart-panel";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { OrderSuccessDialog } from "@/components/pos/order-success-dialog";
import { OpenShiftDialog } from "@/components/pos/open-shift-dialog";
import { Receipt, type ReceiptData } from "@/components/orders/receipt";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatIDR } from "@/lib/utils/currency";
import { calculateOrderTotals, type StoreTaxServiceSettings } from "@/lib/utils/calc";
import {
  Search,
  Loader2,
  Sparkles,
  UtensilsCrossed,
  X,
  ShoppingBag,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import type { PaymentMethod } from "@/types/database.types";

export default function POSPage() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductForDialog, setSelectedProductForDialog] = useState<ProductWithDetails | null>(null);

  // Dialog States
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{
    order_id: string;
    order_no: string;
    queue_no: number;
    total: number;
    change_amount: number;
  } | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null);
  const lastSubmittedPayloadRef = useRef<CreateOrderPayload | null>(null);

  // Cart store
  const {
    items,
    orderType,
    channel,
    tableNo,
    customerId,
    customerName,
    discountId,
    orderNote,
    addItem,
    updateQty,
    removeItem,
    clearCart,
  } = useCartStore();

  // Queries
  const { data: activeShift, isLoading: shiftLoading } = useQuery({
    queryKey: ["active_shift"],
    queryFn: () => getActiveShiftAction(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategoriesAction(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomersAction(),
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["store_settings"],
    queryFn: () => getStoreSettingsAction(),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["pos_products"],
    queryFn: () => getProductsAction(),
  });

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" ||
        (selectedCategory === "favorites" && p.is_favorite) ||
        p.category_id === selectedCategory;

      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Tax & Service Settings
  const calcSettings: StoreTaxServiceSettings = useMemo(() => {
    return {
      taxEnabled: storeSettings?.tax_enabled ?? false,
      taxPercent: Number(storeSettings?.tax_percent || 0),
      taxInclusive: storeSettings?.tax_inclusive ?? false,
      serviceEnabled: storeSettings?.service_enabled ?? false,
      servicePercent: Number(storeSettings?.service_percent || 0),
      roundingUnit: storeSettings?.rounding_unit ?? 100,
    };
  }, [storeSettings]);

  // Mutations
  const openShiftMutation = useMutation({
    mutationFn: (cash: number) => openShiftAction(cash),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal membuka shift");
      toast.success("Shift kasir berhasil dibuka! Selamat bertransaksi.");
      queryClient.invalidateQueries({ queryKey: ["active_shift"] });
    },
  });

  const orderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrderAction(payload),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal memproses pesanan");

      if (res.data?.status === "completed") {
        const currentPayload = lastSubmittedPayloadRef.current;
        const currentTotals = calculateOrderTotals(
          items.map((it) => ({
            unitPrice: it.unit_price,
            modifiersTotal: it.modifiers_total,
            qty: it.qty,
          })),
          calcSettings,
          null
        );

        const receipt: ReceiptData = {
          order_no: res.data.order_no,
          queue_no: res.data.queue_no,
          created_at: new Date().toISOString(),
          order_type: "take_away",
          customer_name: customerName || null,
          cashier_name: (activeShift as { cashier?: { full_name?: string } } | null | undefined)?.cashier?.full_name || "Kasir",
          items: items.map((it) => ({
            id: it.id,
            product_name: it.product_name,
            variant_name: it.variant_name,
            qty: it.qty,
            unit_price: it.unit_price,
            subtotal: (it.unit_price + it.modifiers_total) * it.qty,
            note: it.note,
            modifiers: it.modifiers.map((m) => ({
              modifier_name: m.name,
              price_delta: m.price_delta,
            })),
          })),
          subtotal: currentTotals.subtotal,
          discount_amount: currentTotals.discountAmount,
          service_amount: currentTotals.serviceAmount,
          tax_amount: currentTotals.taxAmount,
          rounding_amount: currentTotals.roundingAmount,
          total: res.data.total,
          paid_amount: (currentPayload?.payments?.[0]?.amount ?? res.data.total) + res.data.change_amount,
          change_amount: res.data.change_amount,
          payments: currentPayload?.payments?.map((p) => ({
            method: p.method,
            amount: p.amount,
            reference_no: p.reference_no,
          })) || [{ method: "cash", amount: res.data.total + res.data.change_amount }],
          note: orderNote || null,
        };

        setCompletedReceipt(receipt);
        setLastCompletedOrder(res.data);
        setPaymentDialogOpen(false);
        setMobileCartOpen(false);
        setSuccessDialogOpen(true);
        clearCart();
        toast.success(`Pesanan ${res.data.order_no} berhasil diselesaikan!`);
      } else {
        // Held order
        clearCart();
        setMobileCartOpen(false);
        toast.success(`Pesanan ${res.data?.order_no} berhasil diparkir!`);
      }

      queryClient.invalidateQueries({ queryKey: ["pos_products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["held_orders"] });
    },
  });

  // Product Selection Handler (Instant vs Dialog)
  const handleSelectProduct = (product: ProductWithDetails) => {
    const hasOptions = product.variants.length > 0 || product.product_modifier_groups.length > 0;

    if (hasOptions) {
      setSelectedProductForDialog(product);
    } else {
      handleQuickAdd(product);
    }
  };

  // Quick Add: +1 or instant add to cart
  const handleQuickAdd = (product: ProductWithDetails) => {
    const hasOptions = product.variants.length > 0 || product.product_modifier_groups.length > 0;
    if (hasOptions) {
      setSelectedProductForDialog(product);
      return;
    }

    const existing = items.find((it) => it.product_id === product.id);
    if (existing) {
      updateQty(existing.id, 1);
    } else {
      addItem({
        product_id: product.id,
        product_name: product.name,
        variant_id: null,
        variant_name: null,
        unit_price: product.base_price,
        qty: 1,
        modifiers: [],
        modifiers_total: 0,
        note: "",
        image_url: product.image_url,
      });
      toast.success(`${product.name} dimasukkan ke keranjang`);
    }
  };

  // Quick Remove: -1 or remove from cart
  const handleQuickRemove = (product: ProductWithDetails) => {
    const existing = items.find((it) => it.product_id === product.id);
    if (existing) {
      if (existing.qty > 1) {
        updateQty(existing.id, -1);
      } else {
        removeItem(existing.id);
      }
    }
  };

  // Build Payload: Murni Take Away & Walk-in
  const buildPayload = (payments?: { method: PaymentMethod; amount: number; reference_no?: string }[]): CreateOrderPayload => {
    return {
      mode: "pay",
      order_type: "take_away",
      channel: "walk_in",
      table_no: null,
      customer_id: customerId,
      customer_name: customerName || null,
      discount_id: discountId,
      note: orderNote || null,
      items: items.map((it) => ({
        product_id: it.product_id,
        variant_id: it.variant_id,
        qty: it.qty,
        note: it.note || null,
        modifiers: it.modifiers.map((m) => ({ modifier_id: m.modifier_id })),
      })),
      payments,
    };
  };

  const handleProcessPayment = (payments: { method: PaymentMethod; amount: number; reference_no?: string }[]) => {
    const payload = buildPayload(payments);
    lastSubmittedPayloadRef.current = payload;
    orderMutation.mutate(payload);
  };

  // Keyboard Shortcuts: / focus search, F2 pay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F2" && items.length > 0 && !paymentDialogOpen) {
        e.preventDefault();
        setPaymentDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, paymentDialogOpen]);

  // Total keranjang untuk tombol melayang mobile
  const totalItemCount = items.reduce((sum, it) => sum + it.qty, 0);
  const cartSubtotal = items.reduce(
    (sum, it) => sum + (it.unit_price + it.modifiers_total) * it.qty,
    0
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] max-w-[1600px] mx-auto overflow-hidden">
      {/* Kolom Kiri: Menu & Feed Produk (Gacoan ESB Style) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Banner Toko & Search Bar & Kategori Tabs */}
        <div className="space-y-3 mb-3 shrink-0">
          {/* Header Info Toko Gacoan Style */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-amber-950 dark:text-amber-400">
                {storeSettings?.store_name || "Cheese Drink"}
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" /> Bungkus (Take Away)
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                ref={searchInputRef}
                placeholder="Cari dimsum, minuman cheese, SKU... (Tekan /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-white dark:bg-stone-900 shadow-xs border-stone-200 dark:border-stone-800 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Scrollable Categories (Pills ala Gacoan ESB) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20"
                  : "bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
              }`}
            >
              Semua Menu
            </button>
            <button
              onClick={() => setSelectedCategory("favorites")}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === "favorites"
                  ? "bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20"
                  : "bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Favorit
            </button>
            {categories.map((cat) => {
              const icon = cat.name.toLowerCase().includes("dimsum") ? "🥟" : "🥤";
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20"
                      : "bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Feed / Product List (Gacoan ESB Format) */}
        <div className="flex-1 overflow-y-auto pr-1">
          {productsLoading ? (
            <div className="flex items-center justify-center h-64 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Menu tidak ditemukan"
              description="Tidak ada produk yang cocok dengan pencarian atau filter kategori saat ini."
            />
          ) : selectedCategory === "all" && !searchQuery ? (
            /* Tampilan Dikelompokkan Per Kategori (Signature Gacoan ESB) */
            <div className="space-y-6 pb-24 lg:pb-6">
              {categories.map((cat) => {
                const catProducts = filteredProducts.filter((p) => p.category_id === cat.id);
                if (catProducts.length === 0) return null;
                const icon = cat.name.toLowerCase().includes("dimsum") ? "🥟" : "🥤";

                return (
                  <div key={cat.id} className="space-y-3">
                    <div className="flex items-center justify-between sticky top-0 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-xs py-1.5 z-10">
                      <h2 className="text-sm font-black tracking-wider uppercase text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <span className="text-base">{icon}</span>
                        <span>{cat.name}</span>
                        <span className="text-xs font-bold text-stone-400">
                          ({catProducts.length})
                        </span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                      {catProducts.map((product) => {
                        const cartQty = items
                          .filter((it) => it.product_id === product.id)
                          .reduce((sum, it) => sum + it.qty, 0);

                        return (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onSelect={handleSelectProduct}
                            cartQty={cartQty}
                            onQuickAdd={handleQuickAdd}
                            onQuickRemove={handleQuickRemove}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tampilan Berdasarkan Filter Tertentu atau Pencarian */
            <div className="space-y-3 pb-24 lg:pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                {filteredProducts.map((product) => {
                  const cartQty = items
                    .filter((it) => it.product_id === product.id)
                    .reduce((sum, it) => sum + it.qty, 0);

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={handleSelectProduct}
                      cartQty={cartQty}
                      onQuickAdd={handleQuickAdd}
                      onQuickRemove={handleQuickRemove}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Panel Keranjang Desktop & Tablet (35%) */}
      <div className="hidden lg:flex w-[380px] xl:w-[420px] h-full shrink-0">
        <CartPanel
          settings={calcSettings}
          discounts={[]}
          customers={customers}
          onOpenPayment={() => setPaymentDialogOpen(true)}
          isProcessing={orderMutation.isPending}
        />
      </div>

      {/* Tombol Melayang Mobile: "Keranjang (n) • Rp xx.xxx" (Gacoan ESB Style) */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/30 flex items-center justify-between px-4 sm:px-5 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-950 text-amber-300">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {totalItemCount}
                </span>
              </div>
              <div className="text-left">
                <span className="text-[10px] block font-bold leading-none opacity-80 uppercase tracking-wider">
                  Total Pesanan
                </span>
                <span className="text-base font-black leading-tight">
                  {formatIDR(cartSubtotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-950/15 px-3.5 py-1.5 rounded-xl text-xs font-black">
              <span>Lihat Pesanan</span>
              <span className="text-sm">➔</span>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Sheet Keranjang Mobile */}
      {mobileCartOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setMobileCartOpen(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-t-3xl max-h-[85vh] h-[85vh] flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="font-bold text-lg text-amber-950 dark:text-amber-400">
                Keranjang Pesanan ({totalItemCount} item)
              </span>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="p-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden pt-2">
              <CartPanel
                settings={calcSettings}
                discounts={[]}
                customers={customers}
                onOpenPayment={() => {
                  setMobileCartOpen(false);
                  setPaymentDialogOpen(true);
                }}
                isProcessing={orderMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Kustomisasi Varian & Modifier */}
      <VariantModifierDialog
        product={selectedProductForDialog}
        open={Boolean(selectedProductForDialog)}
        onOpenChange={(open) => !open && setSelectedProductForDialog(null)}
        onAddToCart={(item) => {
          addItem(item);
          toast.success(`${item.product_name} dimasukkan ke keranjang`);
        }}
      />

      {/* Gerbang Buka Shift Kasir (Bila belum ada shift open) */}
      <OpenShiftDialog
        open={!shiftLoading && !activeShift}
        onOpenShift={(cash) => openShiftMutation.mutate(cash)}
        isLoading={openShiftMutation.isPending}
      />

      {/* Modal Pembayaran Kasir */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={
          // Hitung total akhir termasuk pembulatan (tanpa promo)
          calculateOrderTotals(
            items.map((it) => ({
              unitPrice: it.unit_price,
              modifiersTotal: it.modifiers_total,
              qty: it.qty,
            })),
            calcSettings,
            null
          ).total
        }
        onProcessPayment={handleProcessPayment}
        isProcessing={orderMutation.isPending}
      />

      {/* Layar Sukses Transaksi */}
      <OrderSuccessDialog
        open={successDialogOpen}
        orderData={lastCompletedOrder}
        onNewTransaction={() => setSuccessDialogOpen(false)}
        onPrintReceipt={() => {
          window.print();
        }}
      />

      {/* Render Struk Tersembunyi untuk Pencetakan Thermal */}
      {completedReceipt && (
        <div className="print-receipt-offscreen">
          <Receipt
            data={completedReceipt}
            settings={{
              store_name: storeSettings?.store_name || "Cheese Drink",
              tagline: storeSettings?.tagline,
              address: storeSettings?.address,
              phone: storeSettings?.phone,
              receipt_header: storeSettings?.receipt_header,
              receipt_footer: storeSettings?.receipt_footer,
              receipt_paper_width: storeSettings?.receipt_paper_width || 58,
            }}
            showActions={false}
          />
        </div>
      )}
    </div>
  );
}
