import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("wiring regressions", () => {
  it("documents required stream token secrets in env template", () => {
    const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");

    expect(envExample).toContain("STREAM_TOKEN_SECRET=");
    expect(envExample).toContain("PARENT_RESET_OTP_SECRET=");
    expect(envExample).not.toContain("JWT_SECRET=");
  });

  it("does not reintroduce removed auth session endpoint", () => {
    const authRoutes = readFileSync(new URL("../src/modules/auth/routes.ts", import.meta.url), "utf8");

    expect(authRoutes).not.toContain('authRouter.post("/session"');
  });

  it("does not reintroduce removed maps drivers/live endpoint", () => {
    const mapsRoutes = readFileSync(new URL("../src/modules/maps/routes.ts", import.meta.url), "utf8");

    expect(mapsRoutes).not.toContain('mapsRouter.get("/drivers/live"');
  });
});
