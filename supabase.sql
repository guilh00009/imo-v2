create table characters (id uuid default uuid_generate_v4() primary key, name text not null, avatar_url text, description text, personality text, created_at timestamp with time zone default timezone('utc'::text, now()) not null, created_by uuid references auth.users(id), is_public boolean default true, greeting text, category text); create table messages (id uuid default uuid_generate_v4() primary key, character_id uuid references characters(id) on delete cascade, user_id uuid references auth.users(id), content text not null, role text not null, created_at timestamp with time zone default timezone('utc'::text, now()) not null); alter table characters enable row level security; alter table messages enable row level security; create policy \
Public
characters
are
viewable
by
everyone\ on characters for select using (is_public = true); create policy \Users
can
create
characters\ on characters for insert with check (auth.uid() = created_by); create policy \Users
can
update
their
own
characters\ on characters for update using (auth.uid() = created_by); create policy \Users
can
delete
their
own
characters\ on characters for delete using (auth.uid() = created_by); create policy \Users
can
view
their
own
messages\ on messages for select using (auth.uid() = user_id); create policy \Users
can
insert
their
own
messages\ on messages for insert with check (auth.uid() = user_id);
