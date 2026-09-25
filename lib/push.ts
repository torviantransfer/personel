import "server-only";
import { createHash } from "node:crypto";
import webpush, { type PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Bildirim abonelikleri Supabase Storage'daki özel "push" kovasında tutulur:
 *   push/<kullanıcı id>/<abonelik özeti>.json
 * Veritabanı şeması gerektirmez. Kova herkese kapalıdır; yalnızca sunucu (service role) erişir.
 */
const BUCKET = "push";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

let configured = false;
function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY tanımlı olmalı.");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:bildirim@mesaigo.app", pub, priv);
  configured = true;
}

async function ensureBucket() {
  const storage = createAdminClient().storage;
  const { error } = await storage.getBucket(BUCKET);
  if (error) await storage.createBucket(BUCKET, { public: false, fileSizeLimit: 16 * 1024 });
}

const fileFor = (userId: string, endpoint: string) => `${userId}/${createHash("sha256").update(endpoint).digest("hex").slice(0, 32)}.json`;

export function isValidSubscription(v: unknown): v is PushSubscription {
  const s = v as PushSubscription;
  return (
    typeof s?.endpoint === "string" &&
    /^https:\/\//.test(s.endpoint) &&
    s.endpoint.length < 2048 &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string"
  );
}

export async function saveSubscription(userId: string, sub: PushSubscription) {
  await ensureBucket();
  const storage = createAdminClient().storage.from(BUCKET);
  const body = JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  const target = fileFor(userId, sub.endpoint);
  const { error } = await storage.upload(target, new Blob([body], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  if (error) throw error;

  // Her hesap tek cihaza bağlıdır: aynı telefonda uygulama yeniden kurulunca ya da Chrome ile uygulama
  // ayrı kayıt açınca çift bildirim gitmesin. Hesabın eski cihaz kayıtları silinir.
  const fileName = target.split("/")[1];
  const { data: own } = await storage.list(userId, { limit: 100 });
  const oldOwn = (own ?? []).map((f) => f.name).filter((name) => name !== fileName);
  // Aynı cihaz yalnızca son giriş yapılan hesaba bağlı olsun (telefonda hesap değiştirilince)
  const { data: folders } = await storage.list("", { limit: 1000 });
  const others = (folders ?? []).map((f) => f.name).filter((name) => name !== userId && /^[0-9a-f-]{36}$/i.test(name));
  const remove = [...oldOwn.map((name) => `${userId}/${name}`), ...others.map((id) => `${id}/${fileName}`)];
  if (remove.length) await storage.remove(remove);
}

export async function removeSubscription(userId: string, endpoint: string) {
  await createAdminClient().storage.from(BUCKET).remove([fileFor(userId, endpoint)]);
}

async function listSubscriptions(userId: string): Promise<{ path: string; sub: PushSubscription }[]> {
  const storage = createAdminClient().storage.from(BUCKET);
  const { data: files } = await storage.list(userId, { limit: 20 });
  const result: { path: string; sub: PushSubscription }[] = [];
  for (const f of files ?? []) {
    const path = `${userId}/${f.name}`;
    const { data } = await storage.download(path);
    if (!data) continue;
    try {
      const sub = JSON.parse(await data.text());
      if (isValidSubscription(sub)) result.push({ path, sub });
    } catch {
      // bozuk kayıt, yok say
    }
  }
  return result;
}

/** Verilen kullanıcıların tüm cihazlarına bildirim gönderir; geçersiz abonelikleri siler. Gönderilen cihaz sayısını döner. */
export async function sendToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  configure();
  await ensureBucket();
  const storage = createAdminClient().storage.from(BUCKET);
  const message = JSON.stringify(payload);
  let sent = 0;
  const stale: string[] = [];

  // Aynı cihaz (endpoint) birden fazla hesapta kayıtlıysa tek bildirim gönderilir
  const byEndpoint = new Map<string, { paths: string[]; sub: PushSubscription }>();
  for (const list of await Promise.all(userIds.map(listSubscriptions))) {
    for (const { path, sub } of list) {
      const entry = byEndpoint.get(sub.endpoint);
      if (entry) entry.paths.push(path);
      else byEndpoint.set(sub.endpoint, { paths: [path], sub });
    }
  }

  await Promise.all(
    [...byEndpoint.values()].map(async ({ paths, sub }) => {
      try {
        await webpush.sendNotification(sub, message, { TTL: 60 * 60 * 24, urgency: "high" });
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(...paths);
      }
    }),
  );

  if (stale.length) await storage.remove(stale);
  return sent;
}
