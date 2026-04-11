import { useMemo, useState } from "react";

import { AppShell } from "../../app/AppShell";
import { acknowledgeAlert, listAlerts, resolveAlert } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

export function AlertsPage() {
  const currentUser = useRequiredAdminUser();
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"type" | "severity" | "status">("severity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { data, isLoading, error } = useResource(
    () => listAlerts(currentUser),
    [currentUser.id, reloadKey]
  );

  const filteredAlerts = useMemo(
    () =>
      (data?.alerts ?? []).filter((alert) => {
        const statusMatches = statusFilter === "all" || alert.status === statusFilter;
        const severityMatches = severityFilter === "all" || alert.severity === severityFilter;
        return statusMatches && severityMatches;
      }),
    [data?.alerts, severityFilter, statusFilter]
  );

  const sortedAlerts = useMemo(() => {
    const items = [...filteredAlerts];
    items.sort((left, right) => {
      const leftValue = sortBy === "type" ? left.type : sortBy === "status" ? left.status : left.severity;
      const rightValue = sortBy === "type" ? right.type : sortBy === "status" ? right.status : right.severity;
      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        sensitivity: "base"
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return items;
  }, [filteredAlerts, sortBy, sortDirection]);

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
          <div className="resource-actions-row">
            <select className="resource-input" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
            <select className="resource-input" onChange={(event) => setSeverityFilter(event.target.value)} value={severityFilter}>
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </header>

        <div className="resource-meta">
          <span>{filteredAlerts.length} visible</span>
          <span>{data?.alerts.length ?? 0} total</span>
        </div>

        <div className="resource-actions-row" style={{ marginBottom: 12 }}>
          <select className="resource-input" onChange={(event) => setSortBy(event.target.value as "type" | "severity" | "status")} value={sortBy}>
            <option value="severity">Sort: Severity</option>
            <option value="status">Sort: Status</option>
            <option value="type">Sort: Type</option>
          </select>
          <select className="resource-input" onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")} value={sortDirection}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {isLoading && <p className="panel-summary">Loading alerts from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {feedback && <p className="panel-summary" role="status">{feedback}</p>}
        {data && filteredAlerts.length === 0 && (
          <div className="empty-state">
            <strong>No alerts match the current filters.</strong>
            <span>Try a different severity or status filter.</span>
          </div>
        )}
        {data && filteredAlerts.length > 0 && (
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
                {sortedAlerts.map((alert) => (
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
