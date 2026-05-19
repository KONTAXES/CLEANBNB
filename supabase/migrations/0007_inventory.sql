create type movement_type as enum (
  'found', 'added_from_warehouse', 'removed_consumed',
  'transferred_out', 'transferred_in', 'final_count'
);

create table apartment_stock (
  id uuid primary key default uuid_generate_v4(),
  apartment_id uuid not null references apartments(id),
  item_id uuid not null references supply_items(id),
  quantity float4 not null default 0,
  last_session_id uuid references visit_sessions(id),
  last_updated timestamptz not null default now(),
  unique(apartment_id, item_id)
);

create table inventory_movements (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references visit_sessions(id),
  apartment_id uuid not null references apartments(id),
  item_id uuid not null references supply_items(id),
  type movement_type not null,
  quantity float4 not null,
  expected_quantity float4,
  difference float4 generated always as (quantity - coalesce(expected_quantity, quantity)) stored,
  comment text,
  transfer_to_apartment_id uuid references apartments(id),
  recorded_at timestamptz not null default now(),
  employee_id uuid not null references profiles(id)
);

create index idx_movements_session on inventory_movements(session_id);
create index idx_movements_apartment on inventory_movements(apartment_id);
