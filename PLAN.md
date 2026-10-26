# PLAN.md

Phased development plan for the TapTapAdd private pilot. Source of truth for product rules is `CLAUDE.md`; for UI it is `DESIGN.md`. This file only sequences the work.

## How the phases are ordered

1. **Render before AI.** The pilot is judged on how good the generated sites look. Build the renderer, registry and Orbit vibe against a hand-written profile first, so layout quality can be judged without the AI involved, and `defaultLayout(jobType)` exists as a fallback before the AI does.
2. **One thin vertical slice, then widen.** By the end of Phase 4 a colleague can go from CV to a live site on a subdomain. Everything after that improves an end-to-end flow that already works.
3. **Privacy and RLS from the first migration.** They are never a later hardening pass.
4. **Every phase ends green:** `pnpm typecheck && pnpm lint && pnpm test`, plus the e2e tests that exist by then.

| Phase | Theme | Outcome |
|---|---|---|
| 0 | Foundations | Repo, tooling, tokens, CI, Supabase project |
| 1 | Schemas and data | Zod schemas, migrations, RLS, `public_sites` view |
| 2 | Renderer and Orbit vibe | A hand-written profile renders as a full portfolio |
| 3 | Extraction | CV file to validated `Profile`, tested against fixtures |
| 4 | Onboarding and first site | Sign in → upload → review → choices → questions → AI layout → draft site |
| 5 | Publish and cards | Versions, publishing, subdomains, `/c/[code]`, vCard, OG image |
| 6 | Editing | Inline edits, AI chat edits as JSON Patch, undo, before/after |
| 7 | Dashboard, stats, privacy controls | Card page, event stats, CV and account deletion |
| 8 | More vibes | Minimal, Editorial, Technical, each designed first |
| 9 | Pilot readiness | Full e2e, accessibility audit, card issuing, onboarding colleagues |

---

## Phase 0: Foundations

**Goal:** an empty app that builds, deploys and looks like the console.

- Rename `DESIGN-5.md` to `DESIGN.md`, since `CLAUDE.md` refers to that name.
- Scaffold Next.js (App Router), TypeScript strict, Tailwind, pnpm. Add ESLint with a `no-explicit-any` error and a lint rule or check that blocks raw hex values outside `app/tokens.css`.
- Add the scripts listed in `CLAUDE.md` (`dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:types`).
- `app/tokens.css`: the full app token set from `DESIGN.md` for dark and light, mapped into Tailwind's theme. Load Michroma and Jost through `next/font` with the documented fallbacks.
- Supabase project (local via the CLI plus a hosted pilot project) and the env vars in `CLAUDE.md`, validated with Zod at startup in `lib/env.ts`.
- `lib/ai/models.ts` holding the two model ids (extraction/layout and edit) and a thin Anthropic client wrapper with a recorded-response mode switched by an env flag, so no test ever calls the API.
- Logging helper that only accepts an allow-listed set of fields, so CV text, profiles and AI responses can't be logged by accident.
- Subdomain middleware skeleton: `{slug}.{ROOT_DOMAIN}` rewrites to `app/sites/[slug]`, and the root domain serves marketing and app routes. Use `*.localhost` (or `lvh.me`) locally.
- CI on GitHub Actions: typecheck, lint, unit tests, build. Vercel preview deploys with the wildcard domain configured on the pilot domain.
- Core `components/ui`: backlit key (all variants, sizes and states, including reduced motion), panel, input, status light, toast. Add the `/dev/components` gallery now, gated to development, and show these in it.

**Done when** CI is green, a Vercel preview shows the gallery in both themes, and a test subdomain resolves to a placeholder site page.

**Status (2026-10-22):** code complete and passing locally (typecheck, lint, unit, build, e2e). Pushed to GitHub, hosted Supabase project created, Vercel connected (2026-10-26). Still to do: confirm CI is green, add the root and wildcard domains in Vercel, and run `pnpm db:start` once Docker is available.

## Phase 1: Schemas and data

