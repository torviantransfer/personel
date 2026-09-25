import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { EditWorkplaceForm, RegenerateQrButton } from "@/components/admin/WorkplaceForms";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { qrSvg } from "@/lib/qr";
import { getWorkplace, listStaff } from "@/services/admin";

export const metadata = { title: "İşletme" };

export default async function WorkplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [workplace, staff] = await Promise.all([getWorkplace(id), listStaff()]);
  if (!workplace) notFound();

  const svg = await qrSvg(workplace.qr_token);
  const staffCount = staff.filter((s) => s.workplace_id === id && s.active).length;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/workplaces", label: "İşletmeler" }}
        title={workplace.name}
        subtitle={
          <span className="flex items-center gap-2">
            {workplace.active ? (
              <Badge tone="success" dot>
                Aktif
              </Badge>
            ) : (
              <Badge tone="danger" dot>
                Pasif
              </Badge>
            )}
            <span>{staffCount} aktif personel</span>
          </span>
        }
      />
      <div className="space-y-6 px-5">
        <Card className="p-5">
          <div className="mx-auto w-full max-w-60 rounded-2xl border border-line p-3">
            <div className={`[&>svg]:h-auto [&>svg]:w-full ${workplace.active ? "" : "opacity-40"}`} dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <p className="mt-3 text-center text-[13px] font-medium text-muted">Giriş-Çıkış QR Kodu</p>
          <div className="mt-5 grid gap-3">
            <Link
              href={`/print/${workplace.id}`}
              className="tap flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-white active:bg-primary-dark"
            >
              <Printer className="size-[18px]" />
              Yazdır
            </Link>
            <RegenerateQrButton id={workplace.id} />
          </div>
        </Card>

        <div>
          <SectionTitle>İşletme Bilgileri</SectionTitle>
          <EditWorkplaceForm id={workplace.id} name={workplace.name} active={workplace.active} />
        </div>
      </div>
    </>
  );
}
