"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AVATAR_BUCKET, ensureAvatarBucket } from "@/lib/avatars";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string; success?: string } | null;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const uuidOrNull = (v: string) => (/^[0-9a-f-]{36}$/i.test(v) ? v : null);

// ---------------------------------------------------------------- Personel

export async function createStaff(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const fullName = text(form, "full_name");
  const phone = normalizePhone(text(form, "phone"));
  const password = text(form, "password");
  const employeeNumber = text(form, "employee_number") || null;
  const workplaceId = uuidOrNull(text(form, "workplace_id"));
  const role = text(form, "role") === "admin" ? "admin" : "employee";

  if (fullName.length < 2) return { error: "Ad soyad giriniz." };
  if (!phone) return { error: "Geçerli bir telefon numarası giriniz." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };
  if (role === "employee" && !workplaceId) return { error: "İşletme seçiniz." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: phoneToEmail(phone),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (error || !data.user) {
    return { error: /already|exists|registered/i.test(error?.message ?? "") ? "Bu telefon numarası zaten kayıtlı." : "Personel oluşturulamadı." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, phone, employee_number: employeeNumber, workplace_id: workplaceId, role, active: true })
    .eq("id", data.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.code === "23505" ? "Bu personel numarası zaten kullanılıyor." : "Profil kaydedilemedi." };
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/staff/${data.user.id}`);
}

export async function updateStaff(_: ActionState, form: FormData): Promise<ActionState> {
  const { userId } = await requireAdmin();
  const id = uuidOrNull(text(form, "id"));
  const fullName = text(form, "full_name");
  const employeeNumber = text(form, "employee_number") || null;
  const workplaceId = uuidOrNull(text(form, "workplace_id"));
  const active = form.get("active") === "on";
  const role = text(form, "role") === "admin" ? "admin" : "employee";

  if (!id) return { error: "Geçersiz personel." };
  if (fullName.length < 2) return { error: "Ad soyad giriniz." };
  if (id === userId && (!active || role !== "admin")) return { error: "Kendi yetkinizi değiştiremezsiniz." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ full_name: fullName, employee_number: employeeNumber, workplace_id: workplaceId, active, role })
    .eq("id", id);
  if (error) return { error: error.code === "23505" ? "Bu personel numarası zaten kullanılıyor." : "Kaydedilemedi." };

  revalidatePath("/admin", "layout");
  return { success: "Kaydedildi." };
}

export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = uuidOrNull(text(form, "id"));
  const password = text(form, "password");
  if (!id) return { error: "Geçersiz personel." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };

  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password });
  if (error) return { error: "Şifre değiştirilemedi." };
  return { success: "Yeni şifre kaydedildi." };
}

/** Personeli ve tüm giriş-çıkış kayıtlarını kalıcı olarak siler (auth.users → profiles → attendance cascade). */
export async function deleteStaff(_: ActionState, form: FormData): Promise<ActionState> {
  const { userId } = await requireAdmin();
  const id = uuidOrNull(text(form, "id"));
  if (!id) return { error: "Geçersiz personel." };
  if (id === userId) return { error: "Kendi hesabınızı silemezsiniz." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: "Personel silinemedi." };
  await admin.storage.from(AVATAR_BUCKET).remove([`${id}.jpg`]);

  revalidatePath("/admin", "layout");
  redirect("/admin/staff");
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Personel fotoğrafı yükler (istemcide 512px JPEG'e küçültülmüş olarak gelir). */
export async function uploadAvatar(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = uuidOrNull(text(form, "id"));
  const file = form.get("photo");
  if (!id) return { error: "Geçersiz personel." };
  if (!(file instanceof File) || file.size === 0) return { error: "Fotoğraf seçiniz." };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { error: "Desteklenmeyen dosya türü." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Fotoğraf çok büyük." };

  await ensureAvatarBucket();
  const { error } = await createAdminClient()
    .storage.from(AVATAR_BUCKET)
    .upload(`${id}.jpg`, file, { upsert: true, contentType: file.type, cacheControl: "31536000" });
  if (error) return { error: "Fotoğraf yüklenemedi." };

  revalidatePath("/", "layout");
  return { success: "Fotoğraf güncellendi." };
}

export async function removeAvatar(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = uuidOrNull(text(form, "id"));
  if (!id) return { error: "Geçersiz personel." };
  await createAdminClient().storage.from(AVATAR_BUCKET).remove([`${id}.jpg`]);
  revalidatePath("/", "layout");
  return { success: "Fotoğraf kaldırıldı." };
}

// ---------------------------------------------------------------- İşletmeler

export async function createWorkplace(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = text(form, "name");
  if (name.length < 2) return { error: "İşletme adı giriniz." };

  const { data, error } = await createAdminClient().from("workplaces").insert({ name }).select("id").single();
  if (error) return { error: "İşletme eklenemedi." };

  revalidatePath("/admin", "layout");
  redirect(`/admin/workplaces/${data.id}`);
}

export async function updateWorkplace(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = uuidOrNull(text(form, "id"));
  const name = text(form, "name");
  const active = form.get("active") === "on";
  if (!id) return { error: "Geçersiz işletme." };
  if (name.length < 2) return { error: "İşletme adı giriniz." };

  const { error } = await createAdminClient().from("workplaces").update({ name, active }).eq("id", id);
  if (error) return { error: "Kaydedilemedi." };

  revalidatePath("/admin", "layout");
  return { success: "Kaydedildi." };
}

/** Yeni QR üretir; eski QR anında geçersiz olur (yırtılan/kaybolan QR için). */
export async function regenerateQr(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = uuidOrNull(text(form, "id"));
  if (!id) return { error: "Geçersiz işletme." };

  const { error } = await createAdminClient().from("workplaces").update({ qr_token: randomUUID() }).eq("id", id);
  if (error) return { error: "QR yenilenemedi." };

  revalidatePath("/admin", "layout");
  return { success: "QR kod yenilendi. Önceki QR kod geçersizdir." };
}

// ---------------------------------------------------------------- Bildirimler

/** Personele sesli bildirim gönderir (tümüne veya bir işletmeye). */
export async function sendNotification(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = text(form, "title").slice(0, 80);
  const body = text(form, "body").slice(0, 240);
  const workplaceId = uuidOrNull(text(form, "workplace_id"));
  if (title.length < 2) return { error: "Başlık giriniz." };
  if (body.length < 2) return { error: "Mesaj giriniz." };

  let query = createAdminClient().from("profiles").select("id").eq("active", true);
  if (workplaceId) query = query.eq("workplace_id", workplaceId);
  const { data, error } = await query;
  if (error) return { error: "Personel listesi alınamadı." };

  try {
    const { sendToUsers } = await import("@/lib/push");
    const sent = await sendToUsers(
      (data ?? []).map((p) => p.id as string),
      { title, body, url: "/", tag: `duyuru-${Date.now()}` },
    );
    if (sent === 0) return { error: "Bildirimleri açmış personel bulunamadı." };
    return { success: `Bildirim ${sent} cihaza gönderildi.` };
  } catch (err) {
    console.error("sendNotification failed", err);
    return { error: "Bildirim gönderilemedi." };
  }
}
