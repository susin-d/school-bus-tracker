# Backend Auth And Role Guide

## Goal

Use backend-mediated auth and keep role enforcement centralized in API + RLS.

## Current Auth Flows

- Phone OTP:
  - `POST /auth/otp/send`
  - `POST /auth/otp/verify`
- Email/password (admin web):
  - `POST /auth/email-login`
  - `GET /auth/me`
  - `POST /auth/logout`
- Session passthrough:
  - `POST /auth/session`
- Email workflows:
  - `POST /auth/forgot-password` (Brevo)
  - `POST /auth/email/send-verification` (Brevo + welcome email)

## Why Backend-Mediated Auth

- Removes direct Supabase auth logic from browser.
- Keeps one place for role checks (`admin` vs `super_admin` etc.).
- Ensures auth behavior can be audited and extended safely.

## Role Enforcement Layers

- Layer 1: API middleware and business checks.
- Layer 2: Supabase RLS policies.
- Both layers must stay consistent.

## Role Scope Rules

- `parent`:
  - own linked students/trips only
- `driver`:
  - own assigned trip actions/location updates only
- `admin`:
  - own school only
- `super_admin`:
  - all schools

## Required Env (API)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL`
- `STREAM_TOKEN_SECRET`

## Implementation References

- Auth routes:
  - `apps/api/src/modules/auth/routes.ts`
- Require-user middleware:
  - `apps/api/src/middleware/require-user.ts`
- Role middleware:
  - `apps/api/src/middleware/require-role.ts`
- Token schema and validation:
  - `apps/api/src/lib/validation.ts`
