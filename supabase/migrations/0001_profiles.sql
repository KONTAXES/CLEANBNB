create extension if not exists "uuid-ossp";

create type user_role as enum ('admin', 'supervisor', 'employee');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text not null unique,
  role user_role not null default 'employee',
  face_descriptor float8[] null,
  face_photo_url text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create or replace function current_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;
