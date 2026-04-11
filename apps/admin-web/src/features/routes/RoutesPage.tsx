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
        route_name: "",
        route_code: "",
        direction: "pickup",
        description: "",
        status: "active",
        school_id: ""
      }}
      fields={[
        { key: "route_name", label: "Name", placeholder: "Route name", required: true },
        { key: "route_code", label: "Code", placeholder: "Route code" },
        { key: "direction", label: "Direction", placeholder: "pickup or drop" },
        { key: "description", label: "Description", placeholder: "Route description" },
        { key: "status", label: "Status", placeholder: "active" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
