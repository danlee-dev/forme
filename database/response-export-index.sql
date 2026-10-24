-- Run separately, outside a transaction. Additive; keeps the existing index.
-- Supports form-scoped timestamp/id keyset export and deterministic table order.
create index concurrently if not exists forme_submissions_export_cursor
on public.forme_submissions (form_id, created_at, id);
