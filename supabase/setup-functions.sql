-- Function to execute dynamic SQL for table creation
create or replace function setup_characters_table(sql text)
returns void as $$
begin
  execute sql;
end;
$$ language plpgsql security definer;

create or replace function setup_messages_table(sql text)
returns void as $$
begin
  execute sql;
end;
$$ language plpgsql security definer; 