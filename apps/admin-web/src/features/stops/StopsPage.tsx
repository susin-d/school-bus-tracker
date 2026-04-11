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
        latitude: "",
        longitude: "",
        route_id: "",
        sequence_order: "",
        is_active: "true",
        school_id: ""
      }}
      fields={[
        { key: "stop_name", label: "Name", placeholder: "Stop name", required: true },
        { key: "address", label: "Address", placeholder: "Stop address" },
        { key: "latitude", label: "Latitude", placeholder: "13.0827" },
        { key: "longitude", label: "Longitude", placeholder: "80.2707" },
        { key: "route_id", label: "Route", placeholder: "Route ID" },
        { key: "sequence_order", label: "Sequence", placeholder: "Sequence order" },
        { key: "is_active", label: "Is Active", placeholder: "true" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
