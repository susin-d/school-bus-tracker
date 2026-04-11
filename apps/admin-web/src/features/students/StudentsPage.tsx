import { createStudent, deleteStudent, listStudents, updateStudent } from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function StudentsPage() {
  return (
    <ResourceCrudPage
      title="Students"
      subtitle="Manage student roster, assignment links, and transport metadata."
      activeRoute="students"
      resourceLabel="Students"
      listResource={listStudents}
      createResource={createStudent}
      updateResource={updateStudent}
      deleteResource={deleteStudent}
      createTemplate={{
        first_name: "",
        last_name: "",
        grade: "",
        class: "",
        section: "",
        roll_number: "",
        pickup_stop_id: "",
        drop_stop_id: "",
        route_id: "",
        assigned_bus_id: "",
        transport_status: "active",
        home_address: "",
        latitude: "",
        longitude: "",
        school_id: "",
        is_active: "true"
      }}
      fields={[
        { key: "first_name", label: "First Name", placeholder: "First name", required: true },
        { key: "last_name", label: "Last Name", placeholder: "Last name", required: true },
        { key: "grade", label: "Grade", placeholder: "Grade" },
        { key: "class", label: "Class", placeholder: "Class" },
        { key: "section", label: "Section", placeholder: "Section" },
        { key: "roll_number", label: "Roll Number", placeholder: "Roll number" },
        { key: "pickup_stop_id", label: "Pickup Stop", placeholder: "Stop ID" },
        { key: "drop_stop_id", label: "Drop Stop", placeholder: "Stop ID" },
        { key: "route_id", label: "Route", placeholder: "Route ID" },
        { key: "assigned_bus_id", label: "Assigned Bus", placeholder: "Bus ID" },
        { key: "transport_status", label: "Transport Status", placeholder: "active" },
        { key: "home_address", label: "Home Address", placeholder: "Address" },
        { key: "latitude", label: "Latitude", placeholder: "13.0827" },
        { key: "longitude", label: "Longitude", placeholder: "80.2707" },
        { key: "school_id", label: "School ID", placeholder: "School ID" },
        { key: "is_active", label: "Is Active", placeholder: "true" }
      ]}
    />
  );
}
