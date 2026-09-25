"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import type { CameraErrorCode } from "@/types";

type Props = {
  onDetected: (text: string) => void;
  onError: (code: CameraErrorCode) => void;
  onClose: () => void;
};

function classifyCameraError(err: unknown): CameraErrorCode {
  const name = err instanceof DOMException || err instanceof Error ? err.name : "";
  const message = typeof err === "string" ? err : err instanceof Error ? err.message : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "CAMERA_DENIED";
  if (name === "NotReadableError" || name === "AbortError" || name === "TrackStartError") return "CAMERA_IN_USE";
  if (name === "NotFoundError" || name === "OverconstrainedError" || /camera not found/i.test(message)) return "CAMERA_NOT_FOUND";
  return "CAMERA_DENIED";
}

/** Uygulama içi tam ekran QR tarayıcı. İlk okumada kamerayı hemen kapatır. */
export default function QrScanner({ onDetected, onError, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  const handleDetected = useEffectEvent((text: string) => onDetected(text));
  const handleError = useEffectEvent((code: CameraErrorCode) => onError(code));

  useEffect(() => {
    let cancelled = false;
    let detected = false;
    let scanner: import("qr-scanner").default | null = null;

    async function start() {
      if (!window.isSecureContext) return handleError("CAMERA_INSECURE");
      if (!navigator.mediaDevices?.getUserMedia) return handleError("CAMERA_UNSUPPORTED");

      const { default: QrScannerLib } = await import("qr-scanner");
      if (cancelled || !videoRef.current) return;

      scanner = new QrScannerLib(
        videoRef.current,
        (result) => {
          if (detected || !result.data) return;
          detected = true;
          scanner?.stop();
          navigator.vibrate?.(60);
          handleDetected(result.data);
        },
        {
          preferredCamera: "environment",
          maxScansPerSecond: 15,
          returnDetailedScanResult: true,
          onDecodeError: () => {},
        },
      );

      try {
        await scanner.start();
        if (cancelled) scanner.destroy();
        else setReady(true);
      } catch (err) {
        if (!cancelled) handleError(classifyCameraError(err));
      }
    }

    start();
    return () => {
      cancelled = true;
      scanner?.destroy();
      scanner = null;
    };
  }, []);

  return (
    <div className="h-app fixed inset-x-0 top-0 z-50 bg-[#070b14] text-white" role="dialog" aria-modal="true" aria-label="QR Kodunu Tara">
      <video ref={videoRef} className="absolute inset-0 size-full object-cover" playsInline muted autoPlay />

      {/* Karartma + ortada kare pencere */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="relative aspect-square w-[70vw] max-w-72 rounded-3xl shadow-[0_0_0_100vmax_rgb(7_11_20/0.62)]"
          style={{ ["--frame" as string]: "min(70vw, 18rem)" }}
        >
          {["left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl"].map((c) => (
            <span key={c} className={`absolute size-10 border-white drop-shadow-[0_0_8px_rgb(22_119_255/0.8)] ${c}`} />
          ))}
          {ready && (
            <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_#1677ff] [animation:scanline_2.4s_ease-in-out_infinite]" />
          )}
        </div>
      </div>

      <div className="safe-top absolute inset-x-0 top-0 px-5">
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-semibold">QR Kodunu Tara</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="tap flex size-10 items-center justify-center rounded-full bg-white/[0.08] ring-1 ring-white/15 backdrop-blur-md ring-inset active:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-8 pb-[max(env(safe-area-inset-bottom),1.5rem)] text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-white/90 ring-1 ring-white/10 backdrop-blur-md ring-inset">
          {!ready && <LoaderCircle className="size-4 animate-spin text-sky-300" />}
          {ready ? "Giriş noktasındaki QR kodunu kameraya gösterin" : "Kamera açılıyor…"}
        </p>
      </div>
    </div>
  );
}
