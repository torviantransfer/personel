import AppMain from "@/components/AppMain";
import BottomNav from "@/components/BottomNav";
import { getSession } from "@/lib/auth";

// Oturuma bağlı sayfalar: her zaman istek anında çalışır, build sırasında önceden derlenmez.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await getSession();
  // Personel tek ekranlı uygulama kullanır; alt menü yalnızca yönetici panelinde.
  return (
    <>
      {isAdmin ? (
        <div className="isolate min-h-dvh bg-app text-ink">
          <div aria-hidden className="h-app pointer-events-none fixed inset-x-0 top-0 -z-10 bg-app" />
          <AppMain nav>{children}</AppMain>
        </div>
      ) : (
        <AppMain nav={false}>{children}</AppMain>
      )}
      {isAdmin && <BottomNav />}
    </>
  );
}
