import type { Viewport } from "next";
import { redirect } from "next/navigation";
import HomeClient from "@/components/HomeClient";
import { requestTime } from "@/lib/attendance";
import { getSession } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatars";
import { getLastRecord } from "@/services/attendance";

export const viewport: Viewport = { themeColor: "#070b14" };

export default async function HomePage() {
  const { supabase, userId, profile, isAdmin } = await getSession();
  if (isAdmin) redirect("/admin");

  const [lastRecord, avatarUrl] = await Promise.all([getLastRecord(supabase, userId), getAvatarUrl(userId).catch(() => null)]);

  return (
    <HomeClient
      fullName={profile?.full_name || "Personel"}
      avatarUrl={avatarUrl}
      workplaceName={profile?.workplace_name ?? null}
      lastRecord={lastRecord}
      serverNow={requestTime()}
    />
  );
}
