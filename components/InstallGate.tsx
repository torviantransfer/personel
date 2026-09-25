"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { CheckCircle2, Download, EllipsisVertical, LoaderCircle, PlusSquare, Share } from "lucide-react";
import DarkBackdrop from "@/components/DarkBackdrop";

/**
 * Uygulama yalnızca ana ekrana eklenmiş (standalone) halde çalışır.
 * Tarayıcıda açılırsa uygulama yerine kurulum ekranı gösterilir.
 * Geliştirme ortamında (npm run dev) kontrol atlanır.
 */

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent | null;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

const BYPASS = process.env.NODE_ENV !== "production";
const STANDALONE_QUERY = "(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)";

function isStandalone() {
  return navigator.standalone === true || window.matchMedia(STANDALONE_QUERY).matches || document.referrer.startsWith("android-app://");
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia(STANDALONE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

type Mode = "pending" | "app" | "browser";

export default function InstallGate({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore<Mode>(
    subscribe,
    () => (BYPASS || isStandalone() ? "app" : "browser"),
    () => (BYPASS ? "app" : "pending"),
  );

  if (mode === "app") return children;
  if (mode === "pending") return <div className="app-screen bg-[#070b14]" />;
  return <InstallScreen />;
}

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function InstallScreen() {
  const [platform] = useState<Platform>(detectPlatform);

  return (
    <main className="app-screen isolate flex flex-col items-center overflow-x-clip px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] text-center text-white">
      <DarkBackdrop />

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative [animation:pop_.6s_cubic-bezier(.2,.9,.3,1.2)_both]">
          <span className="absolute inset-0 rounded-[30px] bg-primary/40 [animation:ripple_2.4s_ease-out_infinite]" />
          <div className="relative [animation:float_4s_ease-in-out_infinite]">
            <Image src="/icons/icon-512.png" alt="" width={96} height={96} priority className="drop-shadow-[0_18px_28px_rgb(22_119_255/0.35)]" />
          </div>
        </div>
        <Image src="/brand/mesaigo-white.png" alt="MesaiGo" width={720} height={146} priority unoptimized className="mt-8 h-8 w-auto [animation:rise_.6s_.1s_ease-out_both]" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight [animation:rise_.6s_.15s_ease-out_both]">Uygulamayı yükleyin</h1>
        <p className="mt-2 max-w-72 text-[15px] leading-relaxed text-white/60 [animation:rise_.6s_.2s_ease-out_both]">
          MesaiGo yalnızca telefonunuzun ana ekranından kullanılabilir.
        </p>

        <div className="mt-8 w-full max-w-sm [animation:rise_.6s_.25s_ease-out_both]">
          {platform === "ios" && <IosSteps />}
          {platform === "android" && <AndroidInstall />}
          {platform === "desktop" && <DesktopNotice />}
        </div>
      </div>
    </main>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3.5 px-4 py-3.5 text-left">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold">{n}</span>
      <span className="flex flex-wrap items-center gap-1.5 text-[15px] text-white/85">{children}</span>
    </li>
  );
}

const panel = "divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-md ring-inset";
const chip = "inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 font-semibold text-white";

function IosSteps() {
  return (
    <>
      <ol className={panel}>
        <Step n={1}>
          Alttaki
          <span className={chip}>
            <Share className="size-4 text-sky-300" />
            Paylaş
          </span>
          simgesine dokunun
        </Step>
        <Step n={2}>
          <span className={chip}>
            <PlusSquare className="size-4 text-sky-300" />
            Ana Ekrana Ekle
          </span>
          seçeneğini seçin
        </Step>
        <Step n={3}>
          Sağ üstteki <span className={chip}>Ekle</span> düğmesine dokunun
        </Step>
      </ol>
      <p className="mt-4 text-[13px] text-white/45">Ardından ana ekrandaki MesaiGo simgesinden açın.</p>
    </>
  );
}

function AndroidInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<"idle" | "installing" | "installed">("idle");

  useEffect(() => {
    // Olay sayfa yüklenirken <head> içindeki betikte yakalanıp saklanır.
    const sync = () => setPrompt(window.__installPrompt ?? null);
    const onInstalled = () => setState("installed");
    sync();
    window.addEventListener("installprompt-ready", sync);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("installprompt-ready", sync);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    setState("installing");
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    window.__installPrompt = null;
    setPrompt(null);
    setState(outcome === "accepted" ? "installed" : "idle");
  }

  if (state === "installed") {
    return (
      <div className={`${panel} flex flex-col items-center px-5 py-6`}>
        <CheckCircle2 className="size-10 text-emerald-400" />
        <p className="mt-3 font-semibold">Uygulama yüklendi</p>
        <p className="mt-1 text-sm text-white/60">Ana ekrandaki MesaiGo simgesinden açabilirsiniz.</p>
      </div>
    );
  }

  if (prompt) {
    return (
      <button
        type="button"
        onClick={install}
        disabled={state === "installing"}
        className="tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold shadow-[0_0_40px_-6px_rgb(22_119_255/0.7)] active:bg-primary-dark disabled:opacity-70"
      >
        {state === "installing" ? <LoaderCircle className="size-5 animate-spin" /> : <Download className="size-5" />}
        Uygulamayı Yükle
      </button>
    );
  }

  return (
    <>
      <ol className={panel}>
        <Step n={1}>
          Sağ üstteki
          <span className={chip}>
            <EllipsisVertical className="size-4 text-sky-300" />
            menü
          </span>
          simgesine dokunun
        </Step>
        <Step n={2}>
          <span className={chip}>Uygulamayı yükle</span> veya <span className={chip}>Ana ekrana ekle</span> seçin
        </Step>
      </ol>
      <p className="mt-4 text-[13px] text-white/45">Ardından ana ekrandaki MesaiGo simgesinden açın.</p>
    </>
  );
}

function DesktopNotice() {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import("qrcode").then((QR) =>
      QR.toString(window.location.origin, { type: "svg", margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }).then((s) => alive && setSvg(s)),
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={`${panel} flex flex-col items-center px-5 py-6`}>
      <div className="size-40 rounded-xl bg-white p-2 [&>svg]:size-full">
        {svg ? <div className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
      </div>
      <p className="mt-4 text-[15px] font-semibold">Telefonunuzun kamerasıyla okutun</p>
      <p className="mt-1 text-sm text-white/55">Açılan sayfadan uygulamayı ana ekrana ekleyin.</p>
    </div>
  );
}
