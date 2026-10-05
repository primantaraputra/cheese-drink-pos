"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNo: string;
  isOwner: boolean;
  onConfirmVoid: (reason: string, pin?: string) => Promise<void>;
  isLoading?: boolean;
}

export function VoidDialog({
  open,
  onOpenChange,
  orderNo,
  isOwner,
  onConfirmVoid,
  isLoading = false,
}: VoidDialogProps) {
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      toast.error("Alasan pembatalan wajib diisi minimal 5 karakter");
      return;
    }

    if (!isOwner && pin.trim().length < 4) {
      toast.error("PIN Owner wajib diisi (minimal 4 digit)");
      return;
    }

    await onConfirmVoid(reason.trim(), pin.trim());
    setReason("");
    setPin("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Batalkan Pesanan (Void)
            </DialogTitle>
            <DialogDescription>
              Pesanan <strong>{orderNo}</strong> akan dibatalkan. Stok produk dan bahan baku akan dikembalikan secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="void-reason">Alasan Pembatalan (Wajib)</Label>
              <Input
                id="void-reason"
                placeholder="Contoh: Salah input pesanan oleh pelanggan, salah bayar"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                minLength={5}
                disabled={isLoading}
              />
              <p className="text-[11px] text-stone-500">Minimal 5 karakter</p>
            </div>

            {!isOwner && (
              <div className="space-y-1.5">
                <Label htmlFor="owner-pin" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  PIN Otorisasi Pemilik (Owner)
                </Label>
                <Input
                  id="owner-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Masukkan 4-8 digit PIN Owner"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <p className="text-[11px] text-stone-500">
                  Pembatalan transaksi oleh kasir memerlukan otorisasi pemilik.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || reason.trim().length < 5 || (!isOwner && pin.trim().length < 4)}
              className="gap-2 font-bold"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Konfirmasi Void
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
