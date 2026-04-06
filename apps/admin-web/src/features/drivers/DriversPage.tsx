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
        license_no: "",
        status: "active",
        school_id: ""
      }}
      fields={[
        { key: "user_id", label: "User ID", placeholder: "Linked user id", required: true },
        { key: "license_no", label: "License", placeholder: "License number" },
        { key: "status", label: "Status", placeholder: "active" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
