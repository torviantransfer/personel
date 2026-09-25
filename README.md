# MesaiGo

MesaiGo: QR kod ile personel giriş-çıkış takibi. Next.js 16 + TypeScript + Tailwind CSS 4 + Supabase (Auth + PostgreSQL). Uygulama mağazası gerekmez; ana ekrana eklenen bir PWA olarak çalışır.

## Akış

Telefon + şifre ile login → Ana sayfa → **QR KODU OKUT** → uygulama içi kamera → işyeri QR'ı okunur → sunucu + veritabanı doğrular → açık mesai yoksa **GİRİŞ**, varsa **ÇIKIŞ** → başarı ekranı → ana sayfa ve geçmiş güncellenir.

## Proje yapısı

```
app/                 Sayfalar (login, (app)/ ana sayfa, history, profile) + API + manifest
  api/attendance/scan  QR doğrulama endpoint'i (POST)
components/          HomeClient, QrScanner, ResultScreen, BottomNav vb.
lib/                 Supabase istemcileri, süre hesaplama, tarih formatları, hata mesajları
services/            Veri erişimi (Supabase sorguları, scan isteği)
types/               Ortak tipler
public/              sw.js (service worker), offline.html, icons/
supabase/            migrations/ (şema, RLS, fonksiyon) ve seed.sql
proxy.ts             Oturum yenileme + login yönlendirmesi (Next 16'da middleware)
scripts/             İkon üretme betiği (Windows PowerShell)
```

## Kurulum

### 1. Bağımlılıklar

```bash
npm install
```

Node.js 20.9+ gerekir.

### 2. Supabase projesi oluşturma

