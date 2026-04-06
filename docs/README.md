# SchoolBus Bridge Docs Index

This folder contains the project specs plus implementation guides for current production behavior.

## Core Specs

- `docs/01-product-scope.md` - product scope and role model
- `docs/02-system-architecture.md` - current architecture and service boundaries
- `docs/03-repository-structure.md` - monorepo layout
- `docs/04-database-schema.md` - Supabase/Postgres data model and RLS surface
- `docs/05-api-spec.md` - current backend endpoints and auth model
- `docs/06-mobile-parent-spec.md` - parent app functional spec
- `docs/07-mobile-driver-spec.md` - driver app functional spec
- `docs/08-admin-web-spec.md` - school admin + super admin web behavior
- `docs/09-safety-and-compliance.md` - safety/compliance requirements
- `docs/10-implementation-roadmap.md` - phased implementation roadmap
- `docs/11-engineering-backlog.md` - execution backlog
- `docs/12-frontend-app-plan.md` - frontend app delivery plan

## New Implementation Guides

- `docs/13-backend-auth-and-role-guide.md` - backend-mediated auth, role checks, and token handling
- `docs/14-realtime-maps-and-routing-guide.md` - live maps, SSE stream tokens, ETA/routing flow
- `docs/15-rls-ci-and-seeding-guide.md` - deterministic RLS seed flow and CI enforcement
- `docs/16-frontend-integration-guide.md` - how admin web, parent app, and driver app connect safely

## Fast Start

1. Read `02-system-architecture.md`.
2. Read `05-api-spec.md`.
3. Configure env and run local apps from root `README.md`.
4. Run typecheck/tests before feature work.
5. For auth/realtime/RLS updates, also follow guides `13` to `15`.

## Source Of Truth

- API authorization and business logic: `apps/api`
- Database policy enforcement: `supabase/migrations`
- Web/mobile endpoint usage and role-safe client calls: frontend apps under `apps/`
