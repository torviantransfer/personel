-- Personel yalnızca kendi işletmesinin (profiles.workplace_id) QR kodunu okutabilir.
-- Başka işletmenin QR'ı -> WRONG_WORKPLACE, işletmesi atanmamış personel -> NO_WORKPLACE.

create or replace function public.record_attendance(p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid           uuid := auth.uid();
  v_cooldown      constant interval := interval '30 seconds';
  v_max_shift     constant interval := interval '16 hours';
  v_active        boolean;
  v_workplace_id  uuid;
  v_wp            public.workplaces%rowtype;
  v_last          public.attendance%rowtype;
  v_has_last      boolean;
  v_type          text;
  v_row           public.attendance%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('attendance:' || v_uid::text, 0));

  select p.active, p.workplace_id into v_active, v_workplace_id from public.profiles p where p.id = v_uid;
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
  if v_workplace_id is null then
    return jsonb_build_object('ok', false, 'code', 'NO_WORKPLACE');
  end if;
  if v_workplace_id <> v_wp.id then
    return jsonb_build_object('ok', false, 'code', 'WRONG_WORKPLACE');
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
      'code', case when v_last.type = 'OUT' then 'ALREADY_CHECKED_OUT' else 'ALREADY_CHECKED_IN' end
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

create index if not exists attendance_created_idx on public.attendance (created_at desc);
