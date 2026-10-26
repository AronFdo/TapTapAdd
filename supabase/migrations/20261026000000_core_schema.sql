-- Core schema: profiles, sites, site_versions, cards and events, with RLS on
-- every table and the public_sites view as the only anonymous read path.
--
-- Enum-like columns use check constraints that mirror lib/schemas. The tests in
-- tests/db check the two stay in sync.

-- Helpers -------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Ten characters of Crockford base32 (no i, l, o or u): 50 random bits, so
-- codes can't be guessed or enumerated. Bytes 6 and 8 of a v4 UUID carry the
-- version and variant bits, so only the fully random bytes are used.
create function public.gen_card_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789abcdefghjkmnpqrstvwxyz';
  positions constant int[] := array[0, 1, 2, 3, 4, 5, 9, 10, 11, 12];
  bytes bytea := uuid_send(gen_random_uuid());
  code text := '';
  i int;
begin
  foreach i in array positions loop
    code := code || substr(alphabet, (get_byte(bytes, i) & 31) + 1, 1);
  end loop;
  return code;
end;
$$;

-- Mirrors RESERVED_SLUGS in lib/schemas/slug.ts.
create function public.is_reserved_slug(slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select slug = any (array[
    'about', 'account', 'admin', 'api', 'app', 'assets', 'auth', 'blog', 'c',
    'card', 'cards', 'cdn', 'dashboard', 'dev', 'docs', 'help', 'login', 'mail',
    'onboarding', 'preview', 'privacy', 'settings', 'signin', 'signup', 'sites',
    'static', 'status', 'support', 'taptapadd', 'terms', 'www'
  ]);
$$;

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text unique,
  -- ProfileSchema. Null until the CV has been read.
  profile jsonb,
  -- OnboardingAnswersSchema.
  answers jsonb not null default '{}'::jsonb,
  -- JSON Pointers the owner edited by hand. AI output never overwrites them.
  edited_paths text[] not null default '{}',
  -- Storage path of the original CV, cleared when the owner deletes it.
  cv_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40
  ),
  constraint profiles_slug_not_reserved check (not public.is_reserved_slug(slug)),
  constraint profiles_profile_object check (profile is null or jsonb_typeof(profile) = 'object'),
  constraint profiles_answers_object check (jsonb_typeof(answers) = 'object')
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Sites ---------------------------------------------------------------------

-- One site per person in the pilot. The look columns hold the current choices;
-- each version also snapshots them in `tokens`.
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (user_id) on delete cascade,
  vibe text not null default 'orbit',
  theme text not null default 'dark',
  accent text not null,
  job_type text not null,
  draft_version_id uuid,
  published_version_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sites_vibe check (vibe in ('orbit', 'minimal', 'editorial', 'technical')),
  constraint sites_theme check (theme in ('dark', 'light')),
  constraint sites_accent check (accent ~ '^#[0-9a-f]{6}$'),
  constraint sites_job_type check (job_type in (
    'engineering', 'design', 'data', 'product', 'marketing', 'sales',
    'finance', 'operations', 'people', 'other'
  ))
);

create trigger sites_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- Site versions -------------------------------------------------------------

-- Immutable snapshots of { profile, layout, tokens }. Undo and publish move
-- the pointers on `sites`; rows are never changed.
create table public.site_versions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  -- The version this one was made from, for before/after views.
  parent_id uuid,
  profile jsonb not null,
  layout jsonb not null,
  tokens jsonb not null,
  source text not null,
  created_at timestamptz not null default now(),
  constraint site_versions_id_site unique (id, site_id),
  constraint site_versions_parent_same_site
    foreign key (parent_id, site_id) references public.site_versions (id, site_id),
  constraint site_versions_source check (source in ('generate', 'ai_edit', 'manual')),
  constraint site_versions_profile_object check (jsonb_typeof(profile) = 'object'),
  constraint site_versions_layout_object check (jsonb_typeof(layout) = 'object'),
  constraint site_versions_tokens_object check (jsonb_typeof(tokens) = 'object')
);

create index site_versions_site_created on public.site_versions (site_id, created_at desc);

create function public.forbid_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% rows are immutable', tg_table_name;
end;
$$;

-- Applies to every role, including the service role.
create trigger site_versions_immutable
  before update on public.site_versions
  for each row execute function public.forbid_update();

-- A site can only point at its own versions.
alter table public.sites
  add constraint sites_draft_version_same_site
    foreign key (draft_version_id, id) references public.site_versions (id, site_id),
  add constraint sites_published_version_same_site
    foreign key (published_version_id, id) references public.site_versions (id, site_id);

