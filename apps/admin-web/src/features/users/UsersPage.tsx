import { createUser, deleteUser, listUsers, updateUser } from "../../core/api";
import { ResourceCrudPage } from "../resources/ResourceCrudPage";

export function UsersPage() {
  return (
    <ResourceCrudPage
      title="Users"
      subtitle="Manage users across schools with role and status controls."
      activeRoute="users"
      resourceLabel="Users"
      listResource={listUsers}
      createResource={createUser}
      updateResource={updateUser}
      deleteResource={deleteUser}
      createTemplate={{
        full_name: "",
        role: "parent",
        is_active: "true",
        school_id: "",
        phone_number: "",
        email: ""
      }}
      fields={[
        { key: "full_name", label: "Full Name", placeholder: "Full name", required: true },
        { key: "email", label: "Email", placeholder: "name@school.com", required: true },
        { key: "password", label: "Password", placeholder: "Min 6 characters" },
        { key: "role", label: "Role", placeholder: "parent | driver | admin | super_admin", required: true },
        { key: "is_active", label: "Is Active", placeholder: "true" },
        { key: "school_id", label: "School ID", placeholder: "School ID" },
        { key: "phone_number", label: "Phone", placeholder: "+91..." }
      ]}
    />
  );
}
