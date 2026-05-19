alter table profiles enable row level security;
alter table apartments enable row level security;
alter table warehouses enable row level security;
alter table supply_items enable row level security;
alter table assignments enable row level security;
alter table visit_sessions enable row level security;
alter table inspection_reports enable row level security;
alter table inventory_movements enable row level security;
alter table apartment_stock enable row level security;
alter table warehouse_stock enable row level security;
alter table clock_photos enable row level security;

-- profiles
create policy "profiles_self" on profiles for select using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all using (current_user_role() = 'admin');
create policy "profiles_supervisor_read" on profiles for select using (current_user_role() = 'supervisor');
create policy "profiles_employee_read_active" on profiles for select using (current_user_role() = 'employee' and is_active = true);

-- apartments
create policy "apartments_read_all" on apartments for select using (auth.uid() is not null);
create policy "apartments_admin_write" on apartments for all using (current_user_role() = 'admin');

-- warehouses
create policy "warehouses_read_all" on warehouses for select using (auth.uid() is not null);
create policy "warehouses_admin_write" on warehouses for all using (current_user_role() = 'admin');

-- supply_items
create policy "items_read_all" on supply_items for select using (auth.uid() is not null);
create policy "items_admin_write" on supply_items for all using (current_user_role() = 'admin');

-- assignments
create policy "assignments_admin_all" on assignments for all using (current_user_role() = 'admin');
create policy "assignments_supervisor_read" on assignments for select using (current_user_role() = 'supervisor');
create policy "assignments_employee_read_own" on assignments for select using (employee_id = auth.uid());

-- visit_sessions
create policy "sessions_employee_own" on visit_sessions for all using (employee_id = auth.uid());
create policy "sessions_admin_supervisor" on visit_sessions for select using (current_user_role() in ('admin', 'supervisor'));
create policy "sessions_admin_write" on visit_sessions for all using (current_user_role() = 'admin');

-- inspection_reports
create policy "inspection_employee_insert" on inspection_reports for insert with check (employee_id = auth.uid());
create policy "inspection_employee_select" on inspection_reports for select using (employee_id = auth.uid());
create policy "inspection_admin_all" on inspection_reports for all using (current_user_role() = 'admin');
create policy "inspection_supervisor_select" on inspection_reports for select using (current_user_role() = 'supervisor');

-- inventory_movements
create policy "movements_employee_insert" on inventory_movements for insert with check (employee_id = auth.uid());
create policy "movements_employee_select" on inventory_movements for select using (employee_id = auth.uid());
create policy "movements_admin_all" on inventory_movements for all using (current_user_role() = 'admin');
create policy "movements_supervisor_select" on inventory_movements for select using (current_user_role() = 'supervisor');

-- apartment_stock
create policy "apt_stock_read" on apartment_stock for select using (auth.uid() is not null);
create policy "apt_stock_employee_update" on apartment_stock for insert with check (auth.uid() is not null);
create policy "apt_stock_admin" on apartment_stock for all using (current_user_role() = 'admin');

-- warehouse_stock
create policy "wh_stock_read" on warehouse_stock for select using (auth.uid() is not null);
create policy "wh_stock_admin" on warehouse_stock for all using (current_user_role() = 'admin');

-- clock_photos
create policy "photos_employee_insert" on clock_photos for insert with check (
  session_id in (select id from visit_sessions where employee_id = auth.uid())
);
create policy "photos_employee_select" on clock_photos for select using (
  session_id in (select id from visit_sessions where employee_id = auth.uid())
);
create policy "photos_admin_supervisor" on clock_photos for select using (current_user_role() in ('admin', 'supervisor'));
create policy "photos_admin_write" on clock_photos for all using (current_user_role() = 'admin');
