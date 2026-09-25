import Link from "next/link";
import { Building2, ChevronRight, QrCode } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { CreateWorkplaceForm } from "@/components/admin/WorkplaceForms";
import { Badge, Card, EmptyState, IconTile, SectionTitle } from "@/components/ui";
import { listStaff, listWorkplaces } from "@/services/admin";

export const metadata = { title: "İşletmeler" };

export default async function WorkplacesPage() {
  const [workplaces, staff] = await Promise.all([listWorkplaces(), listStaff()]);
  const staffCount = (id: string) => staff.filter((s) => s.workplace_id === id && s.active).length;

  return (
    <>
      <PageHeader title="İşletmeler" subtitle={`${workplaces.length} kayıt`} />
      <div className="space-y-6 px-5">
        <Card className="overflow-hidden">
          {workplaces.length === 0 ? (
            <EmptyState icon={Building2} title="Kayıtlı işletme bulunmuyor" />
          ) : (
            <ul className="divide-y divide-line">
              {workplaces.map((w) => (
                <li key={w.id}>
                  <Link href={`/admin/workplaces/${w.id}`} className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app">
                    <IconTile icon={QrCode} tone={w.active ? "info" : "neutral"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{w.name}</p>
                      <p className="text-xs text-muted">{staffCount(w.id)} aktif personel</p>
                    </div>
                    {!w.active && <Badge tone="danger">Pasif</Badge>}
                    <ChevronRight className="-mr-1 size-4 shrink-0 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <SectionTitle>Yeni İşletme</SectionTitle>
          <CreateWorkplaceForm />
        </div>
      </div>
    </>
  );
}
