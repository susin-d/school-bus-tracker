# RLS CI And Seeding Guide

## Goal

Make role security testable and enforced in CI with deterministic fixtures.

## Deterministic Fixture Seeder

- Script:
  - `apps/api/src/scripts/seed-rls-fixtures.ts`
- Command:
  - `npm run -w @school-bus/api rls:seed`
- Seeds:
  - 2 schools
  - super admin
  - admin per school
  - driver per school
  - parent
  - students, trips, guardian links
- Also generates tokens and ids needed by RLS integration tests.

## RLS Integration Tests

- File:
  - `apps/api/tests/rls.integration.test.ts`
- Command:
  - `npm run -w @school-bus/api test:rls`

## Required Test Env

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `RLS_PARENT_TOKEN`
- `RLS_DRIVER_TOKEN`
- `RLS_ADMIN_TOKEN`
- `RLS_SUPER_ADMIN_TOKEN`
- `RLS_PARENT_STUDENT_ID`
- `RLS_OTHER_STUDENT_ID`
- `RLS_DRIVER_TRIP_ID`
- `RLS_OTHER_TRIP_ID`
- `RLS_ADMIN_SCHOOL_ID`
- `RLS_OTHER_SCHOOL_ID`

## CI Enforcement

- Workflow:
  - `.github/workflows/rls-staging.yml`
- Behavior:
  - applies Supabase migrations to staging DB branch
  - seeds deterministic fixtures/tokens
  - runs RLS integration tests
  - fails pipeline on missing env or test failure

## Important

- API checks and RLS checks both must pass.
- A route passing API tests is not considered secure if RLS tests fail.
