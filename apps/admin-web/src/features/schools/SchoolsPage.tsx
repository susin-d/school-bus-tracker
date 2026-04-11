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
        school_id: ""
      }}
      fields={[
        { key: "name", label: "Name", placeholder: "School name", required: true },
        { key: "address", label: "Address", placeholder: "Address" },
        { key: "latitude", label: "Latitude", placeholder: "13.0827" },
        { key: "longitude", label: "Longitude", placeholder: "80.2707" },
        { key: "is_active", label: "Is Active", placeholder: "true" },
        { key: "school_id", label: "School ID", placeholder: "Optional school identifier" }
      ]}
    />
  );
}
