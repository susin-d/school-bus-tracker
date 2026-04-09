import { useState } from "react";

import { AppShell } from "../../app/AppShell";
import { createUser, deleteUser, listUsers, updateUser } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";
import { UsersOverview } from "./UsersOverview";

export function UsersPage() {
  const currentUser = useRequiredAdminUser();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("parent");
  const [schoolId, setSchoolId] = useState(currentUser.schoolId ?? "");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading, error } = useResource(
    () => listUsers(currentUser),
    [currentUser.id, reloadKey]
  );

  async function handleCreateUser() {
    if (!fullName.trim()) {
      setFeedback("User name is required.");
      return;
    }

    try {
      await createUser(currentUser, {
        full_name: fullName.trim(),
        role,
        school_id: currentUser.role === "super_admin" ? (schoolId.trim() || undefined) : currentUser.schoolId,
        status: "active"
      });
      setFullName("");
      setFeedback("User created.");
      setReloadKey((value) => value + 1);
    } catch (createError) {
      setFeedback(createError instanceof Error ? createError.message : "Create failed.");
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await deleteUser(currentUser, userId);
      setFeedback("User deleted.");
      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      setFeedback(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  }

  async function handleUpdateUser() {
    if (!editId) {
      return;
    }

    try {
      await updateUser(currentUser, editId, {
        full_name: fullName.trim(),
        role,
        school_id: currentUser.role === "super_admin" ? (schoolId.trim() || undefined) : undefined,
        status: "active"
      });
      setEditId(null);
      setFullName("");
      setFeedback("User updated.");
      setReloadKey((value) => value + 1);
    } catch (updateError) {
      setFeedback(updateError instanceof Error ? updateError.message : "Update failed.");
    }
  }

  return (
    <AppShell
      title="Users"
      subtitle={
        currentUser.role === "super_admin"
          ? "Search and review users across all schools."
          : "Manage guardians and staff within one school."
      }
      activeRoute="users"
    >
      <section className="panel-grid compact" style={{ marginTop: 20 }}>
        <UsersOverview view={currentUser.role === "super_admin" ? "super_admin" : "school_admin"} />
      </section>
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>{currentUser.role === "super_admin" ? "Global Users" : "School Users"}</h2>
          </div>
        </header>
        <div className="resource-form">
          <input
            className="resource-input"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            value={fullName}
          />
          <select
            className="resource-input"
            onChange={(event) => setRole(event.target.value)}
            value={role}
          >
            <option value="parent">parent</option>
            <option value="driver">driver</option>
            <option value="admin">admin</option>
          </select>
          {currentUser.role === "super_admin" && (
            <input
              className="resource-input"
              onChange={(event) => setSchoolId(event.target.value)}
              placeholder="School ID"
              value={schoolId}
            />
          )}
          {editId == null ? (
            <button className="resource-action" onClick={handleCreateUser} type="button">
              Create User
            </button>
          ) : (
            <button className="resource-action" onClick={handleUpdateUser} type="button">
              Save User
            </button>
          )}
        </div>
        {feedback && <p className="panel-summary">{feedback}</p>}

        {isLoading && <p className="panel-summary">Loading users from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {data && (
          <div className="table-shell">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>School</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={String(user.id ?? user.full_name ?? Math.random())}>
                    <td>{String(user.id ?? "n/a")}</td>
                    <td>{String(user.full_name ?? user.name ?? "Unnamed User")}</td>
                    <td>{String(user.role ?? "n/a")}</td>
                    <td>{String(user.school_id ?? currentUser.schoolId ?? "global")}</td>
                    <td>
                      {user.id != null && (
                        <button
                          className="resource-action subtle"
                          onClick={() => {
                            setEditId(String(user.id));
                            setFullName(String(user.full_name ?? user.name ?? ""));
                            setRole(String(user.role ?? "parent"));
                            setSchoolId(String(user.school_id ?? currentUser.schoolId ?? ""));
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                      )}
                      {user.id != null && (
                        <button
                          className="resource-danger"
                          onClick={() => handleDeleteUser(String(user.id))}
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
