"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrdersAction, getOrderDetailsAction, voidOrderAction } from "@/actions/order.actions";
import { getStoreSettingsAction } from "@/actions/settings.actions";
import { getUsersListAction } from "@/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt as ReceiptComponent, type ReceiptData } from "@/components/orders/receipt";
import { VoidDialog } from "@/components/orders/void-dialog";
import { formatIDR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Search,
  Filter,
  ReceiptText,
  Eye,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/database.types";

export default function OrdersPage() {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [cashierId, setCashierId] = useState<string>("");
  const [datePreset, setDatePreset] = useState<string>("today");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Selected Order for Detail / Receipt / Void
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [orderToVoid, setOrderToVoid] = useState<{ id: string; order_no: string } | null>(null);

  // Compute date range based on preset
  const getDateRange = () => {
    const today = new Date();
    const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

    if (datePreset === "today") {
      const s = formatDateStr(today);
      return { startDate: s, endDate: s };
    }
    if (datePreset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const s = formatDateStr(y);
      return { startDate: s, endDate: s };
    }
    if (datePreset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      return { startDate: formatDateStr(past), endDate: formatDateStr(today) };
    }
    if (datePreset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      return { startDate: formatDateStr(past), endDate: formatDateStr(today) };
    }
    return { startDate: undefined, endDate: undefined };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch Orders
  const { data: ordersResult, isLoading } = useQuery({
    queryKey: ["orders_list", { page, search, status, cashierId, startDate, endDate }],
    queryFn: () =>
      getOrdersAction({
        page,
        limit,
        search: search.trim() || undefined,
        status,
        cashierId: cashierId || undefined,
        startDate,
        endDate,
      }),
  });

  const orders = ordersResult?.data || [];
  const totalOrders = ordersResult?.total || 0;
  const totalPages = Math.ceil(totalOrders / limit) || 1;

  // Store Settings & Users
  const { data: storeSettings } = useQuery({
    queryKey: ["store_settings"],
    queryFn: () => getStoreSettingsAction(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users_list"],
    queryFn: () => getUsersListAction(),
  });

  // Selected Order Detail Query
  const { data: orderDetailResult, isLoading: detailLoading } = useQuery({
    queryKey: ["order_detail", selectedOrderId],
    queryFn: () => (selectedOrderId ? getOrderDetailsAction(selectedOrderId) : null),
    enabled: Boolean(selectedOrderId),
  });

  const selectedOrder = orderDetailResult?.data;

  // Void Mutation
  const voidMutation = useMutation({
    mutationFn: ({ orderId, reason, pin }: { orderId: string; reason: string; pin?: string }) =>
      voidOrderAction(orderId, reason, pin),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Gagal membatalkan pesanan");
        return;
      }
      toast.success("Pesanan berhasil dibatalkan (void)");
      setVoidDialogOpen(false);
      setDetailDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orders_list"] });
      queryClient.invalidateQueries({ queryKey: ["order_detail"] });
    },
  });

  // Convert selectedOrder to ReceiptData
  const receiptData: ReceiptData | null = selectedOrder
    ? {
        order_no: selectedOrder.order_no,
        queue_no: selectedOrder.queue_no,
        created_at: selectedOrder.created_at,
        order_type: selectedOrder.order_type,
        table_no: selectedOrder.table_no,
        customer_name: selectedOrder.customer_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cashier_name: (selectedOrder as any).cashier?.full_name || "Kasir",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: ((selectedOrder as any).items || []).map((it: any) => ({
          id: it.id,
          product_name: it.product_name,
          variant_name: it.variant_name,
          qty: it.qty,
          unit_price: it.unit_price,
          subtotal: it.subtotal,
          note: it.note,
          modifiers: (it.modifiers || []).map((m: { modifier_name: string; price_delta: number }) => ({
            modifier_name: m.modifier_name,
            price_delta: m.price_delta,
          })),
        })),
        subtotal: selectedOrder.subtotal,
        discount_amount: selectedOrder.discount_amount,
        service_amount: selectedOrder.service_amount,
        tax_amount: selectedOrder.tax_amount,
        rounding_amount: selectedOrder.rounding_amount,
        total: selectedOrder.total,
        paid_amount: selectedOrder.paid_amount,
        change_amount: selectedOrder.change_amount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payments: ((selectedOrder as any).payments || []).map((p: any) => ({
          method: p.method,
          amount: p.amount,
          reference_no: p.reference_no,
        })),
        note: selectedOrder.note,
        is_copy: true,
      }
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <ReceiptText className="h-8 w-8 text-amber-500" />
            Riwayat Pesanan & Transaksi
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Pantau seluruh riwayat transaksi masuk, cetak ulang struk, dan batalkan (void) pesanan
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Cari No. Struk atau Pelanggan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10 text-sm"
              />
            </div>

            {/* Date Preset Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-stone-400 shrink-0" />
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold dark:border-stone-800 dark:bg-stone-900"
              >
                <option value="today">Hari Ini</option>
                <option value="yesterday">Kemarin</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-stone-400 shrink-0" />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as OrderStatus | "all");
                  setPage(1);
                }}
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold dark:border-stone-800 dark:bg-stone-900"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Selesai (Completed)</option>
                <option value="void">Dibatalkan (Void)</option>
                <option value="held">Diparkir (Held)</option>
              </select>
            </div>

            {/* Cashier Filter */}
            <div>
              <select
                value={cashierId}
                onChange={(e) => {
                  setCashierId(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold dark:border-stone-800 dark:bg-stone-900"
              >
                <option value="">Semua Kasir</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Transaksi</CardTitle>
            <CardDescription>
              Menampilkan {orders.length} dari {totalOrders} transaksi
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Tidak ada transaksi"
              description="Tidak ditemukan riwayat pesanan dengan filter yang dipilih."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                    <th className="py-3 px-3">No. Struk</th>
                    <th className="py-3 px-3">Antrean</th>
                    <th className="py-3 px-3">Waktu (WIB)</th>
                    <th className="py-3 px-3">Kasir</th>
                    <th className="py-3 px-3">Tipe</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedOrderId(o.id);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                        {o.order_no}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-black text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg text-xs">
                          #{o.queue_no}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-500">
                        {formatDate(o.created_at, "dd/MM/yy HH:mm")}
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-stone-700 dark:text-stone-300">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(o as any).cashier?.full_name || "-"}
                      </td>
                      <td className="py-3 px-3 text-xs capitalize text-stone-600">
                        {o.order_type.replace("_", " ")}
                      </td>
                      <td className="py-3 px-3">
                        {o.status === "completed" && (
                          <Badge variant="success">Selesai</Badge>
                        )}
                        {o.status === "void" && (
                          <Badge variant="destructive">Void</Badge>
                        )}
                        {o.status === "held" && (
                          <Badge variant="warning">Parkir</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                        {formatIDR(o.total)}
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-600 hover:text-amber-600"
                            onClick={() => {
                              setSelectedOrderId(o.id);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {o.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-stone-400 hover:text-red-600"
                              onClick={() => {
                                setOrderToVoid({ id: o.id, order_no: o.order_no });
                                setVoidDialogOpen(true);
                              }}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-stone-100 dark:border-stone-800">
              <p className="text-xs text-stone-500">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 text-xs"
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detail Pesanan */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading || !selectedOrder ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Detail Pesanan {selectedOrder.order_no}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    {selectedOrder.status === "completed" && (
                      <Badge variant="success">Selesai</Badge>
                    )}
                    {selectedOrder.status === "void" && (
                      <Badge variant="destructive">Void</Badge>
                    )}
                    {selectedOrder.status === "held" && (
                      <Badge variant="warning">Parkir</Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Status Void Banner */}
              {selectedOrder.status === "void" && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3 text-red-700 dark:text-red-300 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Ban className="h-4 w-4" />
                    Transaksi ini telah dibatalkan (void)
                  </p>
                  <p>Alasan: {selectedOrder.void_reason}</p>
                  <p>
                    Dibatalkan pada: {formatDate(selectedOrder.voided_at, "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              )}

              {/* Info Utama */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl text-xs">
                <div>
                  <span className="text-stone-400 block">Antrean</span>
                  <span className="font-black text-amber-600 text-base">#{selectedOrder.queue_no}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Waktu</span>
                  <span className="font-semibold">{formatDate(selectedOrder.created_at, "dd/MM/yy HH:mm")}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Kasir</span>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <span className="font-semibold">{(selectedOrder as any).cashier?.full_name || "-"}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Tipe Pesanan</span>
                  <span className="font-semibold capitalize">{selectedOrder.order_type.replace("_", " ")}</span>
                </div>
              </div>

              {/* Daftar Item Pesanan */}
              <div>
                <h4 className="font-bold text-sm mb-2 text-stone-700 dark:text-stone-300">
                  Rincian Item
                </h4>
                <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {((selectedOrder as any).items || []).map((it: any) => (
                    <div key={it.id} className="p-3 text-xs flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm">
                          {it.product_name}
                          {it.variant_name && (
                            <span className="text-xs font-normal text-stone-500"> ({it.variant_name})</span>
                          )}
                        </div>
                        {it.modifiers && it.modifiers.length > 0 && (
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            + {it.modifiers.map((m: any) => `${m.modifier_name} (${formatIDR(m.price_delta)})`).join(", ")}
                          </div>
                        )}
                        {it.note && (
                          <div className="text-[11px] italic text-amber-600 mt-0.5">
                            Catatan: {it.note}
                          </div>
                        )}
                        <div className="text-stone-500 mt-1">
                          {it.qty} x {formatIDR(it.unit_price)}
                        </div>
                      </div>
                      <span className="font-bold text-sm">{formatIDR(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rincian Finansial */}
              <div className="space-y-1.5 text-xs bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal</span>
                  <span>{formatIDR(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Diskon</span>
                    <span>-{formatIDR(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                {selectedOrder.service_amount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Biaya Layanan</span>
                    <span>{formatIDR(selectedOrder.service_amount)}</span>
                  </div>
                )}
                {selectedOrder.tax_amount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Pajak (PPN)</span>
                    <span>{formatIDR(selectedOrder.tax_amount)}</span>
                  </div>
                )}
                {selectedOrder.rounding_amount !== 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Pembulatan Kasir</span>
                    <span>{formatIDR(selectedOrder.rounding_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base border-t border-stone-200 dark:border-stone-700 pt-2 mt-2">
                  <span>Total Tagihan</span>
                  <span className="text-amber-600">{formatIDR(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Dibayar</span>
                  <span>{formatIDR(selectedOrder.paid_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-800 dark:text-stone-200">
                  <span>Kembalian</span>
                  <span>{formatIDR(selectedOrder.change_amount)}</span>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {selectedOrder.status === "completed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2 font-bold"
                      onClick={() => {
                        setOrderToVoid({ id: selectedOrder.id, order_no: selectedOrder.order_no });
                        setVoidDialogOpen(true);
                      }}
                    >
                      <Ban className="h-4 w-4" />
                      Batalkan (Void)
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setReceiptDialogOpen(true)}
                  >
                    <Printer className="h-4 w-4" />
                    Lihat & Cetak Struk
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cetak Struk */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {receiptData && (
            <div className="py-2">
              <ReceiptComponent
                data={receiptData}
                settings={{
                  store_name: storeSettings?.store_name || "Cheese Drink",
                  tagline: storeSettings?.tagline,
                  address: storeSettings?.address,
                  phone: storeSettings?.phone,
                  receipt_header: storeSettings?.receipt_header,
                  receipt_footer: storeSettings?.receipt_footer,
                  receipt_paper_width: storeSettings?.receipt_paper_width || 58,
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Void Transaksi */}
      {orderToVoid && (
        <VoidDialog
          open={voidDialogOpen}
          onOpenChange={setVoidDialogOpen}
          orderNo={orderToVoid.order_no}
          isOwner={false} // Will ask for PIN if required
          isLoading={voidMutation.isPending}
          onConfirmVoid={async (reason, pin) => {
            await voidMutation.mutateAsync({
              orderId: orderToVoid.id,
              reason,
              pin,
            });
          }}
        />
      )}
    </div>
  );
}
