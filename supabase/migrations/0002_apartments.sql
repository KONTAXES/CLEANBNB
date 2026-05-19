create table apartments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  google_maps_url text,
  sections jsonb not null default '[]',
  expected_inventory jsonb not null default '[]',
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger apartments_updated_at
  before update on apartments
  for each row execute function update_updated_at();
