import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createRoute,
  deleteSchool,
  listSchools,
  listUsers
} from "./api";
import type { AdminRequestUser } from "./roleAccess";

function mockResponse(input: {
  ok: boolean;
  status?: number;
  statusText?: string;
  jsonData?: unknown;
  textData?: string;
  jsonThrows?: boolean;
}) {
  return {
    ok: input.ok,
    status: input.status ?? 200,
    statusText: input.statusText ?? "OK",
    json: input.jsonThrows
      ? vi.fn(async () => {
          throw new Error("invalid json");
        })
      : vi.fn(async () => input.jsonData),
    text: vi.fn(async () => input.textData ?? "")
  } as unknown as Response;
}

const adminUser: AdminRequestUser = {
  id: "admin-1",
  label: "Admin",
  role: "admin",
  schoolId: "school-1",
  accessToken: "token-1"
};

describe("admin api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls /users for listUsers", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({ ok: true, jsonData: { items: [] } }));

    await listUsers(adminUser);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/admin/users?schoolId=school-1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("calls /routes for resource creation", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({ ok: true, jsonData: { id: "route-1" } }));

    await createRoute(adminUser, { name: "Morning Route" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/admin/routes?schoolId=school-1",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Morning Route" })
      })
    );
  });

  it("handles empty successful response bodies", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse({ ok: true, status: 204, statusText: "No Content", textData: "" })
    );

    await expect(deleteSchool(adminUser, "school-9")).resolves.toBeUndefined();
  });

  it("surfaces non-json error body text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        jsonThrows: true,
        textData: "proxy unavailable"
      })
    );

    await expect(listSchools(adminUser)).rejects.toThrow("Request failed");
  });

  it("falls back to status text when error body is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        jsonThrows: true,
        textData: ""
      })
    );

    await expect(listSchools(adminUser)).rejects.toThrow(
      "Request failed"
    );
  });
});
