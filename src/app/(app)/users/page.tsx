"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsersListAction,
  createUserAction,
  toggleUserStatusAction,
} from "@/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils/date";
import { Plus, UserCheck, Shield, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CreateUserFormData } from "@/lib/validators/user.schema";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateUserFormData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "cashier",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users_list"],
    queryFn: () => getUsersListAction(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => createUserAction(data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal membuat akun kasir");
      toast.success("Akun kasir berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["users_list"] });
      setDialogOpen(false);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleUserStatusAction(id, is_active),
    onSuccess: () => {
      toast.success("Status akun berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["users_list"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return toast.error("Nama lengkap wajib diisi");
    if (!formData.email.trim()) return toast.error("Email wajib diisi");
    if (formData.password.length < 8) return toast.error("Kata sandi minimal 8 karakter");

    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-amber-500" />
            Kelola Akun Staf & Kasir
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Hanya Pemilik Toko (Owner) yang berwenang menambahkan dan mengelola akses kasir
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              full_name: "",
              email: "",
              phone: "",
              password: "",
              role: "cashier",
            });
            setDialogOpen(true);
          }}
          className="gap-2 font-bold shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Tambah Kasir Baru
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UserCheck}
                title="Belum ada akun terdaftar"
                description="Tambahkan kasir pertama Anda agar operasional transaksi dapat berjalan."
                actionLabel="Tambah Akun Kasir"
                onAction={() => setDialogOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold bg-stone-50/50 dark:bg-stone-800/40">
                    <th className="py-3.5 px-4">Nama Staf</th>
                    <th className="py-3.5 px-4">Peran (Role)</th>
                    <th className="py-3.5 px-4">Nomor HP</th>
                    <th className="py-3.5 px-4">Status Akun</th>
                    <th className="py-3.5 px-4">Tanggal Dibuat</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40">
                      <td className="py-4 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {user.full_name}
                      </td>
                      <td className="py-4 px-4">
                        {user.role === "owner" ? (
                          <Badge variant="default" className="gap-1 bg-amber-500 text-amber-950 font-bold">
                            <Shield className="h-3 w-3" />
                            Owner
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 font-semibold">
                            <User className="h-3 w-3" />
                            Kasir
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-stone-600 dark:text-stone-300">
                        {user.phone || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: user.id,
                              is_active: !user.is_active,
                            })
                          }
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            user.is_active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                          title="Klik untuk nonaktifkan/aktifkan"
                        >
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-500">
                        {formatDateTime(user.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-xs text-stone-400">
                          {user.is_active ? "Dapat Login" : "Diblokir"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Tambah Pengguna */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Tambah Akun Kasir / Staf</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="usr-name">Nama Lengkap</Label>
                <Input
                  id="usr-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Contoh: Rina Kasir Shift 1"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usr-email">Email Login</Label>
                <Input
                  id="usr-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rina@cheesedrink.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usr-phone">Nomor Telepon (Opsional)</Label>
                <Input
                  id="usr-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08123456789"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usr-pwd">Kata Sandi Awal (Min. 8 Karakter)</Label>
                <Input
                  id="usr-pwd"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usr-role">Hak Akses / Peran</Label>
                <select
                  id="usr-role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "owner" | "cashier",
                    })
                  }
                  className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                >
                  <option value="cashier">Kasir (Akses Terbatas: POS, Shift, Pesanan Sendiri)</option>
                  <option value="owner">Pemilik / Owner (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="font-bold"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Buat Akun Kasir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