1. [supabase.com](https://supabase.com) → **New project**.
2. Proje açılınca **Project Settings → API** sayfasından `Project URL` ve `anon` (veya `publishable`) anahtarını alın.
3. **Authentication → Sign In / Providers → Email**: açık olsun. Personeli siz ekleyeceğiniz için **"Allow new users to sign up"** seçeneğini kapatmanız önerilir.

### 3. SQL migration'ı çalıştırma

**SQL Editor**'de sırayla çalıştırın:

1. [supabase/migrations/20260925000000_init.sql](supabase/migrations/20260925000000_init.sql)
2. [supabase/migrations/20260925010000_phone_login.sql](supabase/migrations/20260925010000_phone_login.sql)
3. [supabase/migrations/20260925020000_workplace_lock.sql](supabase/migrations/20260925020000_workplace_lock.sql)
4. [supabase/seed.sql](supabase/seed.sql) (örnek işyeri)

Migration'lar tekrar çalıştırılabilir (idempotent).

(Supabase CLI kullanıyorsanız: `npx supabase link --project-ref <ref>` ve `npx supabase db push`.)

**Personel ekleme (telefon + şifre):**

Personel telefon numarası ve şifre ile giriş yapar; SMS sağlayıcısı gerekmez. Numara arka planda `5321234567@phone.local` biçiminde bir e-postaya çevrilir, kullanıcı bunu hiç görmez.

Önerilen yol (yerelde, `.env.local` içinde `SUPABASE_SERVICE_ROLE_KEY` gerekir):

```bash
npm run user:create -- --phone "0532 123 45 67" --password "Sifre123" --name "Ahmet Yılmaz" --no P-0001 --workplace "Merkez Ofis"
```

Panelden eklemek isterseniz: **Authentication → Users → Add user → Create new user**, e-posta alanına `5321234567@phone.local` (başında 0 olmadan 10 hane), şifre girin, "Auto Confirm User" işaretli olsun. Ardından:

```sql
update public.profiles
set full_name = 'Ahmet Yılmaz',
    employee_number = 'P-0001',
    workplace_id = (select id from public.workplaces where name = 'Merkez Ofis')
where phone = '5321234567';
```

Şifre sıfırlama: **Authentication → Users** → kullanıcı → **Reset password** yerine şifreyi doğrudan değiştirin (e-posta gönderilemez).

**İşyeri QR kodu oluşturma:**

```sql
select name, 'WORKPLACE:' || qr_token as qr_content from public.workplaces;
```

Çıkan `qr_content` metnini (ör. `WORKPLACE:8f8d81ae-a379-...`) herhangi bir QR üreticiyle QR'a çevirip giriş noktasına asın. QR'da kullanıcı bilgisi veya anahtar bulunmaz. QR'ı iptal etmek için `update workplaces set qr_token = gen_random_uuid()::text where ...` ile token'ı yenileyin veya `active = false` yapın.

### 4. `.env.local` oluşturma

```bash
cp .env.example .env.local
```

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable anahtar (tarayıcıda görünmesi güvenlidir, RLS korur) |
| `NEXT_PUBLIC_APP_TIMEZONE` | Opsiyonel. Saat gösterimi ve gün gruplaması için saat dilimi. Varsayılan `Europe/Istanbul` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sadece sunucu.** Yönetim paneli ve `npm run user:create` için. Vercel'e de eklenir; `NEXT_PUBLIC_` ile başlatmayın, tarayıcıya gönderilmez |

Personelin giriş-çıkış kaydı `service_role` kullanmaz; veritabanındaki `record_attendance()` fonksiyonu kullanıcının kendi JWT'si ile yapar. `service_role` yalnızca yönetici yetkisi sunucuda doğrulandıktan sonra (`requireAdmin()`) panel işlemlerinde kullanılır ([lib/supabase/admin.ts](lib/supabase/admin.ts), `server-only`).

### 5. Geliştirme

```bash
npm run dev
```

http://localhost:3000 — `localhost` güvenli kabul edildiği için kamera masaüstünde çalışır. Telefonda test için HTTPS gerekir (Vercel preview veya `next dev --experimental-https`).

Kontroller:

```bash
npm run typecheck
npm run lint
npm run build
```

Service worker yalnızca production build'de kaydolur.

### 6. Vercel'e deploy

1. Projeyi GitHub'a gönderin.
2. [vercel.com](https://vercel.com) → **Add New → Project** → repoyu seçin (Framework: Next.js otomatik algılanır).
3. **Environment Variables** kısmına `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (yönetim paneli için) ve istenirse `NEXT_PUBLIC_APP_TIMEZONE` ekleyin.
4. **Deploy**. Vercel otomatik HTTPS sağlar (kamera için zorunlu).
5. Supabase → **Authentication → URL Configuration → Site URL** alanına Vercel adresinizi yazın.

### 7. Android'e yükleme (Chrome)

1. Chrome ile site adresini açın ve telefon numarası + şifre ile giriş yapın.
2. Sağ üst **⋮** menü → **Ana ekrana ekle** / **Uygulamayı yükle**.
3. Ana ekrandaki **Personel** ikonundan açın; adres çubuğu olmadan tam ekran açılır.
4. İlk QR okutmada kamera iznine **İzin ver** deyin.

### 8. iPhone ana ekranına ekleme (Safari)

1. **Safari** ile site adresini açın (iOS'ta ana ekrana ekleme Safari'den yapılmalıdır; iOS 16.4+ ile diğer tarayıcıların paylaş menüsünden de mümkündür).
2. Alt ortadaki **Paylaş** (kare ve ok) → **Ana Ekrana Ekle** → **Ekle**.
3. Ana ekrandaki **Personel** ikonundan açın ve giriş yapın. Oturum açık kalır.
4. İlk QR okutmada kamera izni istenir. Reddedildiyse: **Ayarlar → Safari → Kamera → Sor/İzin Ver**, ardından uygulamayı kapatıp açın.

## Yönetim paneli (genel müdür)

Rolü `admin` olan kullanıcı aynı giriş ekranından girer ve `/admin` paneline yönlenir:

- **Bugün:** kim mesaide / çıktı / gelmedi, işletmeye göre filtre, arama.
- **Rapor:** günlük (giriş, çıkış, durum) ve aylık (geldiği gün) tablo, Excel'e aktarma.
- **Personel:** ekleme, düzenleme, fotoğraf yükleme, pasif yapma, şifre değiştirme, silme, son 2 aylık kayıtlar.
- **İşletmeler:** yeni işletme ekleme, QR görüntüleme, **Yazdır** (A4 sayfa), **QR Yenile** (eski QR anında geçersiz olur), işletmeyi pasif yapma.

Personel uygulaması tek ekrandır: QR okutulur, girişte "Hoş geldiniz, iyi çalışmalar", çıkışta "Güle güle" ekranı gösterilir.

Personel fotoğrafları Supabase Storage'daki herkese açık `avatars` kovasında tutulur (ilk yüklemede otomatik oluşur). Fotoğraflar yüklenmeden önce cihazda 512×512 JPEG'e küçültülür.

İlk genel müdürü oluşturmak için (yerelde):

```bash
npm run user:create -- --phone "0555 000 00 00" --password "Sifre123" --name "Genel Müdür" --role admin
```

veya mevcut bir kullanıcıyı: `update profiles set role = 'admin' where phone = '5550000000';`

Personel yalnızca **kendi işletmesinin** QR kodunu okutabilir; başka işletmenin QR'ı "Bu QR size ait değil" hatası verir (veritabanında kontrol edilir).

## Bildirimler

Genel müdür panelde **Bugün → zil simgesi → Bildirim Gönder** ile tüm personele veya bir işletmeye bildirim gönderir. Bildirim telefonun kendi bildirim sesiyle gelir (Android'de titreşimle). Ücretsizdir (Web Push; Google/Apple bildirim servisleri).

- Personel ana ekrandaki **Bildirimleri açın** kartından bir kez izin verir.
- iPhone'da iOS 16.4 ve üzeri gerekir (uygulama ana ekrana eklenmiş olmalı).
- Abonelikler Supabase Storage'daki özel `push` kovasında tutulur (ilk kullanımda otomatik oluşur, SQL gerekmez). Çıkış yapan cihazın aboneliği silinir.
- Ortam değişkenleri: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`npx web-push generate-vapid-keys` ile üretilir, Vercel'e de eklenir).

## Yalnızca uygulama olarak çalışma

Canlı sürümde uygulama **yalnızca ana ekrana eklenmiş halde** (standalone) açılır. Adres tarayıcıda açılırsa uygulama yerine kurulum ekranı gösterilir:

- **iPhone:** Paylaş → Ana Ekrana Ekle adımları
- **Android:** "Uygulamayı Yükle" düğmesi (tarayıcı desteklemiyorsa menü adımları)
- **Bilgisayar:** telefonla okutulacak QR kod

`npm run dev` ile geliştirme sırasında bu kontrol devre dışıdır. Site arama motorlarına kapalıdır (`robots.txt`, `noindex` meta ve `X-Robots-Tag` başlığı).

## Güvenlik

- Tüm tablolarda **RLS** açık. Personel yalnızca kendi profilini ve kendi `attendance` kayıtlarını okuyabilir.
- Tarayıcı rolleri tablolara **yazamaz** (INSERT/UPDATE/DELETE yetkisi kaldırıldı). Kayıt yalnızca `record_attendance()` (security definer) ile oluşur.
- `workplaces.qr_token` kolonu personele kolon bazlı yetkiyle **kapalıdır**; token sadece veritabanında karşılaştırılır.
- Kullanıcı kimliği istemciden alınmaz, JWT'den (`auth.uid()`) gelir.
- **Çift kayıt koruması:** kullanıcı başına `pg_advisory_xact_lock` + 30 sn cooldown (aynı QR arka arkaya gönderilirse "Zaten giriş/çıkış yapılmış" döner). İstemcide ayrıca kamera ilk okumada durur ve 3 sn cooldown uygulanır.
- API aynı-origin kontrolü yapar; QR formatı sunucuda da doğrulanır.

## İş kuralları

- Açık mesai (son kayıt `IN`) yoksa QR → `IN`, varsa → `OUT`.
- 16 saatten eski ve kapatılmamış bir giriş, unutulmuş çıkış kabul edilir; sonraki okutma yeni bir `IN` açar (geçmişte "çıkış yok" görünür). Süre `record_attendance()` ve `lib/attendance.ts` içinde aynıdır.
- Çalışma süresi IN/OUT çiftlerinden hesaplanır; mesaideyken ana sayfada canlı güncellenir.

## İkonlar

`public/icons` hazırdır. Yeniden üretmek için (Windows): `powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1`. Kendi logonuzu kullanacaksanız aynı dosya adları ve boyutlarla değiştirin.
