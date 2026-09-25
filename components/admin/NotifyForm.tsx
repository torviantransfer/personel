"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { sendNotification } from "@/app/(app)/admin/actions";
import { Field, FormMessage, Select, SubmitButton, inputClass } from "@/components/admin/Form";

export default function NotifyForm({ workplaces }: { workplaces: { id: string; name: string }[] }) {
  const [state, action] = useActionState(sendNotification, null);
  return (
    <form action={action} className="card space-y-4 p-5">
      <Field label="Başlık">
        <input name="title" required maxLength={80} autoComplete="off" className={inputClass} />
      </Field>
      <Field label="Mesaj">
        <textarea name="body" required maxLength={240} rows={4} className={`${inputClass} h-auto resize-none py-3`} />
      </Field>
      <Field label="Alıcılar">
        <Select name="workplace_id" defaultValue="">
          <option value="">Tüm personel</option>
          {workplaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage state={state} />
      <SubmitButton>
        <Send className="size-[18px]" />
        Bildirimi Gönder
      </SubmitButton>
    </form>
  );
}
