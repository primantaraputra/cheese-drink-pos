"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils/currency";
import { formatQueueNo } from "@/lib/utils/order-number";
import { CheckCircle2, Printer, Share2, PlusCircle } from "lucide-react";

interface OrderSuccessDialogProps {
  open: boolean;
  orderData: {
    order_id: string;
    order_no: string;
    queue_no: number;
    total: number;
    change_amount: number;
  } | null;
  onNewTransaction: () => void;
  onPrintReceipt: () => void;
}

export function OrderSuccessDialog({
  open,
  orderData,
  onNewTransaction,
  onPrintReceipt,
}: OrderSuccessDialogProps) {
  if (!orderData) return null;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*CHEESE DRINK*\n` +
      `No. Pesanan: ${orderData.order_no}\n` +
      `No. Antrean: ${formatQueueNo(orderData.queue_no)}\n` +
      `Total Belanja: ${formatIDR(orderData.total)}\n` +
      `Kembalian: ${formatIDR(orderData.change_amount)}\n\n` +
      `Terima kasih sudah jajan di Cheese Drink!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md text-center p-6 sm:p-8">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="h-10 w-10 animate-in zoom-in-50 duration-200" />
          </div>
          <DialogTitle className="text-2xl font-black text-stone-900 dark:text-stone-100">
            Transaksi Selesai!
          </DialogTitle>
          <p className="text-stone-500 text-xs font-mono">{orderData.order_no}</p>
        </DialogHeader>

        {/* Big Queue Number */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 my-4">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest block">
            Nomor Antrean
          </span>
          <div className="text-5xl font-black text-amber-950 dark:text-amber-200 tracking-tight my-1">
            {formatQueueNo(orderData.queue_no)}
          </div>
          <div className="text-xs text-amber-700/80 dark:text-amber-400/80">
            Panggil nomor ini saat pesanan dimsum & minuman siap
          </div>
        </div>

        {/* Kembalian */}
        {orderData.change_amount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-sm mb-4">
            <span className="font-semibold text-stone-600 dark:text-stone-300">
              Kembalian Tunai:
            </span>
            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
              {formatIDR(orderData.change_amount)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrintReceipt}
            className="h-12 font-bold gap-2 rounded-xl"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleShareWhatsApp}
            className="h-12 font-bold gap-2 rounded-xl text-emerald-700 dark:text-emerald-400 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Share2 className="h-4 w-4" />
            Kirim WA
          </Button>
        </div>

        <Button
          type="button"
          onClick={onNewTransaction}
          className="w-full h-12 font-bold text-base mt-2 shadow-lg shadow-amber-500/20 rounded-xl gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Transaksi Baru
        </Button>
      </DialogContent>
    </Dialog>
  );
}
