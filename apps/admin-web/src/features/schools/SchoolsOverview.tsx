import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type SchoolsOverviewProps = {
  view: AdminView;
};

export function SchoolsOverview({ view }: SchoolsOverviewProps) {
  if (view === "super_admin") {
    return (
      <ModulePanel title="Schools" />
    );
  }

  return (
    <ModulePanel title="Routes, Buses, and Assignments" />
  );
}
