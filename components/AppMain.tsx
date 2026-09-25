"use client";

import { usePathname } from "next/navigation";

/** Mobil genişlikte içerik; rapor tablosu masaüstünde geniş açılır. */
export default function AppMain({ nav, children }: { nav: boolean; children: React.ReactNode }) {
  const wide = usePathname().startsWith("/admin/report");
  return <main className={`mx-auto min-h-app ${nav ? "pb-nav" : ""} ${wide ? "max-w-5xl" : "max-w-md"}`}>{children}</main>;
}
