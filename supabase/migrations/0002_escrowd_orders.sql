-- Escrowd: one orders table. Deposit starts work; balance unlocks the file.
-- Replaces the demo starter (user_id + pending|paid|failed).

drop table if exists public.orders cascade;

create table public.orders (
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
  constraint orders_prices_sum check (price_deposit + price_balance = price_total),
  constraint orders_token_len check (char_length(token) = 12),

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
  paymob_deposit_order_id text,
  paymob_balance_order_id text,
  paymob_deposit_transaction_id text,
  paymob_balance_transaction_id text,

  preview_url text,
  final_url text
);

create index orders_status_created_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;
-- No anon/authenticated policies. Browser cannot insert or update.
-- Server uses the service role (checkout, webhook, Nour dashboard).

insert into storage.buckets (id, name, public)
values ('deliveries', 'deliveries', true)
on conflict (id) do nothing;

drop policy if exists "deliveries_public_read" on storage.objects;
create policy "deliveries_public_read"
on storage.objects
for select
to public
using (bucket_id = 'deliveries');
