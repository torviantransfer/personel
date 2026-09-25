/** Tarayıcı tarafı bildirim aboneliği (Web Push). */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushState = "unsupported" | "default" | "granted" | "denied";

export function pushState(): PushState {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !VAPID_PUBLIC_KEY) {
    return "unsupported";
  }
  return Notification.permission;
}

function keyToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
}

async function subscribeAndSave() {
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY) }));
  const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  return res.ok;
}

/** Kullanıcı dokunuşuyla çağrılır: izin ister ve bu cihazı kaydeder. */
export async function enablePush(): Promise<PushState> {
  if (pushState() === "unsupported") return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  await subscribeAndSave().catch(() => false);
  return "granted";
}

/** Uygulama açılışında: izin zaten verilmişse aboneliği sessizce tazeler. */
export async function syncPush() {
  if (pushState() !== "granted") return;
  await subscribeAndSave().catch(() => false);
}

/** Çıkış yaparken: bu cihaza artık bildirim gitmesin. */
export async function disablePush() {
  if (pushState() === "unsupported") return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
  } catch {
    // çıkışı engellemesin
  }
}
