import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type AlertsOverviewProps = {
  view: AdminView;
};

export function AlertsOverview({ view }: AlertsOverviewProps) {
  return (
    <ModulePanel
      title="Alerts"
      summary={
        view === "school_admin"
          ? "Resolve school-scoped incidents with a clean audit trail."
          : "Monitor unresolved issues across the network and support the schools under pressure."
      }
      bullets={
        view === "school_admin"
          ? [
              "Prioritize SOS and delay alerts",
              "Acknowledge and resolve incidents without leaving context",
              "Escalate only when school-level resolution is not enough"
            ]
          : [
              "Watch alert trends across all schools",
              "Identify repeated issue clusters by school",
              "Prepare escalation and follow-up actions from a global view"
            ]
      }
    />
  );
}
