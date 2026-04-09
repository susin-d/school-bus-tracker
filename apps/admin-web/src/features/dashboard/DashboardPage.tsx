import { AppShell } from "../../app/AppShell";
import { getDashboard, listPlannerRuns } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";
import { roleContent, screenPlan } from "../shared/content";

export function DashboardPage() {
  const currentUser = useRequiredAdminUser();
  const { data, isLoading, error } = useResource(
    () => getDashboard(currentUser),
    [currentUser.id]
  );
  const {
    data: plannerRuns,
    isLoading: isPlannerRunsLoading,
    error: plannerRunsError
  } = useResource(
    () => listPlannerRuns(currentUser, 12),
    [currentUser.id]
  );

  const view = currentUser.role === "super_admin" ? "super_admin" : "school_admin";
  const content = roleContent[view];

  return (
    <AppShell title={content.title} subtitle={content.subtitle} activeRoute="dashboard">
      <section className="stats-grid">
        {isLoading && <LoadingPanel title="Loading dashboard" body="Pulling operational metrics from the API." />}
        {error && <ErrorPanel title="Dashboard unavailable" body={error} />}
        {data && (
          <>
            <MetricCard label="Active Trips" value={String(data.activeTrips)} />
            <MetricCard label="Delayed Trips" value={String(data.delayedTrips)} tone="warm" />
            <MetricCard label="Students Onboard" value={String(data.onboardStudents)} />
            <MetricCard label="Unresolved Alerts" value={String(data.unresolvedAlerts)} tone="warm" />
          </>
        )}
      </section>

      <section className="panel-grid">
        {content.primaryModules.map((module) => (
          <article className="panel" key={module.title}>
            <h2>{module.title}</h2>
            <p className="panel-summary">{module.summary}</p>
            <ul className="stack-list">
              {module.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="resource-panel" style={{ marginTop: 20 }}>
        <header className="resource-header">
          <div>
            <p className="eyebrow">Product Coverage</p>
            <h2>Screen Plan</h2>
          </div>
        </header>
        <div className="panel-grid compact">
          <article className="panel">
            <h2>Parent App</h2>
            <ul className="stack-list">
              {screenPlan.parent.map((screen) => (
                <li key={screen}>{screen}</li>
              ))}
            </ul>
          </article>
          <article className="panel">
            <h2>School Admin</h2>
            <ul className="stack-list">
              {screenPlan.schoolAdmin.map((screen) => (
                <li key={screen}>{screen}</li>
              ))}
            </ul>
          </article>
          <article className="panel">
            <h2>Super Admin</h2>
            <ul className="stack-list">
              {screenPlan.superAdmin.map((screen) => (
                <li key={screen}>{screen}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="resource-panel" style={{ marginTop: 20 }}>
        <header className="resource-header">
          <div>
            <p className="eyebrow">Planner History</p>
            <h2>Nightly + Manual Route Planning Runs</h2>
          </div>
        </header>
        {isPlannerRunsLoading && (
          <p className="panel-summary">Loading planner run history.</p>
        )}
        {plannerRunsError && <p className="panel-summary error-copy">{plannerRunsError}</p>}
        {plannerRuns && (
          <div className="table-shell">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>School</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>Processed</th>
                  <th>Planned</th>
                  <th>Skipped</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {plannerRuns.runs.map((run) => (
                  <tr key={run.id}>
                    <td>{run.startedAt}</td>
                    <td>{run.schoolId}</td>
                    <td>{run.triggerType}</td>
                    <td>{run.status}</td>
                    <td>{run.processedTrips}</td>
                    <td>{run.plannedTrips}</td>
                    <td>{run.skippedTrips}</td>
                    <td>{run.errorMessage ?? "-"}</td>
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
    <article className={tone === "warm" ? "metric-card warm" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function LoadingPanel({ title, body }: { title: string; body: string }) {
  return (
    <article className="panel panel-span-all">
      <h2>{title}</h2>
      <p className="panel-summary">{body}</p>
    </article>
  );
}

function ErrorPanel({ title, body }: { title: string; body: string }) {
  return (
    <article className="panel panel-span-all error-panel">
      <h2>{title}</h2>
      <p className="panel-summary">{body}</p>
    </article>
  );
}
