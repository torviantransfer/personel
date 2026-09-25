"use client";

import { useActionState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { createStaff, deleteStaff, resetPassword, updateStaff } from "@/app/(app)/admin/actions";
import ConfirmAction from "@/components/admin/ConfirmAction";
import { Field, FormMessage, Select, SubmitButton, Toggle, inputClass } from "@/components/admin/Form";
import type { Staff } from "@/services/admin";

type WorkplaceOption = { id: string; name: string; active: boolean };

function WorkplaceSelect({ workplaces, defaultValue }: { workplaces: WorkplaceOption[]; defaultValue?: string | null }) {
  return (
    <Field label="İşletme">
      <Select name="workplace_id" defaultValue={defaultValue ?? ""}>
        <option value="">Seçiniz</option>
        {workplaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
            {w.active ? "" : " (pasif)"}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function RoleSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Field label="Yetki">
      <Select name="role" defaultValue={defaultValue ?? "employee"}>
        <option value="employee">Personel</option>
        <option value="admin">Yönetici</option>
      </Select>
    </Field>
  );
}

export function CreateStaffForm({ workplaces }: { workplaces: WorkplaceOption[] }) {
  const [state, action] = useActionState(createStaff, null);
  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-4 p-5">
        <Field label="Ad Soyad">
          <input name="full_name" required autoComplete="off" autoCapitalize="words" className={inputClass} />
        </Field>
        <Field label="Telefon">
          <input name="phone" type="tel" inputMode="tel" required autoComplete="off" className={inputClass} placeholder="05XX XXX XX XX" />
        </Field>
        <Field label="Şifre">
          <input name="password" type="text" required minLength={6} autoComplete="new-password" autoCapitalize="none" className={inputClass} />
        </Field>
      </div>
      <div className="card space-y-4 p-5">
        <WorkplaceSelect workplaces={workplaces} />
        <Field label="Sicil No">
          <input name="employee_number" autoComplete="off" className={inputClass} />
        </Field>
        <RoleSelect />
      </div>
      <FormMessage state={state} />
      <SubmitButton>Personeli Kaydet</SubmitButton>
    </form>
  );
}

export function EditStaffForm({ staff, workplaces }: { staff: Staff; workplaces: WorkplaceOption[] }) {
  const [state, action] = useActionState(updateStaff, null);
  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="id" value={staff.id} />
      <Field label="Ad Soyad">
        <input name="full_name" required defaultValue={staff.full_name} autoCapitalize="words" className={inputClass} />
      </Field>
      <WorkplaceSelect workplaces={workplaces} defaultValue={staff.workplace_id} />
      <Field label="Sicil No">
        <input name="employee_number" defaultValue={staff.employee_number ?? ""} className={inputClass} />
      </Field>
      <RoleSelect defaultValue={staff.role} />
      <Toggle name="active" label="Hesap aktif" description="Pasif hesap giriş-çıkış yapamaz" defaultChecked={staff.active} />
      <FormMessage state={state} />
      <SubmitButton>Değişiklikleri Kaydet</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: string }) {
  const [state, action] = useActionState(resetPassword, null);
  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="id" value={id} />
      <Field label="Yeni şifre">
        <input name="password" type="text" required minLength={6} autoComplete="new-password" autoCapitalize="none" className={inputClass} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="secondary">
        <KeyRound className="size-[18px]" />
        Şifreyi Güncelle
      </SubmitButton>
    </form>
  );
}

export function DeleteStaffButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmAction
      action={deleteStaff}
      fields={{ id }}
      icon={Trash2}
      label="Personeli Sil"
      title="Personel silinsin mi?"
      description={`${name} ve tüm giriş-çıkış kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz. Kayıtları saklamak için hesabı pasif yapabilirsiniz.`}
      confirmLabel="Sil"
    />
  );
}
