import { describe, expect, it } from "vitest";

import { canAccessRoute, getAllowedRoutes } from "./roleAccess";

describe("roleAccess", () => {
  it("returns expected routes for admin", () => {
    const routes = getAllowedRoutes("admin");

    expect(routes).toContain("dashboard");
    expect(routes).toContain("users");
    expect(routes).not.toContain("schools");
  });

  it("returns expected routes for super_admin", () => {
    const routes = getAllowedRoutes("super_admin");

    expect(routes).toContain("dashboard");
    expect(routes).toContain("schools");
  });

  it("checks route accessibility correctly", () => {
    expect(canAccessRoute("admin", "schools")).toBe(false);
    expect(canAccessRoute("super_admin", "schools")).toBe(true);
    expect(canAccessRoute("admin", "alerts")).toBe(true);
  });
});
