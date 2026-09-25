import PageHeader from "@/components/PageHeader";
import NotifyForm from "@/components/admin/NotifyForm";
import { listWorkplaces } from "@/services/admin";

export const metadata = { title: "Bildirim Gönder" };

export default async function NotifyPage() {
  const workplaces = await listWorkplaces();
  return (
    <>
      <PageHeader
        back={{ href: "/admin", label: "Bugün" }}
        title="Bildirim Gönder"
        subtitle="Bildirimleri açmış personelin telefonuna sesli bildirim gider."
      />
      <div className="px-5">
        <NotifyForm workplaces={workplaces.filter((w) => w.active).map(({ id, name }) => ({ id, name }))} />
      </div>
    </>
  );
}
