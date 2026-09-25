import type { Viewport } from "next";

export const metadata = { title: "Giriş" };
export const viewport: Viewport = { themeColor: "#070b14" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
