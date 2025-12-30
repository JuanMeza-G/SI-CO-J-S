-- Run this in your Supabase SQL Editor

-- 1. Table for Clinic Information (Single Row expected mostly)
create table if not exists clinic_info (
  id bigint primary key generated always as identity,
  name text,
  slogan text,
  address text,
  phone text,
  email text,
  business_hours jsonb, -- Stores open hours structure
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Policy for Clinic Info (Allow read to authenticated, write to admins - simplified for now to auth)
alter table clinic_info enable row level security;
create policy "Enable read access for all users" on clinic_info for select using (true);
create policy "Enable insert/update for authenticated users" on clinic_info for all using (auth.role() = 'authenticated');


-- 3. Table for Services / Treatments
create table if not exists services (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  price numeric not null default 0,
  duration_minutes integer default 30,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Policy for Services
alter table services enable row level security;
create policy "Enable read access for all users" on services for select using (true);
create policy "Enable all access for authenticated users" on services for all using (auth.role() = 'authenticated');
