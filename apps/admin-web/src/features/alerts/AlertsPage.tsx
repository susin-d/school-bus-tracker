import { useState } from "react";

import { AppShell } from "../../app/AppShell";
import { acknowledgeAlert, listAlerts, resolveAlert } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

export function AlertsPage() {
  const currentUser = useRequiredAdminUser();
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { data, isLoading, error } = useResource(
    () => listAlerts(currentUser),
    [currentUser.id, reloadKey]
  );

  async function handleAcknowledge(alertId: string) {
    try {
      await acknowledgeAlert(currentUser, alertId);
      setFeedback("Alert acknowledged.");
      setReloadKey((value) => value + 1);
    } catch (actionError) {
      setFeedback(actionError instanceof Error ? actionError.message : "Acknowledge failed.");
    }
  }

  async function handleResolve(alertId: string) {
    try {
      await resolveAlert(currentUser, alertId, "Resolved from admin web");
      setFeedback("Alert resolved.");
      setReloadKey((value) => value + 1);
    } catch (actionError) {
      setFeedback(actionError instanceof Error ? actionError.message : "Resolve failed.");
    }
  }

  return (
    <AppShell
      title="Alerts"
      subtitle={
        currentUser.role === "super_admin"
          ? "Global alert management and intervention visibility."
          : "School-scoped alert management and escalation."
      }
      activeRoute="alerts"
    >
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>Open and Recent Alerts</h2>
          </div>
        </header>

        {isLoading && <p className="panel-summary">Loading alerts from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {feedback && <p className="panel-summary">{feedback}</p>}
        {data && (
          <div className="table-shell">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.type}</td>
                    <td>{alert.severity}</td>
                    <td>{alert.status}</td>
                    <td>{alert.message}</td>
                    <td>
                      {alert.status === "open" && (
                        <button
                          className="resource-action subtle"
                          onClick={() => handleAcknowledge(alert.id)}
                          type="button"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== "resolved" && (
                        <button
                          className="resource-danger"
                          onClick={() => handleResolve(alert.id)}
                          type="button"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
