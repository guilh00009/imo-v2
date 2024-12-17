-- Enable required extensions
create extension if not exists "pgcrypto";

-- Create storage policies for avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public read access to avatars
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow anyone to upload avatars
create policy "Anyone can upload avatars"
on storage.objects for insert
with check ( bucket_id = 'avatars' );

-- Allow anyone to update their uploads
create policy "Anyone can update avatars"
on storage.objects for update
using ( bucket_id = 'avatars' );

-- Allow anyone to delete their uploads
create policy "Anyone can delete avatars"
on storage.objects for delete
using ( bucket_id = 'avatars' );

-- Function to execute dynamic SQL for database setup
create or replace function public.execute_sql(sql_string text)
returns void as $$
declare
  current_user uuid;
begin
  -- Get current user ID
  current_user := auth.uid();
  
  -- Check if user has permission
  if current_user is not null or (select rolname from pg_roles where rolname = current_role) = 'authenticated' then
    execute sql_string;
  else
    raise exception 'Permission denied';
  end if;
end;
$$ language plpgsql security definer;

-- Drop existing policies if they exist
do $$
begin
  execute (
    select string_agg('drop policy if exists "' || policyname || '" on public.' || tablename || ';', E'\n')
    from pg_policies 
    where schemaname = 'public' 
    and (tablename = 'characters' or tablename = 'messages')
  );
exception when others then
  null;
end $$;

-- Drop existing tables if they exist
drop table if exists public.messages;
drop table if exists public.characters;

-- Create tables
create table if not exists public.characters (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  avatar_url text,
  description text,
  personality text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by text,
  is_public boolean default true,
  greeting text,
  category text
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  character_id uuid references public.characters(id) on delete cascade,
  user_id text,
  content text not null,
  role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.characters enable row level security;
alter table public.messages enable row level security;

-- Create policies
create policy "Public characters are viewable by everyone"
  on public.characters for select
  using (is_public = true);

create policy "Anyone can create characters"
  on public.characters for insert
  with check (true);

create policy "Anyone can update characters"
  on public.characters for update
  using (true);

create policy "Anyone can delete characters"
  on public.characters for delete
  using (true);

create policy "Anyone can view messages"
  on public.messages for select
  using (true);

create policy "Anyone can insert messages"
  on public.messages for insert
  with check (true);

-- Grant permissions
grant usage on schema public to authenticated;
grant usage on schema public to anon;

grant all on public.characters to authenticated;
grant all on public.characters to anon;

grant all on public.messages to authenticated;
grant all on public.messages to anon;

grant execute on function public.execute_sql(text) to authenticated;
grant execute on function public.execute_sql(text) to anon;