import { AppShell } from "../../app/AppShell";
import { useRequiredAdminUser } from "../../core/auth";

export function DashboardPage() {
  useRequiredAdminUser();
  const unresolvedAlerts = 0;
  const delayedTrips = 0;
  const activeTrips = 0;
  const onboardStudents = 0;
  const onTimeRate =
    activeTrips > 0
      ? Math.max(0, Math.min(100, Math.round(((activeTrips - delayedTrips) / activeTrips) * 100)))
      : 100;
  const alertPressure = Math.min(100, unresolvedAlerts * 10);

  return (
    <AppShell title="Dashboard" subtitle="Operations overview" activeRoute="dashboard" hideHeader>
      <section className="dashboard-kpi-grid">
        <MetricCard label="Active Trips" value={String(activeTrips)} />
        <MetricCard label="Delayed Trips" value={String(delayedTrips)} tone="warm" />
        <MetricCard label="Students Onboard" value={String(onboardStudents)} />
        <MetricCard label="Open Alerts" value={String(unresolvedAlerts)} tone="warm" />
      </section>

      <section className="dashboard-main-grid">
        <article className="panel dashboard-priority-panel">
          <h2>Priority Queue</h2>
          <div className="dashboard-priority-list">
            <PriorityRow label="Open alerts" value={String(unresolvedAlerts)} tone="warm" />
            <PriorityRow label="Delayed trips" value={String(delayedTrips)} tone="warm" />
            <PriorityRow label="Active trips" value={String(activeTrips)} />
            <PriorityRow label="Students onboard" value={String(onboardStudents)} />
          </div>
        </article>

        <article className="panel dashboard-health-panel">
          <h2>Network Health</h2>
          <HealthBar label="On-time rate" value={onTimeRate} tone="good" />
          <HealthBar label="Alert pressure" value={alertPressure} tone="warning" />
        </article>
      </section>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "warm";
}) {
  return (
    <article className={tone === "warm" ? "metric-card warm dashboard-kpi-card" : "metric-card dashboard-kpi-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function HealthBar({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "good" | "warning";
}) {
  return (
    <div className="dashboard-health-row">
      <div className="dashboard-health-meta">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="dashboard-health-track" aria-hidden="true">
        <div
          className={tone === "good" ? "dashboard-health-fill good" : "dashboard-health-fill warning"}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function PriorityRow({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "warm";
}) {
  return (
    <div className={tone === "warm" ? "priority-row warm" : "priority-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
