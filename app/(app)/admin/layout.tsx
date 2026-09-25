import type { Viewport } from "next";
import { requireAdmin } from "@/lib/auth";

export const viewport: Viewport = { themeColor: "#F5F7FA" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
