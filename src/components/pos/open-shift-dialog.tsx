"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/currency-input";
import { formatIDR } from "@/lib/utils/currency";
import { Clock, Loader2, Sparkles } from "lucide-react";

interface OpenShiftDialogProps {
  open: boolean;
  onOpenShift: (openingCash: number) => void;
  isLoading: boolean;
}

export function OpenShiftDialog({
  open,
  onOpenShift,
  isLoading,
}: OpenShiftDialogProps) {
  const [openingCash, setOpeningCash] = useState(100000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift(openingCash);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="text-center items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center mb-2 shadow-md shadow-amber-500/20">
              <Clock className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-black text-stone-900 dark:text-stone-100">
              Buka Shift Kasir
            </DialogTitle>
            <DialogDescription className="text-stone-500 text-xs mt-1">
              Masukkan modal uang awal di laci kasir sebelum memulai transaksi pelayanan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Modal Awal Laci Kasir (Rupiah)</Label>
            <CurrencyInput
              value={openingCash}
              onChange={(val) => setOpeningCash(val)}
              className="h-12 text-lg font-bold"
              required
            />
            <div className="flex gap-2 pt-1">
              {[50000, 100000, 200000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningCash(amt)}
                  className="flex-1 py-1.5 text-xs font-bold rounded-xl border border-stone-200 hover:bg-amber-50 dark:border-stone-700 dark:hover:bg-stone-800 transition-colors"
                >
                  {formatIDR(amt)}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 font-bold text-base shadow-lg shadow-amber-500/20 rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Membuka Shift...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Buka Shift & Mulai Kasir
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
