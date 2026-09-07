create table if not exists customers (
  id serial primary key,
  email text not null unique,
  name text not null,
  phone text not null default '',
  cep text not null default '',
  street text not null default '',
  number text not null default '',
  complement text not null default '',
  neighborhood text not null default '',
  city text not null default '',
  state text not null default '',
  source text not null default 'cadastro',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_created_at_idx on customers (created_at desc);
create index if not exists customers_email_idx on customers (email);
