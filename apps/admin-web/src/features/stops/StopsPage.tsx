import {
  createStop,
  deleteStop,
  listStops,
  updateStop
} from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function StopsPage() {
  return (
    <ResourceCrudPage
      title="Stops"
      subtitle="Control stop catalog and map-facing stop metadata."
      activeRoute="stops"
      resourceLabel="Stops"
      listResource={listStops}
      createResource={createStop}
      updateResource={updateStop}
      deleteResource={deleteStop}
      createTemplate={{
        stop_name: "",
        address: "",
        route_id: "",
        sequence_order: "",
        school_id: ""
      }}
      fields={[
        { key: "stop_name", label: "Name", placeholder: "Stop name", required: true },
        { key: "address", label: "Address", placeholder: "Stop address" },
        { key: "route_id", label: "Route", placeholder: "Route ID" },
        { key: "sequence_order", label: "Sequence", placeholder: "Sequence order" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
