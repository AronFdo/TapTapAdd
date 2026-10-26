# CLAUDE.md

TapTapAdd turns a person's CV into a personal portfolio site, linked to a printed PVC NFC card. Tapping the card opens their site.

Current phase: private pilot for colleagues. No billing, teams or custom domains yet. Optimise for quality of the generated sites and a smooth first-run experience, not scale.

Read `DESIGN.md` before touching any UI. `PLAN.md` sequences the build in phases.

This is Next.js 16: middleware is `proxy.ts`, Cache Components is on (runtime data such as `params` and `cookies()` needs a `<Suspense>` boundary), and route prop types such as `PageProps<"/route">` are generated. Check `node_modules/next/dist/docs/` before relying on older Next.js patterns.

## The product in one flow

1. Sign in with a magic link.
2. Upload a CV (PDF or DOCX).
3. Review the extracted profile, fix mistakes, choose what is public.
4. Pick job type, vibe, accent colour and light/dark (deterministic choices).
5. Answer three short questions: proudest work, what to contact you about, one fun fact.
6. Get a site at `{slug}.{ROOT_DOMAIN}`.
7. Refine it with AI chat edits or direct inline edits. Publish.
8. The printed card encodes `https://{ROOT_DOMAIN}/c/{cardCode}`, which redirects to the owner's live site.

## Stack

- Next.js (App Router), TypeScript in strict mode
- Tailwind CSS with design tokens as CSS variables (defined in `app/tokens.css`, documented in `DESIGN.md`)
- Supabase: Postgres, Auth (magic link), Storage (CV files, photos), Row Level Security
- Anthropic API via `@anthropic-ai/sdk`
- Zod for every schema and boundary
- Vercel hosting, wildcard subdomain for portfolios
- pnpm, Vitest, Playwright

## Commands

```bash
pnpm dev            # local dev server
pnpm build          # production build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest unit tests
pnpm test:e2e       # playwright
pnpm db:migrate     # apply supabase migrations
pnpm db:types       # regenerate types from the database into lib/db/types.ts
```

Run `pnpm typecheck && pnpm lint && pnpm test` before considering any task done.

## Structure

```
app/
  (marketing)/            landing page
  (app)/onboarding/       upload → review → choices → questions
  (app)/dashboard/        site editor, card page, stats
  sites/[slug]/           public portfolio (served via subdomain middleware)
  c/[code]/route.ts       card redirect
  api/                    upload + AI endpoints
lib/
  schemas/                profile.ts, layout.ts, tokens.ts, patch.ts
  ai/                     extract.ts, layout.ts, edit.ts, models.ts, prompts/
  render/                 registry.ts, Renderer.tsx, rules.ts, defaults.ts
  db/                     supabase clients and generated types
components/
  ui/                     app design system (keys, panels, inputs)
  site/                   portfolio components used by the renderer
supabase/migrations/
tests/fixtures/cvs/       anonymised sample CVs
```

## Core pipeline

1. **Extract.** Pull text from the file (`pdf-parse` / `mammoth`). The LLM returns JSON matching `ProfileSchema`. Validate with Zod. On failure, retry once with the validation errors in the prompt. If it still fails, open the review screen with whatever parsed.
2. **Review.** The user edits fields and visibility flags. Their edits always win over any later AI output.
3. **Choices.** Job type, vibe, accent and theme map to tokens and section rules in `lib/render/rules.ts`. Pure functions, no AI.
4. **Layout.** The LLM receives the profile, the choices, the three answers and the component catalogue (generated from the registry). It returns a `LayoutSpec`: ordered components with props and rewritten copy. Validate, drop unknown components, and fall back to `defaultLayout(jobType)` if the spec is unusable.
5. **Render.** `Renderer` maps the spec to components in `components/site`, styled by the vibe tokens.
6. **Edit.** A chat instruction becomes a JSON Patch (RFC 6902) against `{ profile, layout, tokens }`. Validate the patched result against the schemas before saving it as a new version.

## Hard rules

- **AI never outputs HTML, CSS or JavaScript.** Only JSON validated against our schemas. If a feature seems to need generated markup, add a component instead.
- **Deterministic choices stay deterministic.** The AI can read vibe, accent and job type as context but never decides or changes them unless the user explicitly asks in an edit.
- **Card codes are permanent.** `/c/[code]` must never 404 for an issued card. Unassigned codes go to a claim page; deleted accounts go to a friendly "this card isn't active" page.
- **Privacy by default** (Sri Lanka PDPA):
  - Phone, address, date of birth and photo are hidden until the user turns them on.
  - Extraction must not capture NIC, passport or other ID numbers, even if present in the CV.
  - Never log CV text, extracted profiles or raw AI responses.
  - Users can delete their original CV file and their whole account from the dashboard.
- **RLS on every table.** Public pages read only through the `public_sites` view, which exposes visible fields only.
- **Versions are immutable.** Every generation or edit creates a `site_versions` row. Publishing points `sites.published_version_id` at a version. Undo means pointing back.
- **Models are configured in one place:** `lib/ai/models.ts`. A stronger model for extraction and layout, a cheaper one for small edits. Never hard-code model names elsewhere.

## Data model

- `profiles`: user_id, slug, structured profile JSON (visibility flags live inside it as `{ value, visible }`), onboarding answers, edited_paths, cv_path
- `sites`: user_id, vibe, accent, theme, job_type, draft_version_id, published_version_id
- `site_versions`: site_id, parent_id, profile JSON, layout JSON, tokens JSON, source (`generate` | `ai_edit` | `manual`), created_at. Each version is a full snapshot of the editable document `{ profile, layout, tokens }`, so undo restores all three and the live site only changes on publish.
- `cards`: code (10 characters of Crockford base32, generated by the database), user_id nullable, status (`unassigned` | `assigned` | `inactive`), printed_at, claimed_at. Deleting an owner's account makes their card `inactive`, never claimable again.
- `events`: site_id, type (`tap` | `view` | `vcard` | `link_click`), created_at. No IPs, no fingerprinting.

The schema and RLS tests in `tests/db` run the migrations in PGlite (in-process Postgres), so they need no Docker and run in CI.

## Component registry

Every portfolio component in `components/site` is registered in `lib/render/registry.ts` with:

- `id`: stable string, never renamed once shipped
- `props`: Zod schema
- `description`: one or two sentences the AI reads when choosing layouts
- `vibes`: which vibes it supports
- `Component`: the React component

Adding a component means a registry entry, a fixture-based test and a preview in the dev gallery (`/dev/components`). The AI catalogue updates automatically.

## Public portfolio requirements

- Mobile-first. The first screen shows photo, name, headline and three actions: save contact (vCard), LinkedIn, email.
- Fast: statically rendered per published version, revalidated on publish.
- Generated Open Graph image per site.
- Hide empty sections automatically.

## Conventions

- No `any`. Validate with Zod at every boundary: API input, AI output, database JSON.
- Mutations through server actions; AI calls only on the server.
- Use design tokens, never raw hex values or arbitrary Tailwind colours.
- UI copy follows the voice rules in `DESIGN.md`: sentence case, verb-first buttons.
- Keep prompts in `lib/ai/prompts/` as versioned files, not inline strings.

## Testing

- Schema tests for every Zod schema.
- Extraction and layout tests run against the anonymised CVs in `tests/fixtures/cvs` with a recorded-response mode, so CI never calls the API.
- E2E happy path: sign in → upload → review → choices → publish → visit `/c/{code}` → lands on the site.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_ROOT_DOMAIN=
```

## Out of scope for now

Billing, team or company accounts, custom domains, image or video galleries beyond a profile photo and project thumbnails.
