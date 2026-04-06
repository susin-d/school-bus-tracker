import { useState } from "react";

import { AppShell } from "../../app/AppShell";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";
import type { AdminRouteKey } from "../../core/roleAccess";

type ResourceCrudPageProps = {
  title: string;
  subtitle: string;
  activeRoute: AdminRouteKey;
  resourceLabel: string;
  listResource: (currentUser: ReturnType<typeof useRequiredAdminUser>) => Promise<{ items: Record<string, unknown>[] }>;
  createResource: (currentUser: ReturnType<typeof useRequiredAdminUser>, payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  updateResource: (
    currentUser: ReturnType<typeof useRequiredAdminUser>,
    resourceId: string,
    payload: Record<string, unknown>
  ) => Promise<Record<string, unknown>>;
  deleteResource: (currentUser: ReturnType<typeof useRequiredAdminUser>, resourceId: string) => Promise<void>;
  createTemplate: Record<string, string>;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    required?: boolean;
  }>;
};

export function ResourceCrudPage({
  title,
  subtitle,
  activeRoute,
  resourceLabel,
  listResource,
  createResource,
  updateResource,
  deleteResource,
  createTemplate,
  fields
}: ResourceCrudPageProps) {
  const currentUser = useRequiredAdminUser();
  const [reloadKey, setReloadKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(createTemplate);
  const { data, isLoading, error } = useResource(
    () => listResource(currentUser),
    [currentUser.id, reloadKey]
  );

  function setField(key: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }));
  }

  function normalizePayload() {
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(form)) {
      const trimmed = value.trim();
      if (trimmed) {
        payload[key] = trimmed;
      }
    }
    return payload;
  }

  function resetForm() {
    setForm(createTemplate);
    setEditId(null);
  }

  function validateRequired(payload: Record<string, string>) {
    for (const field of fields) {
      if (field.required && !payload[field.key]) {
        return `${field.label} is required.`;
      }
    }
    return "";
  }

  async function handleCreate() {
    const payload = normalizePayload();
    const validationError = validateRequired(payload);
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    try {
      await createResource(currentUser, payload);
      setFeedback(`${resourceLabel} created.`);
      resetForm();
      setReloadKey((value) => value + 1);
    } catch (createError) {
      setFeedback(createError instanceof Error ? createError.message : "Create failed.");
    }
  }

  async function handleUpdate() {
    if (!editId) {
      return;
    }
    const payload = normalizePayload();
    const validationError = validateRequired(payload);
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    try {
      await updateResource(currentUser, editId, payload);
      setFeedback(`${resourceLabel} updated.`);
      resetForm();
      setReloadKey((value) => value + 1);
    } catch (updateError) {
      setFeedback(updateError instanceof Error ? updateError.message : "Update failed.");
    }
  }

  async function handleDelete(resourceId: string) {
    try {
      await deleteResource(currentUser, resourceId);
      setFeedback(`${resourceLabel} deleted.`);
      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      setFeedback(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  }

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      activeRoute={activeRoute}
    >
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>{resourceLabel}</h2>
          </div>
        </header>

        <div className="resource-form">
          {fields.map((field) => (
            <input
              className="resource-input"
              key={field.key}
              onChange={(event) => setField(field.key, event.target.value)}
              placeholder={field.placeholder}
              value={form[field.key] ?? ""}
            />
          ))}
          {editId == null ? (
            <button className="resource-action" onClick={handleCreate} type="button">
              Create
            </button>
          ) : (
            <button className="resource-action" onClick={handleUpdate} type="button">
              Save
            </button>
          )}
          {editId != null && (
            <button className="resource-action subtle" onClick={resetForm} type="button">
              Cancel
            </button>
          )}
        </div>

        {feedback && <p className="panel-summary">{feedback}</p>}
        {isLoading && <p className="panel-summary">Loading {resourceLabel.toLowerCase()} from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {data && (
          <div className="table-shell">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {fields.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const resourceId = item.id != null ? String(item.id) : "";
                  return (
                    <tr key={resourceId || JSON.stringify(item)}>
                      <td>{resourceId || "n/a"}</td>
                      {fields.map((field) => (
                        <td key={field.key}>{String(item[field.key] ?? "n/a")}</td>
                      ))}
                      <td>
                        {resourceId && (
                          <button
                            className="resource-action subtle"
                            onClick={() => {
                              const nextForm: Record<string, string> = {};
                              for (const config of fields) {
                                nextForm[config.key] = String(item[config.key] ?? "");
                              }
                              setForm(nextForm);
                              setEditId(resourceId);
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                        )}
                        {resourceId && (
                          <button
                            className="resource-danger"
                            onClick={() => handleDelete(resourceId)}
                            type="button"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
