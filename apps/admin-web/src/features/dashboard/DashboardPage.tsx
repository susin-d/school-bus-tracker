import { AppShell } from "../../app/AppShell";
import { getDashboard, listPlannerRuns } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useAdminRouter } from "../../core/router";
import { useResource } from "../../core/useResource";
import { roleContent, screenPlan } from "../shared/content";

export function DashboardPage() {
  const currentUser = useRequiredAdminUser();
  const { navigate } = useAdminRouter();
  const { data, isLoading, error } = useResource(() => getDashboard(currentUser), [currentUser.id]);
  const {
    data: plannerRuns,
    isLoading: isPlannerRunsLoading,
    error: plannerRunsError
  } = useResource(() => listPlannerRuns(currentUser, 12), [currentUser.id]);

  const view = currentUser.role === "super_admin" ? "super_admin" : "school_admin";
  const content = roleContent[view];
  const unresolvedAlerts = data?.unresolvedAlerts ?? 0;
  const delayedTrips = data?.delayedTrips ?? 0;
  const activeTrips = data?.activeTrips ?? 0;
  const onboardStudents = data?.onboardStudents ?? 0;
  const plannerRunsCount = plannerRuns?.runs.length ?? 0;

  return (
    <AppShell title={content.title} subtitle={content.subtitle} activeRoute="dashboard">
      <section className="dashboard-hero-grid">
        <article className="panel dashboard-hero-card">
          <p className="eyebrow">Live Operations</p>
          <h2>Today’s control center</h2>
          <p className="panel-summary">
            Track the highest-priority transport signals first, then move into alerts,
            route planning, and record management.
          </p>
          <div className="dashboard-toolbar-actions">
            <button className="subnav-link" onClick={() => navigate("liveMap")} type="button">
              Open Live Map
            </button>
            <button className="resource-action" onClick={() => navigate("alerts")} type="button">
              Review Alerts
            </button>
          </div>
        </article>

        <article className="panel dashboard-status-card">
          <div className="dashboard-status-grid">
            <MetricCard label="Active Trips" value={String(activeTrips)} helper="Vehicles in motion" />
            <MetricCard
              label="Delayed Trips"
              value={String(delayedTrips)}
              helper="Behind schedule"
              tone="warm"
            />
            <MetricCard
              label="Students Onboard"
              value={String(onboardStudents)}
              helper="Live tracked riders"
            />
            <MetricCard
              label="Unresolved Alerts"
              value={String(unresolvedAlerts)}
              helper="Needs action now"
              tone="warm"
            />
          </div>
        </article>
      </section>

      <section className="dashboard-work-grid">
        <article className="panel dashboard-work-panel">
          <div className="resource-header">
            <div>
              <p className="eyebrow">Priority Work</p>
              <h2>What needs attention</h2>
            </div>
          </div>
          {isLoading && (
            <LoadingPanel title="Loading dashboard" body="Pulling operational metrics from the API." />
          )}
          {error && <ErrorPanel title="Dashboard unavailable" body={error} />}
          {data && (
            <div className="dashboard-priority-list">
              <PriorityRow label="Open alerts" value={String(unresolvedAlerts)} tone="warm" />
              <PriorityRow label="Delayed trips" value={String(delayedTrips)} />
              <PriorityRow label="Planning runs" value={String(plannerRunsCount)} />
            </div>
          )}
        </article>

        <article className="panel dashboard-work-panel">
          <div className="resource-header">
            <div>
              <p className="eyebrow">Role Focus</p>
              <h2>Operational modules</h2>
            </div>
          </div>
          <div className="dashboard-module-grid">
            {content.primaryModules.map((module) => (
              <article className="dashboard-module-card" key={module.title}>
                <h3 className="dashboard-module-title">{module.title}</h3>
                <p className="panel-summary">{module.summary}</p>
                <ul className="stack-list">
                  {module.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-grid dashboard-secondary-grid">
        {content.secondaryModules.map((module) => (
          <article className="panel dashboard-support-card" key={module.title}>
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

      <section className="resource-panel dashboard-reference-panel" style={{ marginTop: 20 }}>
        <header className="resource-header">
          <div>
            <p className="eyebrow">Product Coverage</p>
            <h2>Screen plan</h2>
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
        {isPlannerRunsLoading && <p className="panel-summary">Loading planner run history.</p>}
        {plannerRunsError && <p className="panel-summary error-copy">{plannerRunsError}</p>}
        {plannerRuns && plannerRuns.runs.length > 0 && (
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
                    <td>{formatDateTime(run.startedAt)}</td>
                    <td>{run.schoolId}</td>
                    <td>{run.triggerType}</td>
                    <td>
                      <span className={getPlannerStatusClass(run.status)}>{run.status}</span>
                    </td>
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
        {plannerRuns && plannerRuns.runs.length === 0 && (
          <p className="panel-summary">No planner runs yet. Scheduled and manual runs will appear here.</p>
        )}
        {!plannerRuns && !isPlannerRunsLoading && !plannerRunsError && (
          <p className="panel-summary">Planner history will appear here once route generation begins.</p>
        )}
      </section>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "default"
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "warm";
}) {
  return (
    <article className={tone === "warm" ? "metric-card warm" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p className="panel-summary">{helper}</p>
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

function formatDateTime(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  return parsed.toLocaleString();
}

function getPlannerStatusClass(status: string) {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "success" || normalizedStatus === "completed") {
    return "planner-status planner-status-success";
  }

  if (normalizedStatus === "running" || normalizedStatus === "queued") {
    return "planner-status planner-status-running";
  }

  if (normalizedStatus === "failed" || normalizedStatus === "error") {
    return "planner-status planner-status-failed";
  }

  return "planner-status";
}
