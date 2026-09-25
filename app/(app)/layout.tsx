import AppMain from "@/components/AppMain";
import BottomNav from "@/components/BottomNav";
import StatusBarScrim from "@/components/StatusBarScrim";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await getSession();
  // Personel tek ekranlı uygulama kullanır; alt menü yalnızca yönetici panelinde.
  return (
    <>
      {isAdmin ? (
        <div className="min-h-dvh bg-app text-ink">
          <AppMain nav>{children}</AppMain>
        </div>
      ) : (
        <AppMain nav={false}>{children}</AppMain>
      )}
      {isAdmin && <BottomNav />}
      {isAdmin && <StatusBarScrim />}
    </>
  );
}
