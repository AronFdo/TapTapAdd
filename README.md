# TapTapAdd

Turns a CV into a portfolio site, linked to a printed NFC card. See `CLAUDE.md` for the product and rules, `DESIGN.md` for the design system and `PLAN.md` for the build phases.

## Set up

Needs Node 24, pnpm 10 and Docker (for local Supabase).

```bash
pnpm install
cp .env.example .env.local
pnpm db:start            # prints the local anon and service role keys for .env.local
pnpm dev
```

- App: http://localhost:3000
- Component gallery: http://localhost:3000/dev/components
- A portfolio: http://jane.localhost:3000 (any `*.localhost` subdomain works without editing hosts)

## Check your work

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm build && pnpm test:e2e
```

Tests never call the Anthropic API. AI calls in tests answer from recordings in `tests/fixtures/ai`. To record a new one from the anonymised fixtures, run the test with `AI_MODE=record` and a real `ANTHROPIC_API_KEY`.

## Deploy

Vercel, with the root domain and a wildcard `*.{ROOT_DOMAIN}` both pointed at the project. `/dev/components` is available on previews and returns 404 in production.
