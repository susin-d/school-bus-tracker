import {
  createBus,
  deleteBus,
  listBuses,
  updateBus
} from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function BusesPage() {
  return (
    <ResourceCrudPage
      title="Buses"
      subtitle="Maintain vehicle records used for active and planned trips."
      activeRoute="buses"
      resourceLabel="Buses"
      listResource={listBuses}
      createResource={createBus}
      updateResource={updateBus}
      deleteResource={deleteBus}
      createTemplate={{
        label: "",
        registration_no: "",
        capacity: "",
        school_id: ""
      }}
      fields={[
        { key: "label", label: "Label", placeholder: "Bus label", required: true },
        { key: "registration_no", label: "Registration", placeholder: "Registration number" },
        { key: "capacity", label: "Capacity", placeholder: "Capacity" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
