create type photo_type as enum ('rear_entrance', 'front_selfie');

create table clock_photos (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references visit_sessions(id),
  type photo_type not null,
  storage_url text not null,
  gps point,
  gps_accuracy float4,
  taken_at timestamptz not null default now(),
  phase text not null
);
