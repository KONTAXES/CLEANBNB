create table warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  is_default boolean not null default false
);

create table supply_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  unit text not null default 'unidades',
  category text not null default 'general',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table warehouse_stock (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid not null references warehouses(id),
  item_id uuid not null references supply_items(id),
  quantity float4 not null default 0,
  last_updated timestamptz not null default now(),
  unique(warehouse_id, item_id)
);

insert into warehouses (name, is_default) values ('Bodega Principal', true);
