"use client";

import { useActionState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { createWorkplace, regenerateQr, updateWorkplace } from "@/app/(app)/admin/actions";
import ConfirmAction from "@/components/admin/ConfirmAction";
import { Field, FormMessage, SubmitButton, Toggle, inputClass } from "@/components/admin/Form";

export function CreateWorkplaceForm() {
  const [state, action] = useActionState(createWorkplace, null);
  return (
    <form action={action} className="card space-y-4 p-5">
      <Field label="İşletme adı">
        <input name="name" required autoComplete="off" autoCapitalize="words" className={inputClass} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>
        <Plus className="size-[18px]" />
        İşletme Ekle
      </SubmitButton>
    </form>
  );
}

export function EditWorkplaceForm({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [state, action] = useActionState(updateWorkplace, null);
  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="id" value={id} />
      <Field label="İşletme adı">
        <input name="name" required defaultValue={name} autoCapitalize="words" className={inputClass} />
      </Field>
      <Toggle name="active" label="İşletme aktif" description="Pasif işletmede QR ile giriş-çıkış yapılamaz" defaultChecked={active} />
      <FormMessage state={state} />
      <SubmitButton>Değişiklikleri Kaydet</SubmitButton>
    </form>
  );
}

export function RegenerateQrButton({ id }: { id: string }) {
  return (
    <ConfirmAction
      action={regenerateQr}
      fields={{ id }}
      icon={RefreshCw}
      label="QR Kodu Yenile"
      title="QR kod yenilensin mi?"
      description="Mevcut QR kod geçersiz olacak. Yeni QR kodu yazdırıp giriş noktasına asmanız gerekir."
      confirmLabel="Yenile"
      tone="primary"
    />
  );
}
