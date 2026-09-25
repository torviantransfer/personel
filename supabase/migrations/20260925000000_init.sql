-- =====================================================================
-- Personel Giriş Takip Sistemi - İlk şema
-- Supabase SQL Editor'de tek seferde çalıştırılabilir.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- TABLOLAR
-- ---------------------------------------------------------------------

create table if not exists public.workplaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  qr_token    text not null unique default gen_random_uuid()::text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text not null default '',
  email            text,
  employee_number  text unique,
  role             text not null default 'employee' check (role in ('employee', 'admin')),
  workplace_id     uuid references public.workplaces (id) on delete set null,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.attendance (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.profiles (id) on delete cascade,
  workplace_id  uuid not null references public.workplaces (id) on delete restrict,
  type          text not null check (type in ('IN', 'OUT')),
  created_at    timestamptz not null default now()
);

create index if not exists attendance_employee_created_idx
  on public.attendance (employee_id, created_at desc);
create index if not exists profiles_workplace_idx on public.profiles (workplace_id);
create index if not exists attendance_workplace_idx on public.attendance (workplace_id);

-- ---------------------------------------------------------------------
-- YENİ KULLANICI -> PROFİL
-- Supabase Auth'ta kullanıcı oluşturulduğunda profil satırı otomatik açılır.
-- user_metadata içinde full_name / employee_number verilebilir.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, employee_number)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'employee_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.profiles   enable row level security;
alter table public.workplaces enable row level security;
alter table public.attendance enable row level security;

-- Tarayıcıdan yalnızca OKUMA yapılabilir. Yazma işlemleri sadece
-- record_attendance() fonksiyonu (security definer) üzerinden olur.
revoke all on public.profiles   from anon, authenticated;
revoke all on public.workplaces from anon, authenticated;
revoke all on public.attendance from anon, authenticated;

grant select on public.profiles   to authenticated;
grant select on public.attendance to authenticated;
-- qr_token kolonu personele ASLA açılmaz (kolon bazlı yetki).
grant select (id, name, active) on public.workplaces to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "attendance_select_own" on public.attendance;
create policy "attendance_select_own" on public.attendance
  for select to authenticated
  using (employee_id = (select auth.uid()));

-- Personel yalnızca kendi şubesini ve kayıtlarında geçen işyerlerini görebilir.
drop policy if exists "workplaces_select_related" on public.workplaces;
create policy "workplaces_select_related" on public.workplaces
  for select to authenticated
  using (
    id in (select p.workplace_id from public.profiles p where p.id = (select auth.uid()))
    or exists (
      select 1 from public.attendance a
      where a.workplace_id = workplaces.id and a.employee_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- QR İLE GİRİŞ / ÇIKIŞ
-- - Kullanıcı kimliği JWT'den (auth.uid()) alınır, istemciden alınmaz.
-- - Kullanıcı başına advisory lock: eşzamanlı istekler sıraya girer,
--   çift kayıt oluşamaz.
-- - 30 sn cooldown: aynı QR arka arkaya gönderilirse yeni kayıt açılmaz.
-- - Açık mesai yoksa IN, varsa OUT. 16 saatten eski açık mesai kapanmamış
--   sayılır ve yeni bir IN açılır (unutulan çıkışlar için).
-- ---------------------------------------------------------------------

create or replace function public.record_attendance(p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := auth.uid();
  v_cooldown   constant interval := interval '30 seconds';
  v_max_shift  constant interval := interval '16 hours';
  v_active     boolean;
  v_wp         public.workplaces%rowtype;
  v_last       public.attendance%rowtype;
  v_has_last   boolean;
  v_type       text;
  v_row        public.attendance%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('attendance:' || v_uid::text, 0));

  select p.active into v_active from public.profiles p where p.id = v_uid;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  end if;
  if not v_active then
    return jsonb_build_object('ok', false, 'code', 'ACCOUNT_INACTIVE');
  end if;

  select * into v_wp from public.workplaces w where w.qr_token = p_qr_token;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'INVALID_QR');
  end if;
  if not v_wp.active then
    return jsonb_build_object('ok', false, 'code', 'WORKPLACE_INACTIVE');
  end if;

  select * into v_last
  from public.attendance a
  where a.employee_id = v_uid
  order by a.created_at desc
  limit 1;
  v_has_last := found;

  if v_has_last and v_last.created_at > now() - v_cooldown then
    return jsonb_build_object(
      'ok', false,
      'code', case when v_last.type = 'OUT' then 'ALREADY_CHECKED_OUT' else 'ALREADY_CHECKED_IN' end,
      'created_at', v_last.created_at
    );
  end if;

  if v_has_last and v_last.type = 'IN' and v_last.created_at > now() - v_max_shift then
    v_type := 'OUT';
  else
    v_type := 'IN';
  end if;

  insert into public.attendance (employee_id, workplace_id, type)
  values (v_uid, v_wp.id, v_type)
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'record', jsonb_build_object(
      'id', v_row.id,
      'type', v_row.type,
      'created_at', v_row.created_at,
      'workplace_name', v_wp.name
    )
  );
end;
$$;

revoke all on function public.record_attendance(text) from public, anon;
grant execute on function public.record_attendance(text) to authenticated;
