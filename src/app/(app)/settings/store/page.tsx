"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStoreSettingsAction,
  updateStoreSettingsAction,
  updateOwnerVoidPinAction,
} from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Shield, KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { StoreSettingsFormData } from "@/lib/validators/settings.schema";
import type { Database } from "@/types/database.types";

type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];

function SettingsForm({ initialSettings }: { initialSettings: StoreSettings | null }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<StoreSettingsFormData>(() => ({
    store_name: initialSettings?.store_name || "Cheese Drink",
    tagline: initialSettings?.tagline || "",
    address: initialSettings?.address || "",
    phone: initialSettings?.phone || "",
    instagram: initialSettings?.instagram || "",
    receipt_header: initialSettings?.receipt_header || "",
    receipt_footer: initialSettings?.receipt_footer || "Terima kasih sudah jajan di Cheese Drink!",
    receipt_paper_width: (initialSettings?.receipt_paper_width as 58 | 80) || 58,
    show_logo_on_receipt: initialSettings?.show_logo_on_receipt ?? true,
    tax_enabled: initialSettings?.tax_enabled ?? false,
    tax_percent: Number(initialSettings?.tax_percent || 0),
    tax_inclusive: initialSettings?.tax_inclusive ?? false,
    service_enabled: initialSettings?.service_enabled ?? false,
    service_percent: Number(initialSettings?.service_percent || 0),
    rounding_unit: initialSettings?.rounding_unit ?? 100,
    order_prefix: initialSettings?.order_prefix || "CD",
    low_stock_default: initialSettings?.low_stock_default ?? 10,
    require_owner_pin_for_void: initialSettings?.require_owner_pin_for_void ?? true,
  }));

  const updateMutation = useMutation({
    mutationFn: (data: StoreSettingsFormData) => updateStoreSettingsAction(data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal menyimpan pengaturan");
      toast.success("Pengaturan toko berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["store_settings"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identitas Toko */}
      <Card>
        <CardHeader>
          <CardTitle>Identitas Toko</CardTitle>
          <CardDescription>Informasi yang dicetak pada struk transaksi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-name">Nama Toko</Label>
              <Input
                id="st-name"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-tagline">Tagline Toko</Label>
              <Input
                id="st-tagline"
                value={formData.tagline || ""}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Contoh: Aneka Dimsum & Minuman Cheese Gurih"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-address">Alamat Gerai</Label>
              <Input
                id="st-address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Contoh: Jl. Tebet Raya No. 45, Jakarta Selatan"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="st-phone">Nomor Telepon / WhatsApp</Label>
              <Input
                id="st-phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812-9876-5432"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="st-ig">Instagram Toko</Label>
              <Input
                id="st-ig"
                value={formData.instagram || ""}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@cheesedrink.id"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pajak, Service & Pembulatan */}
      <Card>
        <CardHeader>
          <CardTitle>Pajak, Service Charge & Pembulatan Kas</CardTitle>
          <CardDescription>
            Aturan perhitungan keuangan final yang dijalankan di level database (RPC)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pajak */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tax_enabled}
                onChange={(e) => setFormData({ ...formData, tax_enabled: e.target.checked })}
                className="rounded h-4 w-4 text-amber-500"
              />
              Aktifkan Pajak (PB1 / Restoran)
            </label>

            {formData.tax_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="st-taxp">Persentase Pajak (%)</Label>
                  <Input
                    id="st-taxp"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.tax_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax_percent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="st-taxi">Metode Pajak</Label>
                  <select
                    id="st-taxi"
                    value={formData.tax_inclusive ? "inclusive" : "exclusive"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax_inclusive: e.target.value === "inclusive",
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                  >
                    <option value="exclusive">Eksklusif (Pajak Ditambahkan ke Subtotal)</option>
                    <option value="inclusive">Inklusif (Harga Menu Sudah Termasuk Pajak)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Service Charge */}
          <div className="space-y-3 border-t border-stone-100 dark:border-stone-800 pt-4">
            <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.service_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, service_enabled: e.target.checked })
                }
                className="rounded h-4 w-4 text-amber-500"
              />
              Aktifkan Biaya Layanan (Service Charge)
            </label>

            {formData.service_enabled && (
              <div className="pl-6 pt-1 max-w-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="st-svc">Persentase Service (%)</Label>
                  <Input
                    id="st-svc"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.service_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_percent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pembulatan Kas */}
          <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="st-rnd">Pembulatan Nilai Tunai (Kelipatan Rupiah)</Label>
                <select
                  id="st-rnd"
                  value={formData.rounding_unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rounding_unit: parseInt(e.target.value) || 0,
                    })
                  }
                  className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                >
                  <option value="100">Dibulatkan ke Rp 100 terdekat (Standar F&B)</option>
                  <option value="500">Dibulatkan ke Rp 500 terdekat</option>
                  <option value="1000">Dibulatkan ke Rp 1.000 terdekat</option>
                  <option value="0">Tanpa Pembulatan (0)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="st-pfx">Prefix Nomor Struk</Label>
                <Input
                  id="st-pfx"
                  value={formData.order_prefix}
                  onChange={(e) => setFormData({ ...formData, order_prefix: e.target.value })}
                  placeholder="CD"
                  maxLength={5}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Struk & Printer */}
      <Card>
        <CardHeader>
          <CardTitle>Struk Termal & Footer</CardTitle>
          <CardDescription>Pengaturan ukuran kertas dan pesan penutup struk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="st-paper">Ukuran Lebar Kertas Printer</Label>
              <select
                id="st-paper"
                value={formData.receipt_paper_width}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    receipt_paper_width: parseInt(e.target.value) as 58 | 80,
                  })
                }
                className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
              >
                <option value="58">58 mm (Printer Mini / Mobile Bluetooth)</option>
                <option value="80">80 mm (Printer Desktop Kasir Besar)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-ftr">Pesan Footer Struk</Label>
              <Input
                id="st-ftr"
                value={formData.receipt_footer || ""}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                placeholder="Terima kasih sudah jajan di Cheese Drink!"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tombol Simpan Pengaturan */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="gap-2 font-bold px-8 h-12 shadow-lg shadow-amber-500/20"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Pengaturan Toko
        </Button>
      </div>
    </form>
  );
}

