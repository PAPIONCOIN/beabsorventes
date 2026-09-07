create table if not exists orders (
  id serial primary key,
  order_id text not null unique,
  email text not null,
  name text not null,
  phone text not null default '',
  status text not null default 'pending',
  payment text not null default 'card',
  items jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  address jsonb not null default '{}'::jsonb,
  shipping_label text not null default '',
  tracking text not null default '',
  tracking_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_email_idx on orders (email);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
