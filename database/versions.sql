begin;
create table public.forme_versions (
 form_id uuid not null references public.forme_forms(id) on delete cascade,
 revision integer not null, document jsonb not null, created_at timestamptz not null default now(),
 primary key(form_id,revision)
);
alter table public.forme_versions enable row level security;
revoke all on public.forme_versions from anon,authenticated;
grant select on public.forme_versions to authenticated;
grant all on public.forme_versions to service_role;
create policy owner_versions_read on public.forme_versions for select to authenticated using (exists(select 1 from public.forme_forms f where f.id=form_id and f.owner_id=(select auth.uid())));
create function public.forme_save_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.forme_versions(form_id,revision,document) values(new.id,new.revision,new.document) on conflict do nothing;
 delete from public.forme_versions where form_id=new.id and revision<new.revision-49;
 return new;
end;$$;
revoke execute on function public.forme_save_version() from public,anon,authenticated;
grant execute on function public.forme_save_version() to service_role;
create trigger forme_version_after_save after insert or update of revision on public.forme_forms for each row execute function public.forme_save_version();
create function public.forme_close(p_id uuid,p_owner uuid,p_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare f public.forme_forms; d jsonb;
begin
 select * into f from public.forme_forms where id=p_id and owner_id=p_owner for update;
 if not found then raise exception 'FORM_NOT_FOUND';end if;
 if f.revision<>p_revision then raise exception 'FORM_CHANGED';end if;
 d=jsonb_set(jsonb_set(f.document,'{status}','"closed"'),'{revision}',to_jsonb(f.revision+1));
 update public.forme_publications set accepting=false where form_id=p_id;
 update public.forme_forms set document=d,revision=revision+1,updated_at=now() where id=p_id;
 return d;
end;$$;
revoke execute on function public.forme_close(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.forme_close(uuid,uuid,integer) to service_role;
insert into public.forme_versions(form_id,revision,document) select id,revision,document from public.forme_forms on conflict do nothing;
commit;
