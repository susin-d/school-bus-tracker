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
        full_name: "",
        phone_number: "",
        email: "",
        password: "",
        license_number: "",
        assigned_bus_id: "",
        status: "active",
        is_active: "true",
        school_id: ""
      }}
      fields={[
        { key: "full_name", label: "Full Name", placeholder: "Driver name", required: true },
        { key: "phone_number", label: "Phone", placeholder: "Phone number", required: true },
        { key: "email", label: "Login Email", placeholder: "driver@school.com", required: true },
        { key: "password", label: "Login Password", placeholder: "••••••••", required: true },
        { key: "license_number", label: "License", placeholder: "License number" },
        { key: "assigned_bus_id", label: "Assigned Bus", placeholder: "Bus ID" },
        { key: "status", label: "Status", placeholder: "active" },
        {
          key: "is_active",
          label: "Is Active",
          placeholder: "Select status",
          type: "select",
          options: [
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" }
          ]
        },
        { key: "school_id", label: "School ID", placeholder: "Optional school identifier" }
      ]}
    />
  );
}
