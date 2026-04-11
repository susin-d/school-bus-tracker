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
        bus_number: "",
        vehicle_number: "",
        capacity: "",
        driver_id: "",
        route_id: "",
        school_id: ""
      }}
      fields={[
        { key: "bus_number", label: "Bus Number", placeholder: "Bus number", required: true },
        { key: "vehicle_number", label: "Vehicle Number", placeholder: "Vehicle number" },
        { key: "capacity", label: "Capacity", placeholder: "Capacity" },
        { key: "driver_id", label: "Driver", placeholder: "Driver ID" },
        { key: "route_id", label: "Route", placeholder: "Route ID" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
