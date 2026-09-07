alter table customers add column if not exists password_hash text not null default '';
alter table customers add column if not exists reset_token_hash text not null default '';
alter table customers add column if not exists reset_expires timestamptz;
