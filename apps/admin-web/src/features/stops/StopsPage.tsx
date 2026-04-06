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
        name: "",
        code: "",
        address: "",
        school_id: ""
      }}
      fields={[
        { key: "name", label: "Name", placeholder: "Stop name", required: true },
        { key: "code", label: "Code", placeholder: "Stop code" },
        { key: "address", label: "Address", placeholder: "Stop address" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
