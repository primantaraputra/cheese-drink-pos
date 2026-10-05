"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreSettingsAction, updateStoreSettingsAction } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, type ReceiptData } from "@/components/orders/receipt";
import { Printer, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";

type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];

export default function ReceiptSettingsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["store_settings"],
    queryFn: () => getStoreSettingsAction(),
  });

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-12 text-stone-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <ReceiptSettingsForm settings={settings} />;
}

function ReceiptSettingsForm({ settings }: { settings: StoreSettings }) {
  const queryClient = useQueryClient();

  const [header, setHeader] = useState(settings.receipt_header || "");
  const [footer, setFooter] = useState(
    settings.receipt_footer || "Terima kasih sudah jajan di Cheese Drink!"
  );
  const [paperWidth, setPaperWidth] = useState<number>(settings.receipt_paper_width || 58);
  const [showLogo, setShowLogo] = useState(settings.show_logo_on_receipt ?? true);

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) => updateStoreSettingsAction(data),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal menyimpan pengaturan struk");
        return;
      }
      toast.success("Pengaturan struk berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ["store_settings"] });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      store_name: settings.store_name,
      tagline: settings.tagline,
      address: settings.address,
      phone: settings.phone,
      receipt_header: header,
      receipt_footer: footer,
      receipt_paper_width: paperWidth,
      show_logo_on_receipt: showLogo,
      tax_enabled: settings.tax_enabled,
      tax_percent: settings.tax_percent,
      tax_inclusive: settings.tax_inclusive,
      service_enabled: settings.service_enabled,
      service_percent: settings.service_percent,
      rounding_unit: settings.rounding_unit,
      order_prefix: settings.order_prefix,
      low_stock_default: settings.low_stock_default,
      require_owner_pin_for_void: settings.require_owner_pin_for_void,
    });
  };

  // Mock data untuk live preview struk
  const dummyReceiptData: ReceiptData = {
    order_no: "CD-261002-0042",
    queue_no: 15,
    created_at: new Date().toISOString(),
    order_type: "take_away",
    table_no: null,
    customer_name: "Budi Santoso",
    cashier_name: "Siti Rahma",
    items: [
      {
        id: "1",
        product_name: "Siomay Dimsum Ayam",
        variant_name: "Isi 5",
        qty: 2,
        unit_price: 25000,
        subtotal: 50000,
        modifiers: [{ modifier_name: "Saus Mentai", price_delta: 2000 }],
      },
      {
        id: "2",
        product_name: "Cheese Tea Signature",
        variant_name: "Large",
        qty: 1,
        unit_price: 18000,
        subtotal: 18000,
        modifiers: [{ modifier_name: "Less Sugar", price_delta: 0 }],
      },
    ],
    subtotal: 68000,
    discount_amount: 5000,
    service_amount: 0,
    tax_amount: 0,
    rounding_amount: 0,
    total: 63000,
    paid_amount: 100000,
    change_amount: 37000,
    payments: [{ method: "cash", amount: 100000 }],
    note: "Saus dipisah",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
          <Printer className="h-8 w-8 text-amber-500" />
          Pengaturan Struk Kasir
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Sesuaikan format struk termal 58mm atau 80mm, pesan header/footer, dan lihat pratinjau langsung
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Pengaturan (Kolom Kiri - 7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Format Struk Pembelian</CardTitle>
            <CardDescription>
              Tampilan struk akan otomatis disesuaikan dengan printer termal Bluetooth/USB Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="paper-width">Lebar Kertas Thermal Printer</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaperWidth(58)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                      paperWidth === 58
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 ring-2 ring-amber-500"
                        : "border-stone-200 dark:border-stone-800 text-stone-600"
                    }`}
                  >
                    <span>58 mm (Standar POS Mobile)</span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      Cocok untuk printer portabel kecil
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth(80)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                      paperWidth === 80
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 ring-2 ring-amber-500"
                        : "border-stone-200 dark:border-stone-800 text-stone-600"
                    }`}
                  >
                    <span>80 mm (Desktop POS)</span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      Kertas lebar, teks lebih leluasa
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receipt-header">Header Tambahan Struk</Label>
                <Input
                  id="receipt-header"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder="Contoh: Buka Setiap Hari 10:00 - 22:00 WIB"
                />
                <p className="text-[11px] text-stone-500">
                  Teks yang muncul di bawah nama toko pada bagian atas struk.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receipt-footer">Pesan Penutup (Footer) Struk</Label>
                <Input
                  id="receipt-footer"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Contoh: Terima kasih sudah jajan di Cheese Drink!"
                />
                <p className="text-[11px] text-stone-500">
                  Teks yang dicetak di bagian paling bawah struk belanja.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded text-amber-500 h-4 w-4"
                  />
                  Tampilkan Logo Toko pada Struk
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="gap-2 font-bold shadow-md shadow-amber-500/20"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Simpan Format Struk
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview Struk (Kolom Kanan - 5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Pratinjau Langsung (Live Preview)
            </span>
            <span className="text-xs font-bold text-amber-600">{paperWidth} mm</span>
          </div>

          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-100 dark:bg-stone-900/60 shadow-inner w-full flex justify-center">
            <Receipt
              data={dummyReceiptData}
              settings={{
                store_name: settings.store_name,
                tagline: settings.tagline,
                address: settings.address,
                phone: settings.phone,
                receipt_header: header,
                receipt_footer: footer,
                receipt_paper_width: paperWidth,
                show_logo_on_receipt: showLogo,
              }}
              showActions={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
