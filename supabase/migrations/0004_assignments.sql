create type assignment_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');

create table assignments (
  id uuid primary key default uuid_generate_v4(),
  apartment_id uuid not null references apartments(id),
  employee_id uuid not null references profiles(id),
  supervisor_id uuid references profiles(id),
  scheduled_date date not null,
  notes text,
  status assignment_status not null default 'scheduled',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assignments_date on assignments(scheduled_date);
create index idx_assignments_employee on assignments(employee_id);
create index idx_assignments_apartment on assignments(apartment_id);

create trigger assignments_updated_at
  before update on assignments
  for each row execute function update_updated_at();
