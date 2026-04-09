import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminSessionProvider, useAdminSession } from "./auth";

function SessionProbe() {
  const {
    currentUser,
    mode,
    signInWithEmailPassword,
    signOutSession,
    authError,
    clearAuthError,
    setMode
  } = useAdminSession();

  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="user">{currentUser?.id ?? "none"}</div>
      <div data-testid="error">{authError ?? ""}</div>
      <button
        onClick={() => {
          void signInWithEmailPassword("admin@example.com", "secret");
        }}
        type="button"
      >
        login
      </button>
      <button
        onClick={() => {
          void signOutSession();
        }}
        type="button"
      >
        logout
      </button>
      <button
        onClick={() => {
          clearAuthError();
        }}
        type="button"
      >
        clear-error
      </button>
      <button onClick={() => setMode("preview")} type="button">
        preview-mode
      </button>
    </div>
  );
}

function mockResponse(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn(async () => body)
  } as unknown as Response;
}

describe("AdminSessionProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in preview mode with preview user", () => {
    render(
      <AdminSessionProvider>
        <SessionProbe />
      </AdminSessionProvider>
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("preview");
    expect(screen.getByTestId("user")).toHaveTextContent("admin-1");
  });

  it("signs in and loads a session admin", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        mockResponse({
          token: "token-123",
          user: {
            id: "admin-9",
            schoolId: "school-1",
            role: "admin",
            fullName: "Admin Nine"
          }
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          user: {
            id: "admin-9",
            schoolId: "school-1",
            role: "admin",
            fullName: "Admin Nine"
          }
        })
      );

    render(
      <AdminSessionProvider>
        <SessionProbe />
      </AdminSessionProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("mode")).toHaveTextContent("session");
      expect(screen.getByTestId("user")).toHaveTextContent("admin-9");
    });
  });

  it("rejects non-admin users and sets auth error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({
        token: "token-parent",
        user: {
          id: "parent-1",
          schoolId: "school-1",
          role: "parent",
          fullName: "Parent One"
        }
      })
    );

    render(
      <AdminSessionProvider>
        <SessionProbe />
      </AdminSessionProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "This account is not allowed in admin web"
      );
      expect(screen.getByTestId("mode")).toHaveTextContent("preview");
    });

    fireEvent.click(screen.getByRole("button", { name: "clear-error" }));
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("logs out and clears session user", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        mockResponse({
          token: "token-123",
          user: {
            id: "admin-9",
            schoolId: "school-1",
            role: "admin",
            fullName: "Admin Nine"
          }
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          user: {
            id: "admin-9",
            schoolId: "school-1",
            role: "admin",
            fullName: "Admin Nine"
          }
        })
      )
      .mockResolvedValueOnce(mockResponse({ success: true }));

    render(
      <AdminSessionProvider>
        <SessionProbe />
      </AdminSessionProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("mode")).toHaveTextContent("session");
    });

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/logout",
      expect.objectContaining({ method: "POST" })
    );
  });
});
