-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run

create table templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- e.g. "wedding-classic"
  name text not null,                  -- e.g. "Classic Wedding"
  category text not null,              -- "wedding" | "birthday" | "baptism" | "engagement" | etc
  thumbnail_url text,
  source text not null default 'static', -- 'static' now, 'ai_generated' in phase 2
  created_at timestamptz default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- becomes the URL: yourbrand.com/i/sarah-karim
  template_id uuid references templates(id) not null,
  host_names text not null,            -- "Sarah & Karim"
  event_date timestamptz,
  venue_name text,
  venue_map_url text,                  -- google maps embed link
  primary_color text default '#7A5C3E',
  photo_urls text[] default '{}',
  music_url text,
  whatsapp_number text,                -- host's number, for the "confirm on WhatsApp" button
  status text not null default 'draft', -- 'draft' | 'live' | 'archived'
  created_at timestamptz default now()
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid references invites(id) not null,
  guest_name text not null,
  attending boolean not null,
  guest_count int default 1,
  message text,
  created_at timestamptz default now()
);

alter table templates enable row level security;
alter table invites enable row level security;
alter table rsvps enable row level security;

create policy "public read templates" on templates for select using (true);
create policy "public read live invites" on invites for select using (status = 'live');
create policy "anyone can rsvp" on rsvps for insert with check (true);
create policy "public read rsvps for their invite" on rsvps for select using (true);

insert into templates (slug, name, category, source)
values ('wedding-classic', 'Classic Wedding', 'wedding', 'static');
