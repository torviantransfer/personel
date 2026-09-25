import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Personel fotoğrafları: Supabase Storage "avatars" kovası, dosya adı = kullanıcı id'si.
 * Veritabanı şeması gerekmez; sürüm (updated_at) önbellek kırıcı olarak URL'e eklenir.
 */
export const AVATAR_BUCKET = "avatars";

type Obj = { name: string; updated_at?: string | null };

function publicUrl(name: string, version?: string | null) {
  const { data } = createAdminClient().storage.from(AVATAR_BUCKET).getPublicUrl(name);
  return version ? `${data.publicUrl}?v=${encodeURIComponent(version)}` : data.publicUrl;
}

export async function ensureAvatarBucket() {
  const admin = createAdminClient();
  const { error } = await admin.storage.getBucket(AVATAR_BUCKET);
  if (!error) return;
  await admin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
}

/** Tüm fotoğraflar: kullanıcı id → URL */
export async function getAvatarMap(): Promise<Map<string, string>> {
  const { data, error } = await createAdminClient().storage.from(AVATAR_BUCKET).list("", { limit: 1000 });
  const map = new Map<string, string>();
  if (error || !data) return map;
  for (const o of data as Obj[]) {
    const id = o.name.replace(/\.[a-z]+$/i, "");
    map.set(id, publicUrl(o.name, o.updated_at));
  }
  return map;
}

export async function getAvatarUrl(userId: string): Promise<string | null> {
  const { data, error } = await createAdminClient().storage.from(AVATAR_BUCKET).list("", { limit: 1, search: userId });
  const o = !error && (data as Obj[] | null)?.find((x) => x.name.startsWith(userId));
  return o ? publicUrl(o.name, o.updated_at) : null;
}
