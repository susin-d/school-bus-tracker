import {
  createDriver,
  deleteDriver,
  listDrivers,
  updateDriver
} from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function DriversPage() {
  return (
    <ResourceCrudPage
      title="Drivers"
      subtitle="Manage driver operational records and school assignments."
      activeRoute="drivers"
      resourceLabel="Drivers"
      listResource={listDrivers}
      createResource={createDriver}
      updateResource={updateDriver}
      deleteResource={deleteDriver}
      createTemplate={{
        user_id: "",
        full_name: "",
        phone_number: "",
        license_number: "",
        assigned_bus_id: "",
        status: "active",
        school_id: ""
      }}
      fields={[
        { key: "user_id", label: "User ID", placeholder: "Linked user id", required: true },
        { key: "full_name", label: "Full Name", placeholder: "Driver name", required: true },
        { key: "phone_number", label: "Phone", placeholder: "Phone number" },
        { key: "license_number", label: "License", placeholder: "License number" },
        { key: "assigned_bus_id", label: "Assigned Bus", placeholder: "Bus ID" },
        { key: "status", label: "Status", placeholder: "active" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
