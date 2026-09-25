import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import PrintButton from "@/components/admin/PrintButton";
import { requireAdmin } from "@/lib/auth";
import { qrSvg } from "@/lib/qr";
import { getWorkplace } from "@/services/admin";

// Oturuma bağlı sayfalar: her zaman istek anında çalışır, build sırasında önceden derlenmez.
export const dynamic = "force-dynamic";

export const metadata = { title: "QR Yazdır" };

/** A4'e yazdırılacak QR sayfası (alt menü olmadan). */
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const workplace = await getWorkplace(id);
  if (!workplace) notFound();

  const svg = await qrSvg(workplace.qr_token);

  return (
    <div className="min-h-app bg-white text-ink">
    <main className="safe-top mx-auto flex min-h-app max-w-2xl flex-col bg-white px-6 pb-10 print:min-h-0 print:p-0">
      <div className="flex items-center justify-between py-2 print:hidden">
        <Link href={`/admin/workplaces/${workplace.id}`} className="-ml-2 inline-flex h-10 items-center gap-0.5 pr-3 text-[15px] font-medium text-primary">
          <ChevronLeft className="size-5" />
          Geri
        </Link>
        <PrintButton />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center print:pt-16">
        <p className="text-sm font-bold tracking-[0.2em] text-primary">MESAIGO · GİRİŞ-ÇIKIŞ</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{workplace.name}</h1>
        <div className="mt-10 w-full max-w-md [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-10 text-xl font-semibold">Giriş ve çıkışlarda bu QR kodu okutunuz.</p>
      </div>
    </main>
    </div>
  );
}
