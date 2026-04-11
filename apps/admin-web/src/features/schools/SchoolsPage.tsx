import { useEffect, useMemo, useState } from "react";

import { AppShell } from "../../app/AppShell";
import { createSchool, deleteSchool, listSchools, updateSchool } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

export function SchoolsPage() {
  const currentUser = useRequiredAdminUser();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [editName, setEditName] = useState("");
  const [editTimezone, setEditTimezone] = useState("Asia/Kolkata");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "timezone" | "id">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error } = useResource(
    () => listSchools(currentUser),
    [currentUser.id, reloadKey]
  );

  const filteredSchools = useMemo(() => {
    const items = data?.items ?? [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((school) =>
      [school.id, school.name, school.timezone]
        .filter((value) => value != null)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [data?.items, searchQuery]);

  const sortedSchools = useMemo(() => {
    const items = [...filteredSchools];
    const getName = (school: Record<string, unknown>) => String(school.name ?? "");
    const getTimezone = (school: Record<string, unknown>) => String(school.timezone ?? "");
    const getId = (school: Record<string, unknown>) => String(school.id ?? "");

    items.sort((left, right) => {
      const leftValue = sortBy === "name" ? getName(left) : sortBy === "timezone" ? getTimezone(left) : getId(left);
      const rightValue = sortBy === "name" ? getName(right) : sortBy === "timezone" ? getTimezone(right) : getId(right);

      const comparison = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [filteredSchools, sortBy, sortDirection]);

  function resetEditForm() {
    setEditId(null);
    setEditName("");
    setEditTimezone("Asia/Kolkata");
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

  async function handleCreateSchool() {
    if (!name.trim()) {
      setFeedback("School name is required.");
      return;
    }

    try {
      await createSchool(currentUser, {
        name: name.trim(),
        timezone: timezone.trim() || "Asia/Kolkata"
      });
      setName("");
      setTimezone("Asia/Kolkata");
      setFeedback("School created.");
      setReloadKey((value) => value + 1);
    } catch (createError) {
      setFeedback(createError instanceof Error ? createError.message : "Create failed.");
    }
  }

  async function handleDeleteSchool(schoolId: string) {
    try {
      await deleteSchool(currentUser, schoolId);
      setFeedback("School deleted.");
      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      setFeedback(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  }

  async function handleUpdateSchool() {
    if (!editId) {
      return;
    }

    if (!editName.trim()) {
      setFeedback("School name is required.");
      return;
    }

    try {
      await updateSchool(currentUser, editId, {
        name: editName.trim(),
        timezone: editTimezone.trim() || "Asia/Kolkata"
      });
      setFeedback("School updated.");
      resetEditForm();
      setReloadKey((value) => value + 1);
    } catch (updateError) {
      setFeedback(updateError instanceof Error ? updateError.message : "Update failed.");
    }
  }

  return (
    <AppShell
      title="Schools"
      subtitle="Global school management and rollout visibility for the platform owner."
      activeRoute="schools"
    >
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>All Schools</h2>
          </div>
          <input
            className="resource-input resource-search"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search schools"
            value={searchQuery}
          />
        </header>
        <div className="resource-form">
          <input
            className="resource-input"
            onChange={(event) => setName(event.target.value)}
            placeholder="School name"
            value={name}
          />
          <input
            className="resource-input"
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="Timezone"
            value={timezone}
          />
          <button className="resource-action" onClick={handleCreateSchool} type="button">
            Create School
          </button>
        </div>

        <div className="resource-meta">
          <span>{filteredSchools.length} visible</span>
          <span>{data?.items.length ?? 0} total</span>
        </div>
        {feedback && <p className="panel-summary" role="status">{feedback}</p>}

        {isLoading && <p className="panel-summary">Loading schools from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {data && filteredSchools.length === 0 && (
          <div className="empty-state">
            <strong>No matching schools.</strong>
            <span>Try another search term or create a new school.</span>
          </div>
        )}
        {data && filteredSchools.length > 0 && (
          <div className="table-shell">
            <div className="resource-actions-row" style={{ marginBottom: 12 }}>
              <select className="resource-input" onChange={(event) => setSortBy(event.target.value as "name" | "timezone" | "id")} value={sortBy}>
                <option value="name">Sort: Name</option>
                <option value="timezone">Sort: Timezone</option>
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
                  <th>Name</th>
                  <th>Timezone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSchools.map((school) => (
                  <tr key={String(school.id ?? school.name ?? Math.random())}>
                    <td>{String(school.id ?? "n/a")}</td>
                    <td>{String(school.name ?? "Unnamed School")}</td>
                    <td>{String(school.timezone ?? "n/a")}</td>
                    <td>
                      {school.id != null && (
                        <button
                          className="resource-action subtle"
                          onClick={() => {
                            setEditId(String(school.id));
                            setEditName(String(school.name ?? ""));
                            setEditTimezone(String(school.timezone ?? "Asia/Kolkata"));
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                      )}
                      {school.id != null && (
                        <button
                          className="resource-danger"
                          onClick={() => handleDeleteSchool(String(school.id))}
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
            aria-label="Edit school"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="resource-header">
              <div>
                <p className="eyebrow">Edit School</p>
                <h2>Update School Record</h2>
              </div>
            </header>
            <div className="resource-form">
              <input
                className="resource-input"
                onChange={(event) => setEditName(event.target.value)}
                placeholder="School name"
                value={editName}
              />
              <input
                className="resource-input"
                onChange={(event) => setEditTimezone(event.target.value)}
                placeholder="Timezone"
                value={editTimezone}
              />
            </div>
            <div className="resource-actions-row edit-overlay-actions">
              <button className="resource-action" onClick={handleUpdateSchool} type="button">
                Save School
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
