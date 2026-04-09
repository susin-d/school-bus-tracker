import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminRouterProvider, useAdminRouter } from "./router";

function RouterProbe() {
  const { currentRoute, navigate } = useAdminRouter();

  return (
    <div>
      <div data-testid="route">{currentRoute}</div>
      <button onClick={() => navigate("users")} type="button">
        go-users
      </button>
    </div>
  );
}

describe("AdminRouterProvider", () => {
  it("defaults to landing and normalizes empty hash", async () => {
    window.location.hash = "";

    render(
      <AdminRouterProvider>
        <RouterProbe />
      </AdminRouterProvider>
    );

    expect(screen.getByTestId("route")).toHaveTextContent("landing");

    await waitFor(() => {
      expect(window.location.hash).toBe("#/landing");
    });
  });

  it("updates route when navigate is called", async () => {
    window.location.hash = "#/";

    render(
      <AdminRouterProvider>
        <RouterProbe />
      </AdminRouterProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "go-users" }));

    await waitFor(() => {
      expect(window.location.hash).toBe("#/users");
      expect(screen.getByTestId("route")).toHaveTextContent("users");
    });
  });

  it("reacts to external hash changes", async () => {
    window.location.hash = "#/alerts";

    render(
      <AdminRouterProvider>
        <RouterProbe />
      </AdminRouterProvider>
    );

    expect(screen.getByTestId("route")).toHaveTextContent("alerts");

    window.location.hash = "#/mail";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(screen.getByTestId("route")).toHaveTextContent("mail");
    });
  });
});

