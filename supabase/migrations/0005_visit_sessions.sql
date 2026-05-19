create type session_status as enum ('clocked_in', 'inspecting_initial', 'managing_supplies', 'inspecting_final', 'clocked_out');

create table visit_sessions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id),
  employee_id uuid not null references profiles(id),
  apartment_id uuid not null references apartments(id),
  status session_status not null default 'clocked_in',
  clock_in_at timestamptz,
  clock_in_gps point,
  clock_in_gps_accuracy float4,
  clock_out_at timestamptz,
  clock_out_gps point,
  clock_out_gps_accuracy float4,
  face_verified_clock_in boolean default false,
  face_verified_clock_out boolean default false,
  face_match_score_in float4,
  face_match_score_out float4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sessions_updated_at
  before update on visit_sessions
  for each row execute function update_updated_at();
