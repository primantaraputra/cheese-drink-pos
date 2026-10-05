import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { OrderType, OrderChannel } from "@/types/database.types";

export interface CartModifier {
  modifier_id: string;
  name: string;
  price_delta: number;
  group_name?: string;
}

export interface CartItem {
  id: string; // Composite unique key
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  unit_price: number;
  qty: number;
  modifiers: CartModifier[];
  modifiers_total: number;
  note: string;
  image_url?: string | null;
}

interface CartState {
  items: CartItem[];
  orderType: OrderType;
  channel: OrderChannel;
  tableNo: string;
  customerId: string | null;
  customerName: string;
  discountId: string | null;
  orderNote: string;

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  updateItemNote: (id: string, note: string) => void;
  setOrderType: (type: OrderType) => void;
  setChannel: (channel: OrderChannel) => void;
  setTableNo: (tableNo: string) => void;
  setCustomer: (id: string | null, name: string) => void;
  setDiscountId: (id: string | null) => void;
  setOrderNote: (note: string) => void;
  clearCart: () => void;
}

export function generateCartItemId(
  productId: string,
  variantId: string | null,
  modifiers: CartModifier[],
  note: string
): string {
  const modIds = modifiers.map((m) => m.modifier_id).sort().join(",");
  const cleanNote = note.trim().toLowerCase();
  return `${productId}_${variantId || "base"}_${modIds}_${cleanNote}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: "take_away",
      channel: "walk_in",
      tableNo: "",
      customerId: null,
      customerName: "",
      discountId: null,
      orderNote: "",

      addItem: (itemData) => {
        const id = generateCartItemId(
          itemData.product_id,
          itemData.variant_id,
          itemData.modifiers,
          itemData.note
        );

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((it) => it.id === id);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].qty += itemData.qty;
          set({ items: updated });
        } else {
          set({ items: [...currentItems, { ...itemData, id }] });
        }
      },

      updateQty: (id, delta) => {
        const updated = get()
          .items.map((it) => {
            if (it.id === id) {
              const newQty = it.qty + delta;
              return newQty > 0 ? { ...it, qty: newQty } : null;
            }
            return it;
          })
          .filter(Boolean) as CartItem[];

        set({ items: updated });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((it) => it.id !== id) });
      },

      updateItemNote: (id, note) => {
        set({
          items: get().items.map((it) => (it.id === id ? { ...it, note } : it)),
        });
      },

      setOrderType: (orderType) => set({ orderType }),
      setChannel: (channel) => set({ channel }),
      setTableNo: (tableNo) => set({ tableNo }),
      setCustomer: (customerId, customerName) => set({ customerId, customerName }),
      setDiscountId: (discountId) => set({ discountId }),
      setOrderNote: (orderNote) => set({ orderNote }),
      clearCart: () =>
        set({
          items: [],
          orderType: "take_away",
          channel: "walk_in",
          tableNo: "",
          customerId: null,
          customerName: "",
          discountId: null,
          orderNote: "",
        }),
    }),
    {
      name: "cheese_drink_pos_cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
