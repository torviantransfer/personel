"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { disablePush } from "@/lib/push-client";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await disablePush();
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={`tap flex h-14 w-full items-center justify-center gap-2 text-[15px] font-semibold disabled:opacity-60 ${
        dark
          ? "rounded-2xl bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20 ring-inset active:bg-rose-500/20"
          : "card text-rose-600 active:bg-rose-50"
      }`}
    >
      {loading ? <LoaderCircle className="size-5 animate-spin" /> : <LogOut className="size-5" />}
      Çıkış Yap
    </button>
  );
}
