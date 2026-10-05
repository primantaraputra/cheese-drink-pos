"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatIDR, parseIDR } from "@/lib/utils/currency";
import { calculateChange } from "@/lib/utils/calc";
import {
  Banknote,
  QrCode,
  Loader2,
  CheckCircle2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { PaymentMethod } from "@/types/database.types";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onProcessPayment: (payments: { method: PaymentMethod; amount: number; reference_no?: string }[]) => void;
  isProcessing: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onProcessPayment,
  isProcessing,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "qris">("cash");
  const [cashInputValue, setCashInputValue] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

  const cashAmount = useMemo(() => {
    return parseIDR(cashInputValue);
  }, [cashInputValue]);

  // Kalkulasi kembalian
  const { changeAmount, isUnderpaid } = useMemo(() => {
    if (selectedMethod === "cash") {
      const res = calculateChange(total, cashAmount, 0);
      return {
        changeAmount: res.changeAmount,
        isUnderpaid: res.isUnderpaid,
      };
    }
    return {
      changeAmount: 0,
      isUnderpaid: false,
    };
  }, [total, selectedMethod, cashAmount]);

  // Numpad handlers
  const handleNumpadPress = (val: string) => {
    if (val === "C") {
      setCashInputValue("");
    } else if (val === "DEL") {
      setCashInputValue((prev) => prev.slice(0, -1));
    } else {
      setCashInputValue((prev) => prev + val);
    }
  };

  const handleQuickCash = (amount: number) => {
    setCashInputValue(amount.toString());
  };

  const handleExactCash = () => {
    setCashInputValue(total.toString());
  };

  const handleComplete = () => {
    if (selectedMethod === "cash") {
      if (isUnderpaid) {
        return toast.error("Nominal tunai masih kurang dari total tagihan");
      }
      onProcessPayment([{ method: "cash", amount: cashAmount }]);
    } else {
      onProcessPayment([
        { method: "qris", amount: total, reference_no: referenceNo || undefined },
      ]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="text-left pb-2 border-b border-stone-100 dark:border-stone-800">
          <DialogTitle className="text-xl font-black">
            Pembayaran Kasir
          </DialogTitle>
        </DialogHeader>

        {/* Big Total Tagihan */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl flex items-center justify-between my-1">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Total Tagihan
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-200">
              {formatIDR(total)}
            </div>
          </div>
        </div>

        {/* Pilihan Metode Pembayaran: Tunai & QRIS */}
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
              Metode Pembayaran
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod("cash");
                  if (!cashInputValue) setCashInputValue(total.toString());
                }}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border transition-all ${
                  selectedMethod === "cash"
                    ? "border-amber-500 bg-amber-500 text-amber-950 font-black shadow-md shadow-amber-500/20"
                    : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 font-bold"
                }`}
              >
                <Banknote className="h-5 w-5" />
                <span className="text-sm">Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMethod("qris");
                }}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border transition-all ${
                  selectedMethod === "qris"
                    ? "border-amber-500 bg-amber-500 text-amber-950 font-black shadow-md shadow-amber-500/20"
                    : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 font-bold"
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span className="text-sm">QRIS</span>
              </button>
            </div>
          </div>

          {/* Mode Tunai */}
          {selectedMethod === "cash" && (
            <div className="space-y-3 bg-stone-50 dark:bg-stone-900/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Uang Diterima</span>
                <span className="text-xl font-black text-stone-900 dark:text-stone-100 font-mono">
                  {cashAmount > 0 ? formatIDR(cashAmount) : "Rp 0"}
                </span>
              </div>

              {/* Preset Pecahan Uang Cepat */}
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExactCash}
                  className="text-xs font-bold bg-white dark:bg-stone-800 h-9"
                >
                  Uang Pas
                </Button>
                {[20000, 50000, 100000].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickCash(amt)}
                    className="text-xs font-bold bg-white dark:bg-stone-800 h-9"
                  >
                    {formatIDR(amt)}
                  </Button>
                ))}
              </div>

              {/* Numpad Virtual */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "00"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadPress(key)}
                    className="h-11 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-extrabold text-base text-stone-800 dark:text-stone-200 hover:bg-amber-50 active:scale-95 transition-all shadow-2xs"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Kembalian Realtime */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 mt-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    Kembalian Tunai
                  </span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatIDR(changeAmount)}
                  </div>
                </div>
                {changeAmount > 0 && (
                  <div className="text-xs font-medium text-stone-400 text-right">
                    Kembalikan uang fisik
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode QRIS */}
          {selectedMethod === "qris" && (
            <div className="space-y-3 bg-stone-50 dark:bg-stone-900/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
                <Check className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-xs font-medium leading-relaxed">
                  Tunjukkan barcode QRIS warung ke pelanggan. Pastikan notifikasi dana masuk sudah diterima sebelum menyelesaikan.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-stone-500">
                  Nomor Referensi / RRN (Opsional)
                </span>
                <input
                  type="text"
                  placeholder="Contoh: No. RRN / Kode transaksi QRIS"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs dark:border-stone-700 dark:bg-stone-900"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-stone-100 dark:border-stone-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isProcessing || (selectedMethod === "cash" && isUnderpaid)}
            className="font-black text-base h-12 flex-1 shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-amber-950"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Selesaikan Pembayaran
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