**Goal:** the data contracts every later phase depends on.

- `lib/schemas/profile.ts`: `ProfileSchema` (name, headline, summary, experience, education, skills, projects, links, contact). Contact fields carry visibility flags. Phone, address, date of birth and photo default to hidden. No fields exist for NIC, passport or other ID numbers.
- `lib/schemas/tokens.ts`: the vibe token contract from `DESIGN.md`, plus the enums for vibe, job type, theme and accent.
- `lib/schemas/layout.ts`: `LayoutSpec` as an ordered list of `{ component, props }`. Props are validated per component later against the registry.
- `lib/schemas/patch.ts`: RFC 6902 operations restricted to paths under `profile`, `layout` and `tokens`.
- Onboarding answers schema (proudest work, contact reasons, fun fact).
- Schema tests for each, including rejection cases.
- Migrations for `profiles`, `sites`, `site_versions`, `cards` and `events` as described in `CLAUDE.md`, with:
  - RLS enabled on every table. Owners read and write their own rows. `site_versions` is insert-only (no update policy) so versions stay immutable.
  - The `public_sites` view joining the published version with visible profile fields only. It is the only thing anonymous users can read.
  - `cards.code` unique, generated from a non-sequential alphabet (for example 10 characters, no ambiguous letters).
  - `events` with no IP or user-agent columns.
  - Reserved slugs (`www`, `app`, `api`, `c`, `admin`, and so on) blocked by a check constraint or a lookup table.
- `pnpm db:types` generates `lib/db/types.ts`. Server, browser and service-role Supabase clients in `lib/db`, with JSON columns parsed through Zod on read.
- RLS tests that run against local Supabase: an anonymous client can't read `profiles`, user A can't read user B's data, and `public_sites` exposes no hidden fields.

**Done when** migrations apply cleanly on a fresh database and the RLS and schema tests pass.

**Status (2026-10-26):** done. Code passes locally (typecheck, lint, unit, schema and RLS tests, build, e2e). The migration is applied to the hosted pilot project, where anonymous requests can read `public_sites` and are refused on every table. `lib/db/types.ts` is now generated from the hosted project and matched the hand-written version. The migrations and RLS tests run in PGlite with stand-ins for Supabase's roles and `auth.uid()`. `pnpm db:reset` against local Supabase is still worth running once Docker is up, but nothing is blocked on it.

Decisions made in this phase:

- **Slugs:** 3–40 characters, lowercase letters, digits and single inner hyphens. Reserved words are listed in `lib/schemas/slug.ts` and mirrored in SQL. Whether a slug can change after publishing is still open.
- **Card codes:** 10 characters of Crockford base32 (50 random bits), generated by the database. Codes are created unassigned and claimed after printing.
- **Versions snapshot the profile.** Hiding a field therefore only reaches the live site on the next publish. Phase 7 should make privacy switches publish straight away.
- **Layout props must not carry contact data.** The public view filters hidden fields from the profile only. Phase 2 components should read contact details from the profile, never from layout props.

## Phase 2: Renderer and Orbit vibe

**Goal:** a great-looking portfolio from a hand-written profile, with no AI involved.

- `lib/render/registry.ts`: the registry shape (`id`, `props`, `description`, `vibes`, `Component`) and a `catalogue()` function that serialises it for prompts.
- First component set in `components/site`, each with a fixture test and a gallery preview:
  - `hero` (photo, name, headline, and the three actions: save contact, LinkedIn, email)
  - `about`, `experience-timeline`, `projects-grid`, `skills`, `education`, `highlights` (proudest work), `contact-cta`, `fun-fact`, `footer`
