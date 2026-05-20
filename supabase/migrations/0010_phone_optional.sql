-- phone ya no es requerido para usuarios OAuth
alter table profiles alter column phone drop not null;
alter table profiles alter column phone set default null;
