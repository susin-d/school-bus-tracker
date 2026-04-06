import {
  createRoute,
  deleteRoute,
  listRoutes,
  updateRoute
} from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function RoutesPage() {
  return (
    <ResourceCrudPage
      title="Routes"
      subtitle="Manage route masters used by trip planning and assignments."
      activeRoute="routes"
      resourceLabel="Routes"
      listResource={listRoutes}
      createResource={createRoute}
      updateResource={updateRoute}
      deleteResource={deleteRoute}
      createTemplate={{
        name: "",
        code: "",
        status: "active",
        school_id: ""
      }}
      fields={[
        { key: "name", label: "Name", placeholder: "Route name", required: true },
        { key: "code", label: "Code", placeholder: "Route code" },
        { key: "status", label: "Status", placeholder: "active" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
