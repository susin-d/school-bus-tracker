import { createSchool, deleteSchool, listSchools, updateSchool } from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function SchoolsPage() {
  return (
    <ResourceCrudPage
      title="Schools"
      subtitle="Global school management and rollout visibility for the platform owner."
      activeRoute="schools"
      resourceLabel="Schools"
      listResource={listSchools}
      createResource={createSchool}
      updateResource={updateSchool}
      deleteResource={deleteSchool}
      createTemplate={{
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        is_active: "true",
        school_id: "",
        email: "",
        password: ""
      }}
      fields={[
        { key: "name", label: "Name", placeholder: "School name", required: true },
        { key: "address", label: "Address", placeholder: "Address" },
        { key: "latitude", label: "Latitude", placeholder: "13.0827" },
        { key: "longitude", label: "Longitude", placeholder: "80.2707" },
        { key: "email", label: "Admin Email", placeholder: "admin@school.com", required: true },
        { key: "password", label: "Admin Password", placeholder: "••••••••", required: true },
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
