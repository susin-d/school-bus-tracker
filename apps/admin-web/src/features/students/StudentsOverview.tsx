import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type StudentsOverviewProps = {
  view: AdminView;
};

export function StudentsOverview({ view }: StudentsOverviewProps) {
  return (
    <ModulePanel
      title={view === "school_admin" ? "Students" : "Operations Overview"}
      summary={
        view === "school_admin"
          ? "Student records, attendance review, and guardian-linked transport visibility."
          : "Cross-school operational readouts with enough detail to spot risk early."
      }
      bullets={
        view === "school_admin"
          ? [
              "Search student records and open attendance history quickly",
              "Review guardian links and transport assignments",
              "Catch missing data before it turns into route-day confusion"
            ]
          : [
              "Compare school performance and incident load",
              "Review adoption patterns and resource coverage across schools",
              "Spot unusual transport trends that need central support"
            ]
      }
    />
  );
}