- `lib/render/rules.ts`: pure functions from job type, vibe, accent and theme to tokens and section rules (for example engineers lead with projects and skills). Table-driven unit tests.
- Accent handling: compute `--vibe-accent-text` for AA contrast, with tests across a range of accents.
- `lib/render/defaults.ts`: `defaultLayout(jobType)`.
- `Renderer.tsx`: maps a `LayoutSpec` to components, validates each component's props, drops unknown or invalid components, and hides empty sections.
- The Orbit vibe token set in dark and light. `components/site` never imports from `components/ui`.
- Three or four hand-written profiles (from the anonymised fixtures) rendered at `/dev/sites/[fixture]` for design review on a 390px phone and on desktop.

**Done when** the fixture profiles render well on mobile across job types, Lighthouse mobile performance is 90 or higher, and you would happily show the result to a colleague.

## Phase 3: Extraction

**Goal:** a CV file becomes a validated `Profile` reliably.

- Text extraction: `pdf-parse` for PDF and `mammoth` for DOCX, plus a clear error for scanned or image-only PDFs that contain no text.
- `lib/ai/prompts/extract.v1.md`: rules for structure and a firm instruction never to capture ID numbers. Use structured output or tool use against the JSON schema derived from `ProfileSchema`.
- `lib/ai/extract.ts`: call, validate, retry once with the Zod errors, then return a partial result with a list of the fields that failed.
- A post-processing scrub that removes anything that looks like a Sri Lankan NIC (old and new formats) or a passport number, independent of the prompt.
- Fixture tests with recorded responses for each CV in `tests/fixtures/cvs`. Include a CV that contains an NIC and check it never appears in the output.
- An eval script (run by hand, not in CI) that runs live extraction on the fixtures and reports field-level accuracy, used to tune the prompt and choose the model.

**Done when** all fixtures pass in recorded mode and the live eval meets an agreed accuracy bar on names, roles, dates and contact details.

## Phase 4: Onboarding and first site

**Goal:** the first end-to-end vertical slice.

- Magic link sign-in on the root domain only. The session never needs to exist on portfolio subdomains.
- `(app)/onboarding`, one question per screen with status-light progress:
  1. **Upload:** the upload bay, PDF/DOCX type and size checks, storage in a private Supabase bucket, then the "reading your CV" state with the card preview.
  2. **Review:** editable fields, partial-failure highlighting using the copy from `DESIGN.md`, and rocker switches for visibility. Record which fields the user edited so later AI output never overwrites them.
  3. **Choices:** segmented keys for job type, vibe (Orbit only for now), theme and an accent picker. Pure rules, no AI.
  4. **Questions:** the three short answers as large keys or short text.
- Slug picking: suggested from the name, checked for availability and reserved words.
- `lib/ai/layout.ts` with `prompts/layout.v1.md`: the input is the profile (visible fields only), the choices as read-only context, the answers and the registry catalogue. The output is a `LayoutSpec`. Validate it, drop unknown components, re-apply user-edited fields over any rewritten copy, and fall back to `defaultLayout`. Cache the catalogue portion of the prompt.
- Save the result as the first `site_versions` row (`source: generate`) and set `draft_version_id`.
- A draft preview inside the app.
- Layout fixture tests in recorded mode, and a first Playwright test from sign-in to draft preview (with a stubbed AI).

**Done when** a colleague can go from a CV to a draft site in under three minutes without help.

## Phase 5: Publish and cards

**Goal:** a live site at `{slug}.{ROOT_DOMAIN}`, reachable by tapping a card.

- The publish server action points `published_version_id` at the draft version and revalidates the site's path. Public pages are statically rendered per published version from `public_sites`.
- The launch moment from `DESIGN.md` (countdown, card lifts into orbit, status light goes live) and its reduced-motion version.
- vCard endpoint built from visible contact fields only, logging a `vcard` event.
- An OG image per site via `next/og`, cached by version.
- `c/[code]/route.ts`:
  - assigned card with a published site: redirect to the site and log a `tap` event
  - unassigned card: the claim page ("This card isn't linked yet. Sign in to claim it.")
  - deleted account or unpublished site: the friendly "this card isn't active" page
  - unknown code: the same friendly page, never a 404
