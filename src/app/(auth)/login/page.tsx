"use client";

import { useActionState, useState } from "react";
import { loginAction, quickDemoLoginAction, type ActionResult } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Sparkles, UserCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameInput, setUsernameInput] = useState("owner");
  const [passwordInput, setPasswordInput] = useState("kasir123");
  const [quickLoading, setQuickLoading] = useState<"owner" | "cashier" | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const res = await loginAction(prev, formData);
      if (res.ok && res.data?.role) {
        document.cookie = `demo_user=${res.data.role}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem("user_role", res.data.role);
        toast.success("Login berhasil! Mengalihkan ke sistem...");
        const target = res.data.role === "owner" ? "/dashboard" : "/pos";
        window.location.replace(target);
      }
      return res;
    },
    null
  );

  const handleQuickLogin = async (role: "owner" | "cashier") => {
    try {
      setQuickLoading(role);
      document.cookie = `demo_user=${role}; path=/; max-age=604800; SameSite=Lax`;
      localStorage.setItem("user_role", role);
      const res = await quickDemoLoginAction(role);
      if (res.ok) {
        toast.success(`Berhasil masuk sebagai ${role === "owner" ? "Owner" : "Kasir"}!`);
        const target = role === "owner" ? "/dashboard" : "/pos";
        window.location.replace(target);
      } else {
        toast.error("Gagal masuk. Coba masukkan form manual.");
        setQuickLoading(null);
      }
    } catch {
      // Fallback redirect jika ada delay
      document.cookie = `demo_user=${role}; path=/; max-age=604800; SameSite=Lax`;
      const target = role === "owner" ? "/dashboard" : "/pos";
      window.location.replace(target);
    }
  };

  return (
    <Card className="border-amber-200/60 dark:border-stone-800 shadow-xl shadow-amber-500/5">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-amber-950 shadow-md shadow-amber-500/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <CardTitle className="text-2xl font-black tracking-tight text-amber-950 dark:text-amber-400">
            Cheese Drink POS
          </CardTitle>
          <CardDescription className="text-stone-500 text-sm mt-1">
            Kasir Dimsum Gurih & Aneka Minuman Keju
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Instant 1-Click Login Section */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Masuk Cepat 1-Klik (Mode Demo):</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || quickLoading !== null}
              onClick={() => handleQuickLogin("owner")}
              className="h-11 bg-white dark:bg-stone-800 border-amber-300 hover:bg-amber-50 hover:border-amber-400 text-amber-950 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {quickLoading === "owner" ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              )}
              Masuk Owner
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || quickLoading !== null}
              onClick={() => handleQuickLogin("cashier")}
              className="h-11 bg-white dark:bg-stone-800 border-stone-300 hover:bg-stone-50 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {quickLoading === "cashier" ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
              ) : (
                <UserCheck className="w-4 h-4 text-stone-600" />
              )}
              Masuk Kasir
            </Button>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center">
            Klik tombol di atas untuk langsung masuk tanpa perlu mengetik sandi.
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
          <span className="bg-white dark:bg-stone-900 px-3 text-xs text-stone-400 uppercase font-semibold tracking-wider absolute">
            Atau Ketik Manual
          </span>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="p-3.5 text-sm rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-medium">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Username atau Email</Label>
            <Input
              id="email"
              name="email"
              type="text"
              placeholder="owner atau kasir"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isPending || quickLoading !== null}
            />
            <p className="text-[11px] text-stone-400">
              Bisa ketik <strong>owner</strong> atau <strong>kasir</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                disabled={isPending || quickLoading !== null}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2 font-bold text-base h-12 bg-amber-500 hover:bg-amber-600 text-amber-950"
            disabled={isPending || quickLoading !== null}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Masuk ke Sistem...
              </>
            ) : (
              "Masuk Sekarang"
            )}
          </Button>

          <p className="text-center text-xs text-stone-400 dark:text-stone-500 pt-1">
            Belum memiliki akun? Hubungi Pemilik Toko untuk pendaftaran staf kasir.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
