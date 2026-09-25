"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, QrCode } from "lucide-react";
import DarkBackdrop from "@/components/DarkBackdrop";
import NotificationPrompt from "@/components/NotificationPrompt";
import QrScanner from "@/components/QrScanner";
import ResultScreen, { type ResultState } from "@/components/ResultScreen";
import { Avatar } from "@/components/ui";
import { MAX_SHIFT_MS } from "@/lib/attendance";
import { firstName, formatShortDay, formatTime, TIME_ZONE } from "@/lib/format";
import { ERROR_MESSAGES } from "@/lib/messages";
import { submitScan } from "@/services/attendance";
import type { AttendanceRecord, CameraErrorCode } from "@/types";

type Props = {
  fullName: string;
  avatarUrl: string | null;
  workplaceName: string | null;
  lastRecord: AttendanceRecord | null;
  serverNow: number;
};

const CLIENT_COOLDOWN_MS = 3000;
const hourFmt = new Intl.DateTimeFormat("tr-TR", { hour: "numeric", hour12: false, timeZone: TIME_ZONE });
/** "YUSUF ÇELEBİ" → "Yusuf Çelebi" */
function titleCase(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

function greeting(ms: number) {
  const h = Number(hourFmt.format(new Date(ms)));
  if (h >= 5 && h < 12) return "Günaydın";
  if (h >= 12 && h < 18) return "İyi günler";
  if (h >= 18 && h < 23) return "İyi akşamlar";
  return "İyi geceler";
}

function farewell(iso: string) {
  const h = Number(hourFmt.format(new Date(iso)));
  return h >= 17 || h < 5 ? "İyi akşamlar" : "İyi günler";
}

export default function HomeClient({ fullName, avatarUrl, workplaceName, lastRecord, serverNow }: Props) {
  const router = useRouter();
  const [now, setNow] = useState(serverNow);
  const [last, setLast] = useState(lastRecord);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef(0);
  const displayName = titleCase(fullName);
  const name = firstName(displayName);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 5_000);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const inShift = last?.type === "IN" && now - new Date(last.created_at).getTime() < MAX_SHIFT_MS;

  function openScanner(force = false) {
    if (busyRef.current || (!force && Date.now() - lastScanRef.current < CLIENT_COOLDOWN_MS)) return;
    setResult(null);
    setScanning(true);
  }

  async function handleDetected(text: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    lastScanRef.current = Date.now();
    setScanning(false);
    setResult({ kind: "loading" });

    const res = await submitScan(text);
    busyRef.current = false;
    lastScanRef.current = Date.now();

    if (!res.ok) {
      if (res.code === "UNAUTHORIZED") {
        router.replace("/login");
        router.refresh();
        return;
      }
      const msg = ERROR_MESSAGES[res.code];
      setResult({ kind: "error", title: msg.title, description: msg.description, retry: res.code === "NETWORK_ERROR" || res.code === "INVALID_QR" });
      return;
    }

    const record = res.record;
    setLast(record);
    navigator.vibrate?.([40, 60, 40]);

    if (record.type === "IN") {
      setResult({
        kind: "success",
        variant: "in",
        title: `Hoş geldiniz, ${name}`,
        subtitle: "İyi çalışmalar",
        time: formatTime(record.created_at),
        place: record.workplace_name,
      });
    } else {
      setResult({
        kind: "success",
        variant: "out",
        title: `Güle güle, ${name}`,
        subtitle: farewell(record.created_at),
        time: formatTime(record.created_at),
        place: record.workplace_name,
      });
    }
    router.refresh();
  }

  function handleCameraError(code: CameraErrorCode) {
    setScanning(false);
    const msg = ERROR_MESSAGES[code];
    setResult({ kind: "error", title: msg.title, description: msg.description, retry: code === "CAMERA_DENIED" || code === "CAMERA_IN_USE" });
  }

  return (
    <div className="app-screen isolate flex flex-col overflow-x-clip text-white">
      <DarkBackdrop />

      <header className="px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <div className="flex h-16 items-center justify-between">
          <Image src="/brand/mesaigo-white.png" alt="MesaiGo" width={720} height={146} priority unoptimized className="h-7 w-auto" />
          <Link href="/profile" aria-label="Profil" className="tap flex rounded-full ring-2 ring-white/15">
            <Avatar name={fullName} src={avatarUrl} size="md" eager />
          </Link>
        </div>
      </header>

      <section className="px-6 pt-5 [animation:rise_.5s_ease-out_both]">
        <p className="text-[15px] font-medium text-white/55">{greeting(now)},</p>
        <h1 className="mt-0.5 truncate text-[30px] leading-tight font-bold tracking-tight">{displayName}</h1>
        {workplaceName && <p className="mt-1 truncate text-sm font-medium text-white/45">{workplaceName}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 ring-inset">
            <Clock3 className="size-3.5 text-sky-300" />
            <span className="tabular-nums">{formatTime(now)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[13px] font-semibold text-white/85 ring-1 ring-white/10 ring-inset">
            <CalendarDays className="size-3.5 text-sky-300" />
            {formatShortDay(now)}
          </span>
          {inShift ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[13px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25 ring-inset">
              <span className="size-1.5 rounded-full bg-emerald-400 [animation:pulse-ring_1.6s_ease-out_infinite]" />
              Mesaide · {formatTime(last!.created_at)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[13px] font-semibold text-white/70 ring-1 ring-white/10 ring-inset">
              <span className="size-1.5 rounded-full bg-white/40" />
              Mesai dışı
            </span>
          )}
        </div>
        <NotificationPrompt />
      </section>

      <div className="safe-bottom flex flex-1 items-center justify-center px-6 py-[min(2rem,4dvh)]">
        <button
          type="button"
          onClick={() => openScanner()}
          aria-label="QR kodu okut"
          className="group relative size-[min(16rem,66vw,44dvh)] rounded-full [animation:pop_.6s_.1s_cubic-bezier(.2,.9,.3,1.2)_both]"
        >
          <span className="absolute inset-0 rounded-full bg-primary/30 [animation:ripple_2.6s_ease-out_infinite]" />
          <span className="absolute inset-0 rounded-full bg-primary/25 [animation:ripple_2.6s_ease-out_1.3s_infinite]" />
          <span className="absolute inset-0 rounded-full bg-primary shadow-[0_0_70px_-6px_rgb(22_119_255/0.8)] transition-transform duration-150 group-active:scale-95" />
          <span className="absolute inset-3 rounded-full border border-white/20" />
          <span className="relative flex size-full flex-col items-center justify-center text-white transition-transform duration-150 group-active:scale-95">
            <span className="relative size-[88px]">
              {["top-0 left-0 border-t-[3.5px] border-l-[3.5px] rounded-tl-xl", "top-0 right-0 border-t-[3.5px] border-r-[3.5px] rounded-tr-xl", "bottom-0 left-0 border-b-[3.5px] border-l-[3.5px] rounded-bl-xl", "right-0 bottom-0 border-r-[3.5px] border-b-[3.5px] rounded-br-xl"].map((c) => (
                <span key={c} className={`absolute size-6 border-white ${c}`} />
              ))}
              <QrCode className="absolute inset-0 m-auto size-11 opacity-90" strokeWidth={1.8} />
              <span className="absolute inset-x-1 h-[3px] rounded-full bg-white shadow-[0_0_12px_3px_rgb(255_255_255/0.7)] [animation:sweep_2.2s_ease-in-out_infinite]" />
            </span>
            <span className="mt-4 text-[17px] font-bold tracking-wide">QR KODU OKUT</span>
            <span className="mt-0.5 text-[13px] font-medium text-white/75">{inShift ? "Çıkış için dokunun" : "Giriş için dokunun"}</span>
          </span>
        </button>
      </div>

      {scanning && <QrScanner onDetected={handleDetected} onError={handleCameraError} onClose={() => setScanning(false)} />}
      {result && <ResultScreen state={result} onDone={() => setResult(null)} onRetry={() => openScanner(true)} />}
    </div>
  );
}
