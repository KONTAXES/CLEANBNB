create type inspection_type as enum ('initial', 'final');

create table inspection_reports (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references visit_sessions(id),
  type inspection_type not null,
  section_id text not null,
  section_name text not null,
  photos text[] not null default '{}',
  comment text,
  alerts jsonb not null default '[]',
  submitted_at timestamptz not null default now(),
  employee_id uuid not null references profiles(id)
);

create index idx_inspection_session on inspection_reports(session_id);
