import { useEffect, useMemo, useState, type FormEvent } from "react";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<Record<string, string>>(createTemplate);
  const [editForm, setEditForm] = useState<Record<string, string>>(createTemplate);
  const [searchQuery, setSearchQuery] = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { data, isLoading, error } = useResource(
    () => listResource(currentUser),
    [currentUser.id, reloadKey]
  );

  const sortFieldOptions = useMemo(
    () => [{ value: "id", label: "ID" }, ...fields.map((field) => ({ value: field.key, label: field.label }))],
    [fields]
  );

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

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    items.sort((left, right) => {
      const leftValue = sortBy === "id" ? left.id : left[sortBy];
      const rightValue = sortBy === "id" ? right.id : right[sortBy];
      const comparison = String(leftValue ?? "").localeCompare(String(rightValue ?? ""), undefined, {
        numeric: true,
        sensitivity: "base"
      });

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [filteredItems, sortBy, sortDirection]);

  function setCreateField(key: string, value: string) {
    setCreateForm((previous) => ({
      ...previous,
      [key]: value
    }));
    setCreateFieldErrors((previous) => ({
      ...previous,
      [key]: ""
    }));
  }

  function setEditField(key: string, value: string) {
    setEditForm((previous) => ({
      ...previous,
      [key]: value
    }));
    setEditFieldErrors((previous) => ({
      ...previous,
      [key]: ""
    }));
  }

  function normalizePayload(form: Record<string, string>) {
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      const trimmed = value.trim();
      if (trimmed) {
        if (key === "is_active") {
          const normalized = trimmed.toLowerCase();
          if (["true", "1", "yes", "active"].includes(normalized)) {
            payload[key] = true;
            continue;
          }
          if (["false", "0", "no", "inactive"].includes(normalized)) {
            payload[key] = false;
            continue;
          }
        }

        payload[key] = trimmed;
      }
    }
    return payload;
  }

  function resetCreateForm() {
    setCreateForm(createTemplate);
    setCreateFieldErrors({});
    setIsCreateOpen(false);
  }

  function resetEditForm() {
    setEditId(null);
    setEditForm(createTemplate);
    setEditFieldErrors({});
  }

  function validateRequired(payload: Record<string, unknown>) {
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = payload[field.key];
      if (field.required && (value == null || value === "")) {
        nextErrors[field.key] = `${field.label} is required.`;
      }
    }

    return nextErrors;
  }

  useEffect(() => {
    if (!editId && !isCreateOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editId) {
          resetEditForm();
        }
        if (isCreateOpen) {
          setIsCreateOpen(false);
          setCreateFieldErrors({});
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editId, isCreateOpen]);

  async function handleCreate(event?: FormEvent) {
    event?.preventDefault();
    const payload = normalizePayload(createForm);
    const validationErrors = validateRequired(payload);
    if (Object.keys(validationErrors).length > 0) {
      setCreateFieldErrors(validationErrors);
      setFeedback("Fix the highlighted fields before saving.");
      return;
    }

    try {
      await createResource(currentUser, payload);
      setFeedback(`${resourceLabel} created.`);
      resetCreateForm();
      setReloadKey((value) => value + 1);
    } catch (createError) {
      setFeedback(createError instanceof Error ? createError.message : "Create failed.");
    }
  }

  async function handleUpdate(event?: FormEvent) {
    event?.preventDefault();
    if (!editId) {
      return;
    }
    const payload = normalizePayload(editForm);
    const validationErrors = validateRequired(payload);
    if (Object.keys(validationErrors).length > 0) {
      setEditFieldErrors(validationErrors);
      setFeedback("Fix the highlighted fields before saving.");
      return;
    }

    try {
      await updateResource(currentUser, editId, payload);
      setFeedback(`${resourceLabel} updated.`);
      resetEditForm();
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
      <section className="resource-panel">
        <section className="resource-list">
          <header className="resource-header">
            <div className="flex flex-col gap-1">
              <p className="eyebrow">Live Data</p>
              <h2 className="text-xl font-extrabold">{resourceLabel} list</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                className="resource-input resource-search"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Search ${resourceLabel.toLowerCase()}...`}
                style={{ maxWidth: 280 }}
                value={searchQuery}
              />
              <button 
                className="resource-action" 
                onClick={() => {
                  setIsCreateOpen(true);
                  setFeedback(`Creating a new ${resourceLabel.toLowerCase()} record.`);
                }}
                type="button"
              >
                Create {resourceLabel}
              </button>
            </div>
          </header>

          {feedback && (
            <div className="px-4 py-2 mb-4 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-sm font-semibold flex items-center justify-between">
              <span>{feedback}</span>
              <button onClick={() => setFeedback("")} className="hover:opacity-70">✕</button>
            </div>
          )}

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
              <div className="resource-actions-row" style={{ marginBottom: 12 }}>
                <select className="resource-input" onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
                  {sortFieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>Sort: {option.label}</option>
                  ))}
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
                    {fields.filter(f => f.key !== "password").map((field) => (
                      <th key={field.key}>{field.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => {
                    const resourceId = item.id != null ? String(item.id) : "";
                    return (
                      <tr key={resourceId || JSON.stringify(item)}>
                        <td>{resourceId || "n/a"}</td>
                        {fields.filter(f => f.key !== "password").map((field) => (
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
                                setEditForm(nextForm);
                                setEditId(resourceId);
                                setEditFieldErrors({});
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

      {editId && (
        <div className="edit-overlay-backdrop" onClick={resetEditForm} aria-hidden="true">
          <section
            className="resource-panel edit-overlay-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${resourceLabel}`}
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={(event) => void handleUpdate(event)}>
              <header className="resource-header">
                <div>
                  <p className="eyebrow">Edit record</p>
                  <h2>{resourceLabel}</h2>
                </div>
              </header>
              <div className="resource-form">
                {fields.map((field) => (
                  field.key === "is_active" ? (
                    <select
                      key={field.key}
                      className={editFieldErrors[field.key] ? "resource-input resource-input-error" : "resource-input"}
                      onChange={(event) => setEditField(field.key, event.target.value)}
                      value={editForm[field.key] ?? "true"}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <input
                      key={field.key}
                      type={field.key === "password" ? "password" : "text"}
                      className={editFieldErrors[field.key] ? "resource-input resource-input-error" : "resource-input"}
                      onChange={(event) => setEditField(field.key, event.target.value)}
                      placeholder={`${field.label}${field.required ? " *" : ""}`}
                      value={editForm[field.key] ?? ""}
                    />
                  )
                ))}
              </div>
              {Object.values(editFieldErrors).filter(Boolean).length > 0 && (
                <p className="field-error">Fix required fields before saving.</p>
              )}
              <div className="resource-actions-row edit-overlay-actions">
                <button className="resource-action" type="submit">
                  Save {resourceLabel}
                </button>
                <button className="resource-action subtle" onClick={resetEditForm} type="button">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isCreateOpen && (
        <div
          className="edit-overlay-backdrop"
          onClick={() => {
            setIsCreateOpen(false);
            setCreateFieldErrors({});
          }}
          aria-hidden="true"
        >
          <section
            className="resource-panel edit-overlay-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Create ${resourceLabel}`}
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={(event) => void handleCreate(event)}>
              <header className="resource-header">
                <div>
                  <p className="eyebrow">Create record</p>
                  <h2>{resourceLabel}</h2>
                </div>
              </header>
              <div className="resource-form">
                {fields.map((field) => (
                  field.key === "is_active" ? (
                    <select
                      key={field.key}
                      className={createFieldErrors[field.key] ? "resource-input resource-input-error" : "resource-input"}
                      onChange={(event) => setCreateField(field.key, event.target.value)}
                      value={createForm[field.key] ?? "true"}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <input
                      key={field.key}
                      type={field.key === "password" ? "password" : "text"}
                      className={createFieldErrors[field.key] ? "resource-input resource-input-error" : "resource-input"}
                      onChange={(event) => setCreateField(field.key, event.target.value)}
                      placeholder={`${field.label}${field.required ? " *" : ""}`}
                      value={createForm[field.key] ?? ""}
                    />
                  )
                ))}
              </div>
              {Object.values(createFieldErrors).filter(Boolean).length > 0 && (
                <p className="field-error">Fix required fields before saving.</p>
              )}
              <div className="resource-actions-row edit-overlay-actions">
                <button className="resource-action" type="submit">
                  Save {resourceLabel}
                </button>
                <button
                  className="resource-action subtle"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreateFieldErrors({});
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
