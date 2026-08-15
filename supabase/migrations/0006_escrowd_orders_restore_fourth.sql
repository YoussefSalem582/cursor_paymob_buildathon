-- Scope Guard migrations were applied on this project again after 0005.
-- They renamed Escrowd `orders` to `orders_legacy_pre_escrowd_<epoch>` and
-- recreated `clients` / `orders` with `client_id` (no `brief`, no `token`).
-- Client briefs 500; studio income/stats read the wrong shape.
-- Restore Escrowd, copy leftover rows, drop Scope Guard tables.

drop table if exists public.activity_events cascade;
drop table if exists public.provider_operations cascade;
drop table if exists public.disputes cascade;
drop table if exists public.webhook_events cascade;
drop table if exists public.scope_versions cascade;
drop table if exists public.milestones cascade;
drop table if exists public.change_orders cascade;
drop table if exists public.payments cascade;
drop table if exists public.clients cascade;
drop table if exists public.studio_settings cascade;

drop function if exists public.escrowd_public_token() cascade;
drop function if exists public.escrowd_legacy_token_from_public() cascade;
drop function if exists public.escrowd_legacy_order_defaults() cascade;
drop function if exists public.set_updated_at() cascade;

create table public.orders_escrowd_next (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_at timestamptz not null default now(),

  client_name text not null,
  client_email text not null,
  client_phone text not null,

  brief jsonb not null,

  price_total integer not null check (price_total > 0),
  price_deposit integer not null check (price_deposit > 0),
  price_balance integer not null check (price_balance >= 0),
  constraint orders_escrowd_next_prices_sum check (price_deposit + price_balance = price_total),
  constraint orders_escrowd_next_token_len check (char_length(token) = 12),

  status text not null default 'awaiting_deposit'
    check (status in (
      'awaiting_deposit',
      'in_progress',
      'ready_for_review',
      'awaiting_balance',
      'delivered'
    )),

  deposit_paid_at timestamptz,
  balance_paid_at timestamptz,
  paymob_deposit_reference text,
  paymob_balance_reference text,
  paymob_deposit_order_id text,
  paymob_balance_order_id text,
  paymob_deposit_transaction_id text,
  paymob_balance_transaction_id text,

  preview_url text,
  final_url text
);

do $$
declare
  leftover text;
begin
  for leftover in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename like 'orders_legacy_pre_escrowd%'
    order by tablename
  loop
    execute format(
      $ins$
        insert into public.orders_escrowd_next (
          id, token, created_at, client_name, client_email, client_phone, brief,
          price_total, price_deposit, price_balance, status,
          deposit_paid_at, balance_paid_at,
          paymob_deposit_reference, paymob_balance_reference,
          paymob_deposit_order_id, paymob_balance_order_id,
          paymob_deposit_transaction_id, paymob_balance_transaction_id,
          preview_url, final_url
        )
        select
          id, token, created_at, client_name, client_email, client_phone, brief,
          price_total, price_deposit, price_balance, status,
          deposit_paid_at, balance_paid_at,
          paymob_deposit_reference, paymob_balance_reference,
          paymob_deposit_order_id, paymob_balance_order_id,
          paymob_deposit_transaction_id, paymob_balance_transaction_id,
          preview_url, final_url
        from public.%I
        on conflict (token) do nothing
      $ins$,
      leftover
    );
    execute format('drop table public.%I cascade', leftover);
  end loop;
end $$;

drop table if exists public.orders cascade;
alter table public.orders_escrowd_next rename to orders;

alter table public.orders
  rename constraint orders_escrowd_next_pkey to orders_pkey;
alter table public.orders
  rename constraint orders_escrowd_next_token_key to orders_token_key;
alter table public.orders
  rename constraint orders_escrowd_next_prices_sum to orders_prices_sum;
alter table public.orders
  rename constraint orders_escrowd_next_token_len to orders_token_len;

create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);

alter table public.orders enable row level security;

comment on table public.orders is
  'Escrowd commissions. Do not replace with Scope Guard clients/orders.';

insert into storage.buckets (id, name, public)
values ('deliveries', 'deliveries', true)
on conflict (id) do nothing;

drop policy if exists "deliveries_public_read" on storage.objects;
create policy "deliveries_public_read"
on storage.objects
for select
to public
using (bucket_id = 'deliveries');

notify pgrst, 'reload schema';