-- Cards ---------------------------------------------------------------------

-- Codes are permanent: rows are never deleted. When an owner deletes their
-- account the card becomes inactive rather than claimable again.
create table public.cards (
  code text primary key default public.gen_card_code(),
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'unassigned',
  printed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cards_code_format check (code ~ '^[0-9a-hjkmnp-tv-z]{10}$'),
  constraint cards_status check (status in ('unassigned', 'assigned', 'inactive')),
  constraint cards_assigned_has_owner check ((status = 'assigned') = (user_id is not null))
);

create index cards_user on public.cards (user_id);

create function public.retire_orphaned_card()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.user_id is not null and new.user_id is null then
    new.status := 'inactive';
  end if;
  return new;
end;
$$;

create trigger cards_retire_orphaned
  before update of user_id on public.cards
  for each row execute function public.retire_orphaned_card();

-- Events --------------------------------------------------------------------

-- Deliberately no IP, user agent or any other column that could identify a visitor.
create table public.events (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  constraint events_type check (type in ('tap', 'view', 'vcard', 'link_click'))
);

create index events_site_created on public.events (site_id, created_at);

-- Row level security --------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.site_versions enable row level security;
alter table public.cards enable row level security;
alter table public.events enable row level security;

-- Anonymous visitors read only through public_sites.
revoke all on public.profiles, public.sites, public.site_versions, public.cards, public.events from anon;

create policy "Owners read their profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners create their profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update their profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete their profile" on public.profiles
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Owners read their site" on public.sites
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners create their site" on public.sites
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update their site" on public.sites
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete their site" on public.sites
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Insert-only: there are no update or delete policies, and the trigger above
-- blocks updates for every role.
revoke update, delete, truncate on public.site_versions from authenticated;
create policy "Owners read their versions" on public.site_versions
  for select to authenticated
  using (exists (
    select 1 from public.sites s where s.id = site_id and s.user_id = (select auth.uid())
  ));
create policy "Owners add versions" on public.site_versions
  for insert to authenticated
  with check (exists (
    select 1 from public.sites s where s.id = site_id and s.user_id = (select auth.uid())
  ));

-- Cards are issued and claimed on the server; owners can only see theirs.
revoke insert, update, delete, truncate on public.cards from authenticated;
create policy "Owners read their cards" on public.cards
  for select to authenticated using ((select auth.uid()) = user_id);

-- Events are written on the server; owners can only read their own.
revoke insert, update, delete, truncate on public.events from authenticated;
create policy "Owners read their events" on public.events
  for select to authenticated
  using (exists (
    select 1 from public.sites s where s.id = site_id and s.user_id = (select auth.uid())
  ));

-- Public sites --------------------------------------------------------------

-- The public form of a profile. Contact fields, links and the photo are kept
-- only when their `visible` flag is explicitly true, so a missing or malformed
-- flag hides the field.
create function public.public_profile(profile jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select (profile - 'contact' - 'links' - 'photo')
    || jsonb_build_object(
      'contact',
      case when jsonb_typeof(profile -> 'contact') = 'object' then (
        select coalesce(jsonb_object_agg(field.key, field.value), '{}'::jsonb)
        from jsonb_each(profile -> 'contact') as field
        where field.value ->> 'visible' = 'true'
      ) else '{}'::jsonb end,
      'links',
      case when jsonb_typeof(profile -> 'links') = 'array' then (
        select coalesce(jsonb_agg(link.value order by link.position), '[]'::jsonb)
        from jsonb_array_elements(profile -> 'links') with ordinality as link (value, position)
        where link.value ->> 'visible' = 'true'
      ) else '[]'::jsonb end
    )
    || case when profile #>> '{photo,visible}' = 'true'
      then jsonb_build_object('photo', profile -> 'photo')
      else '{}'::jsonb end;
$$;

-- The only thing anonymous visitors can read. It runs with the view owner's
-- rights (deliberately not security_invoker) so it can join past RLS, and it
-- exposes only the published version with hidden fields removed.
create view public.public_sites as
select
  s.id as site_id,
  p.slug,
  v.id as version_id,
  public.public_profile(v.profile) as profile,
  v.layout,
  v.tokens,
  s.published_at
from public.sites s
join public.profiles p on p.user_id = s.user_id
join public.site_versions v on v.id = s.published_version_id and v.site_id = s.id
where p.slug is not null;

revoke all on public.public_sites from anon, authenticated;
grant select on public.public_sites to anon, authenticated;
