import { useMemo, useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { data, isLoading, error } = useResource(
    () => listResource(currentUser),
    [currentUser.id, reloadKey]
  );
  const isEditing = editId != null;
  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) =>
      [item.id, ...fields.map((field) => item[field.key])]
        .filter((value) => value != null)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [data?.items, fields, searchQuery]);

  function setField(key: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }));
    setFieldErrors((previous) => ({
      ...previous,
      [key]: ""
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
    setFieldErrors({});
    setFeedback("");
  }

  function validateRequired(payload: Record<string, string>) {
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !payload[field.key]) {
        nextErrors[field.key] = `${field.label} is required.`;
      }
    }

    return nextErrors;
  }

  async function handleCreate() {
    const payload = normalizePayload();
    const validationErrors = validateRequired(payload);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFeedback("Fix the highlighted fields before saving.");
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
    const validationErrors = validateRequired(payload);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFeedback("Fix the highlighted fields before saving.");
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
    if (!window.confirm(`Delete this ${resourceLabel.toLowerCase()} record?`)) {
      return;
    }

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
      <section className="resource-workspace">
        <aside className="resource-panel resource-editor">
          <header className="resource-header">
            <div>
              <p className="eyebrow">{isEditing ? "Edit record" : "Create record"}</p>
              <h2>{resourceLabel}</h2>
              <p className="panel-summary">
                {isEditing
                  ? "Update the selected row without leaving the current list."
                  : "Create a new record with inline validation and immediate feedback."}
              </p>
            </div>
          </header>

          <div className="resource-form resource-form-stacked">
            {fields.map((field) => (
              <label className="resource-field" key={field.key}>
                <span>
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <input
                  className={fieldErrors[field.key] ? "resource-input resource-input-error" : "resource-input"}
                  onChange={(event) => setField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  value={form[field.key] ?? ""}
                />
                {fieldErrors[field.key] && <small className="field-error">{fieldErrors[field.key]}</small>}
              </label>
            ))}
          </div>

          <div className="resource-actions-row">
            {isEditing ? (
              <button className="resource-action" onClick={handleUpdate} type="button">
                Save {resourceLabel}
              </button>
            ) : (
              <button className="resource-action" onClick={handleCreate} type="button">
                Create {resourceLabel}
              </button>
            )}
            {isEditing && (
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
              <p className="eyebrow">Live Data</p>
              <h2>{resourceLabel} list</h2>
            </div>
            <input
              className="resource-input resource-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${resourceLabel.toLowerCase()}`}
              value={searchQuery}
            />
          </header>

          <div className="resource-meta">
            <span>{filteredItems.length} visible</span>
            <span>{data?.items.length ?? 0} total</span>
          </div>

          {isLoading && <p className="panel-summary">Loading {resourceLabel.toLowerCase()} from the backend.</p>}
          {error && <p className="panel-summary error-copy">{error}</p>}
          {data && filteredItems.length === 0 && (
            <div className="empty-state">
              <strong>No matching records.</strong>
              <span>Try a different search or create the first record for this list.</span>
            </div>
          )}
          {data && filteredItems.length > 0 && (
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
                  {filteredItems.map((item) => {
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
                                setFieldErrors({});
                                setFeedback(`Editing ${resourceLabel.toLowerCase()} ${resourceId}.`);
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
      </section>
    </AppShell>
  );
}
