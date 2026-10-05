"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { Printer, Download, Share2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReceiptItem {
  id: string;
  product_name: string;
  variant_name?: string | null;
  qty: number;
  unit_price: number;
  subtotal: number;
  note?: string | null;
  modifiers?: {
    modifier_name: string;
    price_delta: number;
  }[];
}

export interface ReceiptData {
  order_no: string;
  queue_no: number;
  created_at: string;
  order_type: string;
  table_no?: string | null;
  customer_name?: string | null;
  cashier_name: string;
  items: ReceiptItem[];
  subtotal: number;
  discount_amount: number;
  service_amount: number;
  tax_amount: number;
  rounding_amount: number;
  total: number;
  paid_amount: number;
  change_amount: number;
  payments: {
    method: string;
    amount: number;
    reference_no?: string | null;
  }[];
  note?: string | null;
  is_copy?: boolean;
}

export interface StoreReceiptSettings {
  store_name: string;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  receipt_header?: string | null;
  receipt_footer?: string | null;
  receipt_paper_width: number; // 58 or 80
  show_logo_on_receipt?: boolean;
}

interface ReceiptProps {
  id?: string;
  data: ReceiptData;
  settings?: StoreReceiptSettings;
  showActions?: boolean;
  className?: string;
}

export function Receipt({ id = "thermal-receipt", data, settings, showActions = true, className = "" }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const paperWidth = settings?.receipt_paper_width || 58;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: paperWidth === 80 ? [80, 200] : [58, 180],
    });

    const storeName = settings?.store_name || "Cheese Drink";
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text(storeName, paperWidth / 2, 8, { align: "center" });

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    if (settings?.address) {
      doc.text(settings.address, paperWidth / 2, 13, { align: "center" });
    }
    if (settings?.phone) {
      doc.text(`Telp: ${settings.phone}`, paperWidth / 2, 17, { align: "center" });
    }

    doc.line(4, 19, paperWidth - 4, 19);

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text(`ANTREAN: #${data.queue_no}`, paperWidth / 2, 25, { align: "center" });

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(`No: ${data.order_no}`, 4, 30);
    doc.text(`Tgl: ${formatDate(data.created_at, "dd/MM/yyyy HH:mm")}`, 4, 34);
    doc.text(`Kasir: ${data.cashier_name}`, 4, 38);
    if (data.customer_name) {
      doc.text(`Pelanggan: ${data.customer_name}`, 4, 42);
    }

    const tableRows = data.items.map((it) => [
      `${it.product_name}${it.variant_name ? ` (${it.variant_name})` : ""}\n${it.qty} x ${formatIDR(it.unit_price)}`,
      formatIDR(it.subtotal),
    ]);

    autoTable(doc, {
      startY: data.customer_name ? 45 : 41,
      head: [["Item", "Total"]],
      body: tableRows,
      theme: "plain",
      styles: { font: "courier", fontSize: 7, cellPadding: 1 },
      headStyles: { fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: paperWidth - 22 }, 1: { halign: "right" } },
      margin: { left: 4, right: 4 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 3;
    doc.setFont("courier", "bold");
    doc.text(`TOTAL: ${formatIDR(data.total)}`, paperWidth - 4, finalY, { align: "right" });

    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    doc.text(
      settings?.receipt_footer || "Terima kasih sudah jajan!",
      paperWidth / 2,
      finalY + 7,
      { align: "center" }
    );

    doc.save(`struk-${data.order_no}.pdf`);
  };

  const handleShareWA = () => {
    let itemsText = "";
    data.items.forEach((it) => {
      itemsText += `• ${it.qty}x ${it.product_name}${it.variant_name ? ` (${it.variant_name})` : ""} = ${formatIDR(it.subtotal)}\n`;
    });

    const text = `*STRUK PEMBELIAN ${settings?.store_name || "CHEESE DRINK"}*
No. Struk: ${data.order_no}
No. Antrean: #${data.queue_no}
Waktu: ${formatDate(data.created_at, "dd/MM/yyyy HH:mm")}
-------------------------
${itemsText}-------------------------
*Subtotal: ${formatIDR(data.subtotal)}*
${data.discount_amount > 0 ? `Diskon: -${formatIDR(data.discount_amount)}\n` : ""}${data.service_amount > 0 ? `Layanan: ${formatIDR(data.service_amount)}\n` : ""}${data.tax_amount > 0 ? `Pajak: ${formatIDR(data.tax_amount)}\n` : ""}*TOTAL: ${formatIDR(data.total)}*
Bayar: ${formatIDR(data.paid_amount)}
Kembali: ${formatIDR(data.change_amount)}

${settings?.receipt_footer || "Terima kasih sudah jajan di Cheese Drink!"}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center">
      {/* Tombol Cetak / PDF / Share */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 print:hidden">
          <Button onClick={handlePrint} className="gap-2 font-bold shadow-sm">
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Unduh PDF
          </Button>
          <Button onClick={handleShareWA} variant="outline" className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <Share2 className="h-4 w-4" />
            Bagikan WhatsApp
          </Button>
        </div>
      )}

      {/* Tampilan Struk Fisik / Thermal Paper Simulator */}
      <div
        ref={receiptRef}
        id={id}
        data-width={paperWidth}
        className={`receipt-container bg-white text-black p-4 font-mono text-xs shadow-md border border-stone-200 relative ${
          paperWidth === 80 ? "w-[80mm] max-w-[80mm]" : "w-[58mm] max-w-[58mm]"
        } ${className}`}
        style={{
          boxSizing: "border-box",
          lineHeight: 1.3,
        }}
      >
        {/* Watermark Salinan jika cetak ulang */}
        {data.is_copy && (
          <div className="text-center font-black tracking-widest text-stone-500 uppercase border border-dashed border-stone-400 py-0.5 mb-2 text-[10px]">
            *** SALINAN ***
          </div>
        )}

        {/* Header Toko */}
        <div className="text-center mb-3">
          <h2 className="text-sm font-black tracking-tight uppercase">
            {settings?.store_name || "CHEESE DRINK"}
          </h2>
          {settings?.tagline && (
            <p className="text-[10px] text-stone-600">{settings.tagline}</p>
          )}
          {settings?.address && (
            <p className="text-[10px] text-stone-600">{settings.address}</p>
          )}
          {settings?.phone && (
            <p className="text-[10px] text-stone-600">Telp: {settings.phone}</p>
          )}
          {settings?.receipt_header && (
            <p className="text-[10px] mt-1 text-stone-700 italic border-t border-dotted border-stone-300 pt-1">
              {settings.receipt_header}
            </p>
          )}
        </div>

        <div className="border-t border-b border-dashed border-black py-2 my-2 text-center">
          <div className="text-[10px] text-stone-500 font-bold uppercase">Nomor Antrean</div>
          <div className="text-2xl font-black">#{data.queue_no}</div>
        </div>

        {/* Meta Transaksi */}
        <div className="text-[10px] space-y-0.5 mb-2">
          <div className="flex justify-between">
            <span>No. Struk</span>
            <span className="font-bold">{data.order_no}</span>
          </div>
          <div className="flex justify-between">
            <span>Waktu</span>
            <span>{formatDate(data.created_at, "dd/MM/yy HH:mm")}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir</span>
            <span>{data.cashier_name}</span>
          </div>
          <div className="flex justify-between">
            <span>Layanan</span>
            <span className="font-bold">Bawa Pulang (Take Away)</span>
          </div>
          {data.customer_name && (
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>{data.customer_name}</span>
            </div>
          )}
        </div>

        {/* Daftar Item Pesanan */}
        <div className="border-t border-dashed border-black py-1.5 space-y-1.5">
          {(data.items || []).map((it, idx) => (
            <div key={idx} className="text-[11px]">
              <div className="font-bold">
                {it.product_name}
                {it.variant_name && (
                  <span className="font-normal text-[10px] text-stone-600"> ({it.variant_name})</span>
                )}
              </div>
              {it.modifiers && it.modifiers.length > 0 && (
                <div className="text-[9px] text-stone-500 pl-2">
                  + {it.modifiers.map((m) => `${m.modifier_name} (${formatIDR(m.price_delta)})`).join(", ")}
                </div>
              )}
              {it.note && (
                <div className="text-[9px] italic text-stone-500 pl-2">
                  Catatan: {it.note}
                </div>
              )}
              <div className="flex justify-between text-[10px] text-stone-600">
                <span>{it.qty} x {formatIDR(it.unit_price)}</span>
                <span className="font-semibold text-black">{formatIDR(it.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Kalkulasi Total */}
        <div className="border-t border-dashed border-black pt-1.5 space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatIDR(data.subtotal)}</span>
          </div>
          {data.discount_amount > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Diskon</span>
              <span>-{formatIDR(data.discount_amount)}</span>
            </div>
          )}
          {data.service_amount > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Biaya Layanan</span>
              <span>{formatIDR(data.service_amount)}</span>
            </div>
          )}
          {data.tax_amount > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Pajak (PPN)</span>
              <span>{formatIDR(data.tax_amount)}</span>
            </div>
          )}
          {data.rounding_amount !== 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Pembulatan</span>
              <span>{formatIDR(data.rounding_amount)}</span>
            </div>
          )}

          <div className="flex justify-between font-black text-sm border-t border-black pt-1 mt-1">
            <span>TOTAL</span>
            <span>{formatIDR(data.total)}</span>
          </div>

          {/* Metode Bayar */}
          <div className="pt-1 border-t border-dotted border-stone-400 space-y-0.5">
            {(data.payments || []).map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="uppercase">{p.method === "cash" ? "Tunai" : p.method.toUpperCase()}</span>
                <span>{formatIDR(p.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span>Bayar</span>
              <span>{formatIDR(data.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Kembalian</span>
              <span>{formatIDR(data.change_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Toko */}
        <div className="text-center border-t border-dashed border-black pt-2 mt-3 text-[10px] space-y-0.5">
          <p className="font-semibold">
            {settings?.receipt_footer || "Terima kasih sudah jajan di Cheese Drink!"}
          </p>
          <p className="text-[8px] text-stone-500">
            Kritik & Saran Hubungi Kasir / WA Toko
          </p>
        </div>
      </div>
    </div>
  );
}
