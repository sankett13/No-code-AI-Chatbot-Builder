

create table if not exists profiles (
  id uuid primary key,
  first_name text,
  last_name text,
  email text,
  created_at timestamptz default now()
);


create index if not exists profiles_email_idx on profiles (email);
