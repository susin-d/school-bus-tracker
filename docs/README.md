# SchoolBus Bridge Docs Index

This folder contains the project specs plus implementation guides for current production behavior.
Last updated: April 2026

## Core Specs

- `docs/01-product-scope.md` - product scope and role model
- `docs/02-system-architecture.md` - current architecture and service boundaries
- `docs/03-repository-structure.md` - monorepo layout
- `docs/04-database-schema.md` - Supabase/Postgres data model with transport management schema (April 2026 update)
- `docs/05-api-spec.md` - current backend endpoints, auth model, and backward compatibility strategy
- `docs/06-mobile-parent-spec.md` - parent app functional spec
- `docs/07-mobile-driver-spec.md` - driver app functional spec (updated April 2026)
- `docs/08-admin-web-spec.md` - school admin + super admin web behavior
- `docs/09-safety-and-compliance.md` - safety/compliance requirements
- `docs/10-implementation-roadmap.md` - phased implementation roadmap with April 2026 status
- `docs/11-engineering-backlog.md` - execution backlog
- `docs/12-frontend-app-plan.md` - frontend app delivery plan

## Implementation Guides

- `docs/13-backend-auth-and-role-guide.md` - backend-mediated auth, role checks, and token handling
- `docs/14-realtime-maps-and-routing-guide.md` - live maps, SSE stream tokens, ETA/routing flow
- `docs/15-rls-ci-and-seeding-guide.md` - deterministic RLS seed flow and CI enforcement
- `docs/16-frontend-integration-guide.md` - how admin web, parent app, and driver app connect safely
- `docs/00-documentation-updates.md` - April 2026 documentation changelog and structure guide
- `docs/mobile-api-types.ts` - TypeScript response types for mobile APIs

## API Reference (New April 2026)

See project root for comprehensive endpoint documentation:
- `../MOBILE_API_ENDPOINTS.md` - Complete reference for driver (23) and parent (9) mobile app endpoints
- `../ENDPOINT_VALIDATION.md` - Implementation validation checklist (32/32 endpoints verified)
- `../MOBILE_ENDPOINTS_COMPLETE.md` - Final deployment sign-off document

## Fast Start

1. Read `02-system-architecture.md`.
2. Read `05-api-spec.md` (see backward compatibility section for schema migration).
3. For mobile apps, see `../MOBILE_API_ENDPOINTS.md`.
4. Configure env and run local apps from root `README.md`.
5. Run typecheck/tests before feature work.
6. For auth/realtime/RLS updates, also follow guides `13` to `15`.

## Key Updates (April 2026)

✅ **Transport Management Schema**
- Driver: 20+ new fields (full_name, phone_number, license_number, medical info, etc.)
- Student: 18+ new fields (admission_number, home_address, RFID/QR codes, etc.)
- Bus: 8 new fields (bus_number, vehicle_number, capacity, driver_id, etc.)
- Route: 4 new fields (route_name, route_code, direction, description)
- Stop: 5 new fields (stop_name, address, coordinates, sequence_order, etc.)
- Parent: New table with student linkage and notification preferences

✅ **Backend Compatibility**
- Field aliasing for seamless migration (old → new names)
- Idempotent migrations with full backward compatibility
- Response parsing includes both old and new field names

✅ **Milestone Status**
- Milestones 0-5: COMPLETE ✅
- Milestone 6 (Safety Intelligence): IN PROGRESS 🟡
- Milestone 7 (Premium Features): PLANNED 🔄

## Source Of Truth

- API authorization and business logic: `apps/api`
- Database schema and policy enforcement: `supabase/migrations`
- Web/mobile endpoint usage and role-safe client calls: frontend apps under `apps/`
- API endpoints for mobile: see `../MOBILE_API_ENDPOINTS.md`
