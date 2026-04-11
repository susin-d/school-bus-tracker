import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type StudentsOverviewProps = {
  view: AdminView;
};

export function StudentsOverview({ view }: StudentsOverviewProps) {
  return (
    <ModulePanel
      title={view === "school_admin" ? "Students" : "Operations Overview"}
    />
  );
}
