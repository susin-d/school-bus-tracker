import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type LeaveRequestsOverviewProps = {
  view: AdminView;
};

export function LeaveRequestsOverview({ view }: LeaveRequestsOverviewProps) {
  return (
    <ModulePanel
      title="Leave Requests"
      summary={
        view === "school_admin"
          ? "Review transport exceptions submitted by parents."
          : "Track leave volume and policy consistency across schools."
      }
      bullets={
        view === "school_admin"
          ? [
              "Approve pickup or drop-off exceptions",
              "Reduce day-of-trip misunderstandings for families",
              "Surface repeated absence patterns for intervention"
            ]
          : [
              "Review request volume trends by school",
              "Spot approval bottlenecks across the network",
              "Prepare policy guidance where schools handle requests inconsistently"
            ]
      }
    />
  );
}
