import {
  createAssignment,
  deleteAssignment,
  listAssignments,
  updateAssignment
} from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function AssignmentsPage() {
  return (
    <ResourceCrudPage
      title="Assignments"
      subtitle="Manage student transport assignment relationships."
      activeRoute="assignments"
      resourceLabel="Assignments"
      listResource={listAssignments}
      createResource={createAssignment}
      updateResource={updateAssignment}
      deleteResource={deleteAssignment}
      createTemplate={{
        student_id: "",
        route_id: "",
        stop_id: "",
        bus_id: "",
        status: "active",
        school_id: ""
      }}
      fields={[
        { key: "student_id", label: "Student", placeholder: "Student ID", required: true },
        { key: "route_id", label: "Route", placeholder: "Route ID" },
        { key: "stop_id", label: "Stop", placeholder: "Stop ID" },
        { key: "bus_id", label: "Bus", placeholder: "Bus ID" },
        { key: "status", label: "Status", placeholder: "active" },
        { key: "school_id", label: "School", placeholder: "School ID (super admin only)" }
      ]}
    />
  );
}
