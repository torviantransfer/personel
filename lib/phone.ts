/**
 * Telefonla giriş: Supabase'in SMS gerektiren telefon girişi yerine numara,
 * kullanıcıya hiç gösterilmeyen sabit bir e-posta adresine çevrilir.
 * Örn. "0532 123 45 67" → "5321234567@phone.local"
 * scripts/create-user.mjs aynı kuralı kullanır.
 */
export const PHONE_EMAIL_DOMAIN = "phone.local";

/** Numarayı 10 haneli yerel biçime çevirir (5321234567). Geçersizse null. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : null;
}

export function phoneToEmail(phone: string): string {
  return `${phone}@${PHONE_EMAIL_DOMAIN}`;
}

/** "5321234567" → "0532 123 45 67" */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone || !/^\d{10}$/.test(phone)) return phone ?? "";
  return `0${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8)}`;
}
