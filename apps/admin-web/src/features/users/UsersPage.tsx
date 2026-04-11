import { useEffect, useMemo, useState } from "react";

import { AppShell } from "../../app/AppShell";
import { createUser, deleteUser, listUsers, updateUser } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

export function UsersPage() {
  const currentUser = useRequiredAdminUser();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("parent");
  const [schoolId, setSchoolId] = useState(currentUser.schoolId ?? "");
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("parent");
  const [editSchoolId, setEditSchoolId] = useState(currentUser.schoolId ?? "");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nameError, setNameError] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "role" | "school" | "id">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  const sortedUsers = useMemo(() => {
    const items = [...filteredUsers];
    const getName = (user: Record<string, unknown>) => String(user.full_name ?? user.name ?? "");
    const getRole = (user: Record<string, unknown>) => String(user.role ?? "");
    const getSchool = (user: Record<string, unknown>) => String(user.school_id ?? currentUser.schoolId ?? "global");
    const getId = (user: Record<string, unknown>) => String(user.id ?? "");

    items.sort((left, right) => {
      const leftValue =
        sortBy === "name"
          ? getName(left)
          : sortBy === "role"
            ? getRole(left)
            : sortBy === "school"
              ? getSchool(left)
              : getId(left);
      const rightValue =
        sortBy === "name"
          ? getName(right)
          : sortBy === "role"
            ? getRole(right)
            : sortBy === "school"
              ? getSchool(right)
              : getId(right);

      const comparison = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [currentUser.schoolId, filteredUsers, sortBy, sortDirection]);

  function resetCreateForm() {
    setFullName("");
    setRole("parent");
    setSchoolId(currentUser.schoolId ?? "");
    setNameError("");
  }

  function resetEditForm() {
    setEditId(null);
    setEditFullName("");
    setEditRole("parent");
    setEditSchoolId(currentUser.schoolId ?? "");
    setEditNameError("");
  }

  function startEdit(user: Record<string, unknown>) {
    setEditId(String(user.id));
    setEditFullName(String(user.full_name ?? user.name ?? ""));
    setEditRole(String(user.role ?? "parent"));
    setEditSchoolId(String(user.school_id ?? currentUser.schoolId ?? ""));
    setEditNameError("");
    setFeedback(`Editing user ${String(user.id)}.`);
  }

  useEffect(() => {
    if (!editId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        resetEditForm();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editId]);

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
        is_active: true
      });
      resetCreateForm();
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

    if (!editFullName.trim()) {
      setEditNameError("User name is required.");
      setFeedback("Fix the highlighted field before saving.");
      return;
    }

    try {
      await updateUser(currentUser, editId, {
        full_name: editFullName.trim(),
        role: editRole,
        school_id: currentUser.role === "super_admin" ? (editSchoolId.trim() || undefined) : undefined,
        is_active: true
      });
      resetEditForm();
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
      <section className="resource-panel">
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

        <div className="resource-form">
          <input
            className={nameError ? "resource-input resource-input-error" : "resource-input"}
            onChange={(event) => {
              setFullName(event.target.value);
              setNameError("");
            }}
            placeholder="Full name"
            value={fullName}
          />
          <select className="resource-input" onChange={(event) => setRole(event.target.value)} value={role}>
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
          <button className="resource-action" onClick={handleCreateUser} type="button">
            Create User
          </button>
        </div>
        {nameError && <p className="field-error">{nameError}</p>}

        <div className="resource-meta">
          <span>{filteredUsers.length} visible</span>
          <span>{data?.items.length ?? 0} total</span>
        </div>
        {feedback && <p className="panel-summary" role="status">{feedback}</p>}

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
            <div className="resource-actions-row" style={{ marginBottom: 12 }}>
              <select className="resource-input" onChange={(event) => setSortBy(event.target.value as "name" | "role" | "school" | "id")} value={sortBy}>
                <option value="name">Sort: Name</option>
                <option value="role">Sort: Role</option>
                <option value="school">Sort: School</option>
                <option value="id">Sort: ID</option>
              </select>
              <select className="resource-input" onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")} value={sortDirection}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <table className="resource-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>School ID</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={String(user.id ?? user.full_name ?? Math.random())}>
                    <td>{String(user.id ?? "n/a")}</td>
                    <td>{String(user.full_name ?? user.name ?? "Unnamed User")}</td>
                    <td>{String(user.role ?? "n/a")}</td>
                    <td>{String(user.school_id ?? currentUser.schoolId ?? "global")}</td>
                    <td>{user.is_active === false ? "No" : "Yes"}</td>
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

      {editId && (
        <div className="edit-overlay-backdrop" onClick={resetEditForm} aria-hidden="true">
          <section
            className="resource-panel edit-overlay-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Edit user"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="resource-header">
              <div>
                <p className="eyebrow">Edit User</p>
                <h2>Update User Record</h2>
              </div>
            </header>
            <div className="resource-form">
              <input
                className={editNameError ? "resource-input resource-input-error" : "resource-input"}
                onChange={(event) => {
                  setEditFullName(event.target.value);
                  setEditNameError("");
                }}
                placeholder="Full name"
                value={editFullName}
              />
              <select className="resource-input" onChange={(event) => setEditRole(event.target.value)} value={editRole}>
                <option value="parent">parent</option>
                <option value="driver">driver</option>
                <option value="admin">admin</option>
              </select>
              {currentUser.role === "super_admin" && (
                <input
                  className="resource-input"
                  onChange={(event) => setEditSchoolId(event.target.value)}
                  placeholder="School ID"
                  value={editSchoolId}
                />
              )}
            </div>
            {editNameError && <p className="field-error">{editNameError}</p>}
            <div className="resource-actions-row edit-overlay-actions">
              <button className="resource-action" onClick={handleUpdateUser} type="button">
                Save User
              </button>
              <button className="resource-action subtle" onClick={resetEditForm} type="button">
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

    </AppShell>
  );
}
