import { ModulePanel } from "../shared/ModulePanel";
import type { AdminView } from "../shared/types";

type UsersOverviewProps = {
  view: AdminView;
};

export function UsersOverview({ view }: UsersOverviewProps) {
  if (view === "super_admin") {
    return (
      <ModulePanel
        title="Users"
        summary="Global user search and governance across schools."
        bullets={[
          "Filter users by school and role",
          "Review school admin coverage and ownership gaps",
          "Prepare a clean handoff path for permissions and support"
        ]}
      />
    );
  }

  return (
    <ModulePanel
      title="Parents and Staff"
      summary="School-scoped visibility into guardians and operations users."
      bullets={[
        "Search parents, drivers, and admins in one place",
        "Confirm that every student has the right guardian mapping",
        "Review staff records without crossing school boundaries"
      ]}
    />
  );
}
