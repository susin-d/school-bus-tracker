import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type LeaveRequestsOverviewProps = {
  view: AdminView;
};

export function LeaveRequestsOverview({ view }: LeaveRequestsOverviewProps) {
  return (
    <ModulePanel title="Leave Requests" />
  );
}
