// Personel oluşturur (yalnızca yerelde çalıştırın; service_role anahtarı gerekir).
//
// npm run user:create -- --phone "0532 123 45 67" --password "Sifre123" --name "Ahmet Yılmaz" --no P-0001 --workplace "Merkez Ofis"
// İlk genel müdür:  npm run user:create -- --phone "0555 000 00 00" --password "Sifre123" --name "Genel Müdür" --role admin
//
// .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY olmalı.
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const PHONE_EMAIL_DOMAIN = "phone.local"; // lib/phone.ts ile aynı olmalı

try {
  process.loadEnvFile(".env.local");
} catch {
  // ortam değişkenleri zaten tanımlı olabilir
}

const { values } = parseArgs({
  options: {
    phone: { type: "string" },
    password: { type: "string" },
    name: { type: "string" },
    no: { type: "string" },
    workplace: { type: "string" },
    role: { type: "string" },
  },
});

function fail(msg) {
  console.error(`Hata: ${msg}`);
  process.exit(1);
}

let digits = (values.phone ?? "").replace(/\D/g, "");
if (digits.length === 12 && digits.startsWith("90")) digits = digits.slice(2);
if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
if (!/^\d{10}$/.test(digits)) fail('--phone "05xx xxx xx xx" biçiminde olmalı');
if (!values.password || values.password.length < 6) fail("--password en az 6 karakter olmalı");
if (!values.name) fail("--name gerekli");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) fail(".env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli");

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await supabase.auth.admin.createUser({
  email: `${digits}@${PHONE_EMAIL_DOMAIN}`,
  password: values.password,
  email_confirm: true,
  user_metadata: { full_name: values.name, phone: digits, employee_number: values.no ?? "" },
});
if (error) fail(error.message);

const update = { full_name: values.name, phone: digits, employee_number: values.no || null, role: values.role === "admin" ? "admin" : "employee" };
if (values.workplace) {
  const { data: wp, error: wpError } = await supabase.from("workplaces").select("id").eq("name", values.workplace).maybeSingle();
  if (wpError) fail(wpError.message);
  if (!wp) fail(`"${values.workplace}" adında işyeri bulunamadı (kullanıcı yine de oluşturuldu)`);
  update.workplace_id = wp.id;
}

const { error: profileError } = await supabase.from("profiles").update(update).eq("id", data.user.id);
if (profileError) fail(profileError.message);

console.log(`✓ Personel oluşturuldu: ${values.name} (0${digits})`);
