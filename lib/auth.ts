import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import { getProfile } from "@/services/attendance";

/** İstek başına bir kez: oturumdaki kullanıcı ve profili. Giriş yoksa /login. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) redirect("/login");
  const profile = await getProfile(supabase, userId);
  return { supabase, userId, profile, isAdmin: profile?.role === "admin" && profile.active };
});

/** Yönetici değilse ana sayfaya yönlendirir. Tüm admin sayfaları ve server action'lar bunu çağırır. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.isAdmin) redirect("/");
  return session;
}
