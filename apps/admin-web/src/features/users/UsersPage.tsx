import { useMemo, useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [nameError, setNameError] = useState("");

  const { data, isLoading, error } = useResource(
    () => listUsers(currentUser),
    [currentUser.id, reloadKey]
  );
  const filteredUsers = useMemo(() => {
    const items = data?.items ?? [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((user) =>
      [user.id, user.full_name, user.name, user.role, user.school_id]
        .filter((value) => value != null)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [data?.items, searchQuery]);

  function resetForm() {
    setEditId(null);
    setFullName("");
    setRole("parent");
    setSchoolId(currentUser.schoolId ?? "");
    setNameError("");
  }

  function startEdit(user: Record<string, unknown>) {
    setEditId(String(user.id));
    setFullName(String(user.full_name ?? user.name ?? ""));
    setRole(String(user.role ?? "parent"));
    setSchoolId(String(user.school_id ?? currentUser.schoolId ?? ""));
    setNameError("");
    setFeedback(`Editing user ${String(user.id)}.`);
  }

  async function handleCreateUser() {
    if (!fullName.trim()) {
      setNameError("User name is required.");
      setFeedback("Fix the highlighted field before saving.");
      return;
    }

    try {
      await createUser(currentUser, {
        full_name: fullName.trim(),
        role,
        school_id: currentUser.role === "super_admin" ? (schoolId.trim() || undefined) : currentUser.schoolId,
        status: "active"
      });
      resetForm();
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

    if (!fullName.trim()) {
      setNameError("User name is required.");
      setFeedback("Fix the highlighted field before saving.");
      return;
    }

    try {
      await updateUser(currentUser, editId, {
        full_name: fullName.trim(),
        role,
        school_id: currentUser.role === "super_admin" ? (schoolId.trim() || undefined) : undefined,
        status: "active"
      });
      resetForm();
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
      <section className="resource-panel resource-workspace">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>{currentUser.role === "super_admin" ? "Global Users" : "School Users"}</h2>
          </div>
          <input
            className="resource-input resource-search"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search users"
            value={searchQuery}
          />
        </header>
        <div className="resource-meta">
          <span>{filteredUsers.length} visible</span>
          <span>{data?.items.length ?? 0} total</span>
        </div>

        <div className="resource-workspace">
          <aside className="resource-panel resource-editor">
            <div className="resource-form resource-form-stacked">
              <label className="resource-field">
                <span>Full name *</span>
                <input
                  className={nameError ? "resource-input resource-input-error" : "resource-input"}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setNameError("");
                  }}
                  placeholder="Full name"
                  value={fullName}
                />
                {nameError && <small className="field-error">{nameError}</small>}
              </label>
              <label className="resource-field">
                <span>Role</span>
                <select className="resource-input" onChange={(event) => setRole(event.target.value)} value={role}>
                  <option value="parent">parent</option>
                  <option value="driver">driver</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              {currentUser.role === "super_admin" && (
                <label className="resource-field">
                  <span>School ID</span>
                  <input
                    className="resource-input"
                    onChange={(event) => setSchoolId(event.target.value)}
                    placeholder="School ID"
                    value={schoolId}
                  />
                </label>
              )}
            </div>
            <div className="resource-actions-row">
              {editId == null ? (
                <button className="resource-action" onClick={handleCreateUser} type="button">
                  Create User
                </button>
              ) : (
                <button className="resource-action" onClick={handleUpdateUser} type="button">
                  Save User
                </button>
              )}
              {editId != null && (
                <button className="resource-action subtle" onClick={resetForm} type="button">
                  Cancel
                </button>
              )}
            </div>
            {feedback && <p className="panel-summary" role="status">{feedback}</p>}
          </aside>

          <section className="resource-panel resource-list">
            <header className="resource-header">
              <div>
                <p className="eyebrow">Directory</p>
                <h2>{currentUser.role === "super_admin" ? "Users across schools" : "School users"}</h2>
              </div>
            </header>

            {isLoading && <p className="panel-summary">Loading users from the backend.</p>}
            {error && <p className="panel-summary error-copy">{error}</p>}
            {data && filteredUsers.length === 0 && (
              <div className="empty-state">
                <strong>No matching users.</strong>
                <span>Try another search term or create a new user.</span>
              </div>
            )}
            {data && filteredUsers.length > 0 && (
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
                    {filteredUsers.map((user) => (
                      <tr key={String(user.id ?? user.full_name ?? Math.random())}>
                        <td>{String(user.id ?? "n/a")}</td>
                        <td>{String(user.full_name ?? user.name ?? "Unnamed User")}</td>
                        <td>{String(user.role ?? "n/a")}</td>
                        <td>{String(user.school_id ?? currentUser.schoolId ?? "global")}</td>
                        <td>
                          {user.id != null && (
                            <button
                              className="resource-action subtle"
                              onClick={() => startEdit(user)}
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
        </div>
      </section>
    </AppShell>
  );
}
