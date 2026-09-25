import PageHeader from "@/components/PageHeader";
import { CreateStaffForm } from "@/components/admin/StaffForms";
import { listWorkplaces } from "@/services/admin";

export const metadata = { title: "Yeni Personel" };

export default async function NewStaffPage() {
  const workplaces = await listWorkplaces();
  return (
    <>
      <PageHeader back={{ href: "/admin/staff", label: "Personel" }} title="Yeni Personel" />
      <div className="px-5">
        <CreateStaffForm workplaces={workplaces.map(({ id, name, active }) => ({ id, name, active }))} />
      </div>
    </>
  );
}
