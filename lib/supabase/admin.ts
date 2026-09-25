import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * service_role istemcisi: RLS'i atlar. YALNIZCA requireAdmin() ile yetkisi doğrulanmış
 * sunucu kodunda kullanın. "server-only" sayesinde istemci paketine giremez.
 */
export function createAdminClient() {
  const { url } = supabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY tanımlı değil (yönetim paneli için gerekli).");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