- The claim flow: a signed-in user links an unassigned card to their account.
- `view` and `link_click` events with no IPs and no fingerprinting. Use a beacon or server action, not a third-party analytics script.
- An e2e test of the full happy path in `CLAUDE.md`, ending with a visit to `/c/{code}`.

**Done when** the e2e happy path passes on a Vercel preview and a real NFC tag written with a test code opens the site on iOS and Android.

## Phase 6: Editing

**Goal:** refining the site is quick and safe.

- The builder layout from `DESIGN.md`: rail, editor (max 480px) and live phone preview on desktop, with Edit and Preview keys and a bottom bar on mobile.
- Inline edits to profile fields, section order and visibility. Each save creates a `manual` version, debounced so typing doesn't create dozens of versions.
- AI edit bar with suggestion chips:
  - `lib/ai/edit.ts` and `prompts/edit.v1.md` use the cheaper model and return a JSON Patch against `{ profile, layout, tokens }`.
  - Validate the patch shape, apply it, validate the result against all schemas, and reject changes to vibe, accent, job type or theme unless the instruction explicitly asks for them.
  - Save as an `ai_edit` version, with a before/after toggle and an "Undo" key.
- Version history as clickable cards. Undo and restore move the draft pointer back and never mutate a row.
- Recorded-response tests for common instructions ("Shorten my bio", "Lead with projects", "Warmer tone") and for adversarial ones ("add a script tag", "change my vibe" when not asked).

**Done when** the edit tests pass and a non-technical colleague can make three changes and undo one without guidance.

## Phase 7: Dashboard, stats and privacy controls

**Goal:** owners can manage their card, see what's happening and control their data.

- Card page: front and back PVC card preview on an orbit ring, with the QR code and the card link.
- Stats: taps, views, vCard saves and link clicks over time, shown as simple aggregates.
- Privacy controls, using guarded switches:
  - delete the original CV file from storage (the profile stays)
  - delete the account: remove profile, sites, versions, events and storage objects, and unassign the user's cards so their codes show the "isn't active" page
- Empty states and error copy checked against the voice table in `DESIGN.md`.
- A short privacy notice covering what's collected, why and how to delete it, written to meet the PDPA.

**Done when** deletion is verified by tests that check no rows or files remain, and a deleted user's card code shows the friendly page.

## Phase 8: More vibes

**Goal:** four vibes that feel genuinely different.

- For each of Minimal, Editorial and Technical: design first (typefaces, palette, spacing, how the hero and projects behave), add the design to `DESIGN.md`, then build the token set and any vibe-specific components.
- Update `vibes` on registry entries. The catalogue and layout prompt pick this up automatically.
- Live thumbnails in the vibe picker.
- Visual regression snapshots of each fixture profile in each vibe and theme.

**Done when** the four vibes are recognisably different side by side, and every combination passes AA contrast with a range of accents.

## Phase 9: Pilot readiness

**Goal:** colleagues can use it unaided.

- An internal script to issue batches of card codes and export them for the printer (URL and QR per code), setting `printed_at`.
- An accessibility audit against the floor in `DESIGN.md`: keyboard-only pass, screen reader pass, 44px targets, contrast in both themes.
- Error monitoring that respects the no-logging rules (scrub request bodies).
- An AI cost and latency check per onboarding, and rate limits on AI endpoints per user.
- A backup and restore check on the pilot database.
- Seed the pilot: issue cards, onboard five colleagues in person, collect feedback, then widen the group.

**Done when** five colleagues have live sites and cards, and the issues they raise are triaged.

---

## Decisions to make early

- **Slug policy:** allowed characters, length, and whether users can change their slug after publishing. The card URL is stable either way because it goes through `/c/[code]`.
- **Card code format:** length and alphabet, and whether codes are pre-assigned to people before printing or always claimed after.
- **Photo source:** extracted from the CV, uploaded separately, or both.
- **Model choice:** settle the two model ids in `lib/ai/models.ts` using the Phase 3 eval, not by default.
- **Root domain** for the pilot, needed for wildcard DNS in Phase 0.
