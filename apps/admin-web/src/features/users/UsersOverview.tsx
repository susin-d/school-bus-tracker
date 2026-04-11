import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type UsersOverviewProps = {
  view: AdminView;
};

export function UsersOverview({ view }: UsersOverviewProps) {
  if (view === "super_admin") {
    return (
      <ModulePanel title="Users" />
    );
  }

  return (
    <ModulePanel title="Parents and Staff" />
  );
}
