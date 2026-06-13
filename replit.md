# ResidentVoice Portal

A multi-tenant SaaS platform where residential buildings register and get private resident portals. Residents can report issues, vote on priorities, and track formal resolutions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed demo data
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (`artifacts/api-server`)
- Frontend: React + Vite + shadcn/ui + TanStack Query (`artifacts/resident-voice`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Auth: express-session + connect-pg-simple (PostgreSQL session store)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema.ts` — source of truth for all DB tables
- `lib/api-spec/openapi.yaml` — source of truth for API contract
- `lib/api-client-react/src/generated/api.ts` — generated hooks (do not edit directly)
- `artifacts/api-server/src/routes/` — all backend route handlers
- `artifacts/api-server/src/app.ts` — Express app config (CORS, sessions)
- `artifacts/resident-voice/src/pages/` — all frontend pages
- `artifacts/resident-voice/src/contexts/AuthContext.tsx` — auth context + currentUser
- `scripts/src/seed.ts` — demo data seeder

## Architecture decisions

- **Session auth with explicit `req.session.save()`**: All login/register routes call `req.session.save(cb)` before responding to ensure the session is persisted to PostgreSQL before the cookie is sent to the client.
- **Session table**: The `session` table is NOT created by Drizzle migrations — it's managed by connect-pg-simple via `createTableIfMissing: true`. If it's missing, run the manual creation SQL in the seed script or run the app once.
- **Generated hook call signatures**: Hooks with separate params/options follow `useGetIssues(buildingId, params?, options?)`. The `options.query` object must always include `queryKey`. Hooks like `useGetAnnouncements(buildingId, options?)` take options as the 2nd arg directly.
- **Building-scoped routes**: All building-specific routes are mounted via `Router({ mergeParams: true })` at `/api/buildings/:buildingId/*`. Use `(req.params as any).buildingId` for TypeScript compatibility.
- **CORS**: `cors({ origin: true, credentials: true })` allows the Replit proxy to send credentials cross-origin. Session cookies use `SameSite=Lax` in dev, `SameSite=None; Secure` in production.

## Product

- **Multi-tenant**: Each residential building gets its own isolated portal with a custom slug URL
- **Roles**: `super_admin`, `building_admin`, `moderator`, `resident_owner`, `resident_tenant`
- **Issue reporting**: Residents report issues with urgency, category, location; others can vote and mark as affected
- **Resolution voting**: Formal Yes/No/Abstain votes on building resolutions with configurable pass thresholds
- **Announcements**: Building admins post announcements by category (emergency, maintenance, meeting, etc.)
- **Admin panel**: Full CRUD for issues, residents (approval/rejection), resolutions, announcements, and building settings

## Demo accounts (seed data)

All passwords: `password123`
- `superadmin@example.com` — Super Admin
- `admin@oceantower.com` — Building Admin (Ocean Tower)
- `owner@example.com` — Resident Owner, apt 12B
- `tenant@example.com` — Resident Tenant, apt 8A
- `pending@example.com` — Pending approval, apt 5C

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Always run `req.session.save(cb)` after setting session data** before sending the response — otherwise sessions may not persist to the DB in time.
- **The `session` table is not in Drizzle schema** — connect-pg-simple manages it. If the table is missing, it's created on first app start with `createTableIfMissing: true`.
- **Do not run `pnpm dev` at workspace root** — use workflow restart.
- **Verify with `typecheck`, not `build`** — `build` requires workflow-provided env vars.
- **OpenAPI codegen**: After changing `openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
