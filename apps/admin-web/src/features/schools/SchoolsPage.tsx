import { useState } from "react";

import { AppShell } from "../../app/AppShell";
import { createSchool, deleteSchool, listSchools, updateSchool } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";
import { SchoolsOverview } from "./SchoolsOverview";

export function SchoolsPage() {
  const currentUser = useRequiredAdminUser();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading, error } = useResource(
    () => listSchools(currentUser),
    [currentUser.id, reloadKey]
  );

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

    try {
      await updateSchool(currentUser, editId, {
        name: name.trim(),
        timezone: timezone.trim() || "Asia/Kolkata"
      });
      setFeedback("School updated.");
      setEditId(null);
      setName("");
      setTimezone("Asia/Kolkata");
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
      <section className="panel-grid compact" style={{ marginTop: 20 }}>
        <SchoolsOverview view={currentUser.role === "super_admin" ? "super_admin" : "school_admin"} />
      </section>
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>All Schools</h2>
          </div>
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
          {editId == null ? (
            <button className="resource-action" onClick={handleCreateSchool} type="button">
              Create School
            </button>
          ) : (
            <button className="resource-action" onClick={handleUpdateSchool} type="button">
              Save School
            </button>
          )}
        </div>
        {feedback && <p className="panel-summary">{feedback}</p>}

        {isLoading && <p className="panel-summary">Loading schools from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {data && (
          <div className="table-shell">
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
                {data.items.map((school) => (
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
                            setName(String(school.name ?? ""));
                            setTimezone(String(school.timezone ?? "Asia/Kolkata"));
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
    </AppShell>
  );
}
