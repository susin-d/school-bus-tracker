import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type SchoolsOverviewProps = {
  view: AdminView;
};

export function SchoolsOverview({ view }: SchoolsOverviewProps) {
  if (view === "super_admin") {
    return (
      <ModulePanel
        title="Schools"
        summary="Global school lifecycle and rollout management."
        bullets={[
          "Create schools and review onboarding status",
          "Audit school-level health and alert volume",
          "Spot schools that need support before incidents stack up"
        ]}
      />
    );
  }

  return (
    <ModulePanel
      title="Routes, Buses, and Assignments"
      summary="Operational resource management for one school."
      bullets={[
        "Review route structure and stop coverage",
        "Track bus readiness and assignment quality",
        "Keep student transport mappings clean before the next day starts"
      ]}
    />
  );
}
