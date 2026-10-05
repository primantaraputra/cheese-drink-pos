"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogsAction } from "@/actions/audit.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils/date";
import {
  ShieldAlert,
  History,
  Eye,
  Loader2,
  Filter,
} from "lucide-react";

export default function AuditLogsPage() {
  const [filterAction, setFilterAction] = useState("all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: () => getAuditLogsAction(100),
  });

  const filteredLogs = logs.filter((log) => {
    if (filterAction === "all") return true;
    return log.action.toLowerCase().includes(filterAction.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            Audit Trail & Rekam Jejak Sistem
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Pantau seluruh aktivitas sensitif seperti pembatalan pesanan (void), perubahan harga, dan konfigurasi toko
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold dark:border-stone-800 dark:bg-stone-900 shadow-xs"
          >
            <option value="all">Semua Aktivitas</option>
            <option value="void">Pembatalan (Void)</option>
            <option value="pin">PIN Otorisasi</option>
            <option value="price">Perubahan Harga</option>
            <option value="user">Pengguna / Kasir</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Log Keamanan (100 Aktivitas Terakhir)</CardTitle>
          <CardDescription>
            Seluruh data tercatat otomatis secara permanen dan tidak dapat diubah
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={History}
              title="Tidak ada log aktivitas"
              description="Belum ada aktivitas yang tercatat dengan filter saat ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-xs uppercase font-bold">
                    <th className="py-3 px-4">Waktu (WIB)</th>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Jenis Aksi</th>
                    <th className="py-3 px-4">Entitas Target</th>
                    <th className="py-3 px-4">ID Entitas</th>
                    <th className="py-3 px-4 text-right">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/20 text-xs">
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {formatDate(log.created_at, "dd/MM/yyyy HH:mm:ss")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(log as any).user?.full_name || "Sistem"}
                      </td>
                      <td className="py-3.5 px-4">
                        {log.action.includes("void") ? (
                          <Badge variant="destructive">{log.action}</Badge>
                        ) : log.action.includes("pin") ? (
                          <Badge variant="warning">{log.action}</Badge>
                        ) : (
                          <Badge variant="secondary">{log.action}</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-700 dark:text-stone-300">
                        {(log as any).entity || (log as any).table_name || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-400 max-w-[120px] truncate">
                        {(log as any).entity_id || (log as any).record_id || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-500 hover:text-amber-600"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Modal Dialog Rincian Log */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedLog && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Rincian Log Aktivitas #{selectedLog.id}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl">
                <div>
                  <span className="text-stone-400 block">Waktu Tercatat</span>
                  <span className="font-semibold">{formatDate(selectedLog.created_at, "dd MMMM yyyy, HH:mm:ss")}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Pengguna</span>
                  <span className="font-semibold">{selectedLog.user?.full_name || "Sistem"}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Aksi</span>
                  <span className="font-mono font-bold text-amber-600">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Entitas / ID</span>
                  <span className="font-mono">{selectedLog.entity} ({selectedLog.entity_id})</span>
                </div>
              </div>

              {/* Data Sebelum vs Sesudah */}
              <div className="space-y-3">
                {selectedLog.old_data && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-stone-500 uppercase">
                      Data Lama (Sebelum Perubahan):
                    </span>
                    <pre className="bg-stone-900 text-amber-300 p-3 rounded-xl text-xs overflow-x-auto font-mono">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_data && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-stone-500 uppercase">
                      Data Baru (Setelah Perubahan):
                    </span>
                    <pre className="bg-stone-900 text-emerald-400 p-3 rounded-xl text-xs overflow-x-auto font-mono">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
