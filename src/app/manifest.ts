import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cheese Drink POS - Kasir UMKM",
    short_name: "Cheese Drink",
    description: "Aplikasi Kasir Modern Penjualan Dimsum & Aneka Minuman Cheese",
    start_url: "/pos",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#F59E0B",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