export default function StoreSettingsPage() {
  const [pinForm, setPinForm] = useState({ pin: "", confirmPin: "" });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store_settings"],
    queryFn: () => getStoreSettingsAction(),
  });

  const pinMutation = useMutation({
    mutationFn: (pin: string) => updateOwnerVoidPinAction(pin),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal memperbarui PIN");
      toast.success("PIN Owner untuk Void berhasil diatur!");
      setPinForm({ pin: "", confirmPin: "" });
    },
  });

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinForm.pin.length < 4 || pinForm.pin.length > 8) {
      return toast.error("PIN harus terdiri dari 4-8 digit angka");
    }
    if (pinForm.pin !== pinForm.confirmPin) {
      return toast.error("Konfirmasi PIN tidak cocok");
    }
    pinMutation.mutate(pinForm.pin);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-stone-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
          <Settings className="h-8 w-8 text-amber-500" />
          Pengaturan Toko & Operasional
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Atur identitas UMKM, pajak, service charge, pembulatan uang, dan keamanan PIN void
        </p>
      </div>

      <SettingsForm key={settings?.updated_at || "default"} initialSettings={settings || null} />

      {/* Keamanan: Atur PIN Void Owner */}
      <Card className="border-amber-200 dark:border-stone-800">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
            <Shield className="h-5 w-5" />
            <span>Keamanan Otorisasi Void Kasir</span>
          </div>
          <CardTitle>PIN Otorisasi Pembatalan (Void) Transaksi</CardTitle>
          <CardDescription>
            Kasir memerlukan PIN Owner ini ketika membatalkan transaksi yang telah selesai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePinSubmit} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="st-pin">PIN Owner Baru (4 - 8 Angka)</Label>
              <Input
                id="st-pin"
                type="password"
                maxLength={8}
                value={pinForm.pin}
                onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value.replace(/\D/g, "") })}
                placeholder="••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="st-cpin">Konfirmasi PIN Owner Baru</Label>
              <Input
                id="st-cpin"
                type="password"
                maxLength={8}
                value={pinForm.confirmPin}
                onChange={(e) =>
                  setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, "") })
                }
                placeholder="••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              disabled={pinMutation.isPending}
              className="font-bold gap-2"
            >
              {pinMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              Perbarui PIN Void Owner
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
