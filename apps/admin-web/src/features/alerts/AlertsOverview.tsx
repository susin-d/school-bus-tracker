import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type AlertsOverviewProps = {
  view: AdminView;
};

export function AlertsOverview({ view }: AlertsOverviewProps) {
  return (
    <ModulePanel title="Alerts" />
  );
}
