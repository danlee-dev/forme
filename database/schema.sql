begin;
create table public.forme_forms (
 id uuid primary key, owner_id uuid references auth.users(id) on delete cascade not null,
 document jsonb not null, revision integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index forme_forms_owner on public.forme_forms(owner_id,updated_at desc);
create table public.forme_publications (
 form_id uuid primary key references public.forme_forms(id) on delete cascade,
 slug text unique not null check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
 document jsonb not null, accepting boolean not null default true,
 closes_at timestamptz, response_limit integer, response_count integer not null default 0, updated_at timestamptz not null default now()
);
create table public.forme_submissions (
 id uuid primary key default gen_random_uuid(), form_id uuid not null references public.forme_forms(id) on delete cascade,
 answers jsonb not null, field_labels jsonb not null default '{}', idempotency_key uuid not null,
 delivery_status text not null default 'not_connected', created_at timestamptz not null default now(),
 unique(form_id,idempotency_key), check (octet_length(answers::text)<=100000)
);
create index forme_submissions_form on public.forme_submissions(form_id,created_at desc);
create table public.forme_integrations (
 form_id uuid primary key references public.forme_forms(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 encrypted_config text not null, updated_at timestamptz not null default now()
);
create table public.forme_api_keys (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null, prefix text not null, token_hash text unique not null,
 created_at timestamptz not null default now(), last_used_at timestamptz
);
create index forme_api_keys_owner on public.forme_api_keys(owner_id);
create table public.forme_limits (bucket text primary key, hits integer not null default 1, expires_at timestamptz not null);
alter table public.forme_forms enable row level security;
alter table public.forme_publications enable row level security;
alter table public.forme_submissions enable row level security;
alter table public.forme_integrations enable row level security;
alter table public.forme_api_keys enable row level security;
alter table public.forme_limits enable row level security;
revoke all on public.forme_forms,public.forme_publications,public.forme_submissions,public.forme_integrations,public.forme_api_keys,public.forme_limits from anon, authenticated;
grant select on public.forme_forms,public.forme_submissions to authenticated;
create policy own_forms_read on public.forme_forms for select to authenticated using ((select auth.uid())=owner_id);
create policy own_responses_read on public.forme_submissions for select to authenticated using (exists(select 1 from public.forme_forms f where f.id=form_id and f.owner_id=(select auth.uid())));
grant all on public.forme_forms,public.forme_publications,public.forme_submissions,public.forme_integrations,public.forme_api_keys,public.forme_limits to service_role;
create function public.forme_consume_limit(p_bucket text,p_limit integer,p_window integer) returns boolean
language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.forme_limits(bucket,hits,expires_at) values(p_bucket,1,now()+make_interval(secs=>p_window))
 on conflict(bucket) do update set hits=case when public.forme_limits.expires_at<now() then 1 else public.forme_limits.hits+1 end, expires_at=case when public.forme_limits.expires_at<now() then now()+make_interval(secs=>p_window) else public.forme_limits.expires_at end returning hits into n;
 if random()<0.01 then delete from public.forme_limits where expires_at<now()-interval '1 day';end if;
 return n<=p_limit;
end;$$;
create function public.forme_submit(p_slug text,p_answers jsonb,p_labels jsonb,p_key uuid,p_revision integer) returns uuid
language plpgsql security invoker set search_path='' as $$
declare p public.forme_publications; result uuid;
begin
 select * into p from public.forme_publications where slug=p_slug for update;
 if not found then raise exception 'FORM_NOT_FOUND';end if;
 select id into result from public.forme_submissions where form_id=p.form_id and idempotency_key=p_key;
 if result is not null then return result;end if;
 if not p.accepting or (p.closes_at is not null and p.closes_at<=now()) or (p.response_limit is not null and p.response_count>=p.response_limit) then raise exception 'FORM_CLOSED';end if;
 if coalesce((p.document->>'revision')::integer,0)<>p_revision then raise exception 'FORM_CHANGED';end if;
 insert into public.forme_submissions(form_id,answers,field_labels,idempotency_key) values(p.form_id,p_answers,p_labels,p_key) returning id into result;
 update public.forme_publications set response_count=response_count+1 where form_id=p.form_id;
 return result;
end;$$;
create function public.forme_publish(p_id uuid,p_owner uuid,p_revision integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare f public.forme_forms; d jsonb;
begin
 select * into f from public.forme_forms where id=p_id and owner_id=p_owner for update;
 if not found then raise exception 'FORM_NOT_FOUND';end if;
 if f.revision<>p_revision then raise exception 'FORM_CHANGED';end if;
 d=jsonb_set(f.document,'{status}','"published"');
 insert into public.forme_publications(form_id,slug,document,accepting,closes_at,response_limit)
 values(f.id,d->>'slug',d,true,(d->>'closesAt')::timestamptz,(d->>'responseLimit')::integer)
 on conflict(form_id) do update set slug=excluded.slug,document=excluded.document,accepting=true,closes_at=excluded.closes_at,response_limit=excluded.response_limit,updated_at=now();
 update public.forme_forms set document=d,updated_at=now() where id=f.id;
 return d;
end;$$;
revoke execute on function public.forme_consume_limit(text,integer,integer),public.forme_submit(text,jsonb,jsonb,uuid,integer),public.forme_publish(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.forme_consume_limit(text,integer,integer),public.forme_submit(text,jsonb,jsonb,uuid,integer),public.forme_publish(uuid,uuid,integer) to service_role;
commit;
