# Recommended Repository Structure

```text
school-bus-bridge/
  apps/
    mobile/
      lib/
        core/
        features/
          auth/
          parent/
          driver/
          trips/
          notifications/
        widgets/
      test/
      pubspec.yaml
    admin-web/
      src/
        pages/
        features/
          dashboard/
          routes/
          buses/
          students/
          drivers/
          alerts/
          reports/
        components/
        lib/
    api/
      src/
        modules/
          auth/
          users/
          schools/
          students/
          buses/
          routes/
          trips/
          attendance/
          alerts/
          notifications/
          leaves/
          reports/
        middleware/
        lib/
        jobs/
        events/
  packages/
    shared/
      src/
        types/
        schemas/
        constants/
        utils/
  docs/
```

## Shared Package Contents

- TypeScript DTOs shared across web and API
- Zod schemas for request and response validation
- Role constants and permission helpers
- Event names for realtime channels

## Initial Environment Files

### API

- `.env` for Supabase keys, Brevo settings, stream token secret, and Maps API key

### Mobile

- `--dart-define` or `.env` strategy for API base URL, Maps key, and feature flags

### Admin Web

- `.env` for API base URL and Maps key

## CI Suggestions

- Lint on every push
- Typecheck all TypeScript workspaces
- Run API tests and shared package tests
- Build admin web
- Run `flutter analyze` and `flutter test`
