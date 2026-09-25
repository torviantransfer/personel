-- Telefonla giriş: profillere telefon kolonu.
-- Kullanıcılar "5321234567@phone.local" biçiminde e-posta ile oluşturulur;
-- telefon numarası bu adresten (veya user_metadata.phone'dan) alınır.

alter table public.profiles add column if not exists phone text unique;

update public.profiles
set phone = split_part(email, '@', 1)
where phone is null and email like '%@phone.local';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := coalesce(
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when new.email like '%@phone.local' then split_part(new.email, '@', 1) end
  );
begin
  insert into public.profiles (id, email, phone, full_name, employee_number)
  values (
    new.id,
    new.email,
    v_phone,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), v_phone, split_part(coalesce(new.email, ''), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'employee_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
