-- La Rapaziada CRM — Supabase Migration
-- Execute no Supabase Dashboard > SQL Editor

-- Habilitar RLS em todas as tabelas (acesso apenas para usuários autenticados)

-- GROUPS
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);
alter table groups enable row level security;
create policy "Authenticated full access" on groups
  for all using (auth.role() = 'authenticated');

-- CONTACTS
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  instagram text,
  notes text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Se já criou a tabela antes, adicione a coluna com:
-- alter table contacts add column if not exists avatar_url text;
alter table contacts enable row level security;
create policy "Authenticated full access" on contacts
  for all using (auth.role() = 'authenticated');

-- CONTACT_GROUPS (many-to-many)
create table if not exists contact_groups (
  contact_id uuid references contacts(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (contact_id, group_id)
);
alter table contact_groups enable row level security;
create policy "Authenticated full access" on contact_groups
  for all using (auth.role() = 'authenticated');

-- CAMPAIGNS
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  message_template text,
  channel text default 'whatsapp' check (channel in ('whatsapp', 'email', 'instagram', 'all')),
  created_at timestamptz default now()
);
alter table campaigns enable row level security;
create policy "Authenticated full access" on campaigns
  for all using (auth.role() = 'authenticated');

-- MESSAGE_HISTORY
create table if not exists message_history (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  channel text,
  status text default 'sent',
  sent_at timestamptz default now()
);
alter table message_history enable row level security;
create policy "Authenticated full access" on message_history
  for all using (auth.role() = 'authenticated');

-- Add priority to contacts (1=muito frio, 2=frio, 3=morno, 4=quente, 5=muito quente)
alter table contacts add column if not exists priority int check (priority between 1 and 5);
