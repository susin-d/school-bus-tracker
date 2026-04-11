import { useEffect, useMemo, useState } from "react";

import { AppShell } from "../../app/AppShell";
import { createStudent, deleteStudent, listStudents, updateStudent } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

export function StudentsPage() {
  const currentUser = useRequiredAdminUser();
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [addressText, setAddressText] = useState("");
  const [schoolId, setSchoolId] = useState(currentUser.schoolId ?? "");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editAddressText, setEditAddressText] = useState("");
  const [editSchoolId, setEditSchoolId] = useState(currentUser.schoolId ?? "");
  const [sortBy, setSortBy] = useState<"name" | "grade" | "school" | "id">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error } = useResource(
    () => listStudents(currentUser),
    [currentUser.id, reloadKey]
  );
  const sortedStudents = useMemo(() => {
    const items = [...(data?.items ?? [])];
    const getName = (student: Record<string, unknown>) => String(student.full_name ?? student.name ?? "");
    const getGrade = (student: Record<string, unknown>) => String(student.grade ?? "");
    const getSchool = (student: Record<string, unknown>) => String(student.school_id ?? "");
    const getId = (student: Record<string, unknown>) => String(student.id ?? "");

    items.sort((left, right) => {
      const leftValue =
        sortBy === "name"
          ? getName(left)
          : sortBy === "grade"
            ? getGrade(left)
            : sortBy === "school"
              ? getSchool(left)
              : getId(left);
      const rightValue =
        sortBy === "name"
          ? getName(right)
          : sortBy === "grade"
            ? getGrade(right)
            : sortBy === "school"
              ? getSchool(right)
              : getId(right);

      const comparison = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [data?.items, sortBy, sortDirection]);

  function resetEditForm() {
    setEditId(null);
    setEditFullName("");
    setEditGrade("");
    setEditAddressText("");
    setEditSchoolId(currentUser.schoolId ?? "");
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

  async function handleCreateStudent() {
    if (!fullName.trim()) {
      setFeedback("Student name is required.");
      return;
    }
    if (!grade.trim()) {
      setFeedback("Grade is required.");
      return;
    }

    try {
      await createStudent(currentUser, {
        full_name: fullName.trim(),
        grade: grade.trim(),
        home_address: addressText.trim() || undefined,
        school_id: currentUser.role === "super_admin" ? (schoolId.trim() || undefined) : currentUser.schoolId
      });
      setFullName("");
      setGrade("");
      setAddressText("");
      setFeedback("Student created.");
      setReloadKey((value) => value + 1);
    } catch (createError) {
      setFeedback(createError instanceof Error ? createError.message : "Create failed.");
    }
  }

  async function handleDeleteStudent(studentId: string) {
    try {
      await deleteStudent(currentUser, studentId);
      setFeedback("Student deleted.");
      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      setFeedback(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  }

  async function handleUpdateStudent() {
    if (!editId) {
      return;
    }

    if (!editFullName.trim()) {
      setFeedback("Student name is required.");
      return;
    }

    if (!editGrade.trim()) {
      setFeedback("Grade is required.");
      return;
    }

    try {
      await updateStudent(currentUser, editId, {
        full_name: editFullName.trim(),
        grade: editGrade.trim(),
        home_address: editAddressText.trim() || undefined,
        school_id: currentUser.role === "super_admin" ? (editSchoolId.trim() || undefined) : undefined
      });
      resetEditForm();
      setFeedback("Student updated.");
      setReloadKey((value) => value + 1);
    } catch (updateError) {
      setFeedback(updateError instanceof Error ? updateError.message : "Update failed.");
    }
  }

  return (
    <AppShell
      title="Students"
      subtitle={
        currentUser.role === "super_admin"
          ? "Cross-school student visibility and transport readiness."
          : "School-scoped student management and assignment visibility."
      }
      activeRoute="students"
    >
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>{currentUser.role === "super_admin" ? "Students Across Schools" : "School Students"}</h2>
          </div>
        </header>
        <div className="resource-form">
          <input
            className="resource-input"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Student name"
            value={fullName}
          />
          <input
            className="resource-input"
            onChange={(event) => setGrade(event.target.value)}
            placeholder="Grade"
            value={grade}
          />
          <input
            className="resource-input"
            onChange={(event) => setAddressText(event.target.value)}
            placeholder="Address"
            value={addressText}
          />
          {currentUser.role === "super_admin" && (
            <input
              className="resource-input"
              onChange={(event) => setSchoolId(event.target.value)}
              placeholder="School ID"
              value={schoolId}
            />
          )}
          <button className="resource-action" onClick={handleCreateStudent} type="button">
            Create Student
          </button>
        </div>
        {feedback && <p className="panel-summary">{feedback}</p>}

        {isLoading && <p className="panel-summary">Loading students from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {data && (
          <div className="table-shell">
            <div className="resource-actions-row" style={{ marginBottom: 12 }}>
              <select className="resource-input" onChange={(event) => setSortBy(event.target.value as "name" | "grade" | "school" | "id")} value={sortBy}>
                <option value="name">Sort: Name</option>
                <option value="grade">Sort: Grade</option>
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
                  <th>Grade</th>
                  <th>Home Address</th>
                  <th>Location</th>
                  <th>School ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student) => (
                  <tr key={String(student.id ?? Math.random())}>
                    <td>{String(student.id ?? "n/a")}</td>
                    <td>{String(student.full_name ?? student.name ?? "Unnamed Student")}</td>
                    <td>{String(student.grade ?? "n/a")}</td>
                    <td>{String(student.home_address ?? student.address_text ?? student.address ?? "n/a")}</td>
                    <td>
                      {student.latitude != null && student.longitude != null
                        ? `${student.latitude}, ${student.longitude}`
                        : student.lat != null && student.lng != null
                          ? `${student.lat}, ${student.lng}`
                        : String(student.geocode_status ?? "pending")}
                    </td>
                    <td>{String(student.school_id ?? currentUser.schoolId ?? "n/a")}</td>
                    <td>
                      {student.id != null && (
                        <button
                          className="resource-action subtle"
                          onClick={() => {
                            setEditId(String(student.id));
                            setEditFullName(String(student.full_name ?? student.name ?? ""));
                            setEditGrade(String(student.grade ?? ""));
                            setEditAddressText(String(student.home_address ?? student.address_text ?? student.address ?? ""));
                            setEditSchoolId(String(student.school_id ?? currentUser.schoolId ?? ""));
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                      )}
                      {student.id != null && (
                        <button
                          className="resource-danger"
                          onClick={() => handleDeleteStudent(String(student.id))}
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
            aria-label="Edit student"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="resource-header">
              <div>
                <p className="eyebrow">Edit Student</p>
                <h2>Update Student Record</h2>
              </div>
            </header>
            <div className="resource-form">
              <input
                className="resource-input"
                onChange={(event) => setEditFullName(event.target.value)}
                placeholder="Student name"
                value={editFullName}
              />
              <input
                className="resource-input"
                onChange={(event) => setEditGrade(event.target.value)}
                placeholder="Grade"
                value={editGrade}
              />
              <input
                className="resource-input"
                onChange={(event) => setEditAddressText(event.target.value)}
                placeholder="Address"
                value={editAddressText}
              />
              {currentUser.role === "super_admin" && (
                <input
                  className="resource-input"
                  onChange={(event) => setEditSchoolId(event.target.value)}
                  placeholder="School ID"
                  value={editSchoolId}
                />
              )}
            </div>
            <div className="resource-actions-row edit-overlay-actions">
              <button className="resource-action" onClick={handleUpdateStudent} type="button">
                Save Student
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
