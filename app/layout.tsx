import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import InstallGate from "@/components/InstallGate";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "MesaiGo", template: "%s · MesaiGo" },
  description: "MesaiGo · Personel giriş-çıkış takip sistemi",
  applicationName: "MesaiGo",
  manifest: "/manifest.webmanifest",
  // Opak siyah durum çubuğu. iOS 26'da "black-translucent" görünüm alanını kaydırıp ekranın altında
  // çizilemeyen bir şerit bırakıyor; "black" ile uygulama durum çubuğunun altından başlayıp ekranın dibine uzanır.
  appleWebApp: { capable: true, title: "MesaiGo", statusBarStyle: "black" },
  // Uygulama arama motorlarında listelenmez.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  formatDetection: { telephone: false, date: false, address: false, email: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#070b14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        {/* Android "uygulamayı yükle" isteği sayfa yüklenirken gelebilir; kurulum ekranı için saklanır. */}
        <Script id="install-prompt" strategy="beforeInteractive">
          {`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e;window.dispatchEvent(new Event("installprompt-ready"));});`}
        </Script>
        <InstallGate>{children}</InstallGate>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
