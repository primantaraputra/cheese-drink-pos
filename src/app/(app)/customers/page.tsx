"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustomersAction,
  createCustomerAction,
  updateCustomerAction,
} from "@/actions/customer.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatIDR } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { Plus, Users, Search, Edit2, Loader2, Phone, Calendar, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";
import type { CustomerFormData } from "@/lib/validators/customer.schema";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    notes: "",
  });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => getCustomersAction(search),
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => createCustomerAction(data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal menambah pelanggan");
      toast.success("Pelanggan berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormData> }) =>
      updateCustomerAction(id, data),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error || "Gagal memperbarui data pelanggan");
      toast.success("Data pelanggan diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
    },
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", notes: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || "",
      notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Nama pelanggan wajib diisi");

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <Users className="h-8 w-8 text-amber-500" />
            Data Pelanggan & Loyalitas
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Pantau riwayat kunjungan dan total transaksi pelanggan setia Cheese Drink
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-md shadow-amber-500/20">
          <Plus className="h-4 w-4" />
          Tambah Pelanggan
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Cari nama atau nomor telepon pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="Belum ada data pelanggan"
                description="Catat data pelanggan untuk meningkatkan repeat order dan loyalitas pelanggan."
                actionLabel="Tambah Pelanggan Baru"
                onAction={handleOpenCreate}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold bg-stone-50/50 dark:bg-stone-800/40">
                    <th className="py-3.5 px-4">Nama Pelanggan</th>
                    <th className="py-3.5 px-4">Nomor HP</th>
                    <th className="py-3.5 px-4">Kunjungan</th>
                    <th className="py-3.5 px-4">Total Belanja</th>
                    <th className="py-3.5 px-4">Terakhir Datang</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40">
                      <td className="py-4 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {customer.name}
                        {customer.notes && (
                          <div className="text-xs font-normal text-stone-400 mt-0.5">
                            {customer.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-stone-600 dark:text-stone-300">
                        {customer.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-stone-400" />
                            {customer.phone}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-stone-700 dark:text-stone-300">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                          {customer.visit_count} kali
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-600 dark:text-amber-400">
                        {formatIDR(customer.total_spent)}
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-500">
                        {customer.last_visit_at ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            {formatDateTime(customer.last_visit_at)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(customer)}
                          className="h-8 w-8 text-stone-500 hover:text-amber-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Form Pelanggan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Ubah Data Pelanggan" : "Tambah Pelanggan Baru"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name">Nama Pelanggan</Label>
                <Input
                  id="cust-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Nomor Telepon / WhatsApp (Opsional)</Label>
                <Input
                  id="cust-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 08123456789"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-notes">Catatan Pelanggan (Opsional)</Label>
                <Input
                  id="cust-notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Suka saus mentai, langganan kantor sebelah"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="font-bold"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Simpan Pelanggan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
