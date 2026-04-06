import { useState } from "react";

import { AppShell } from "../../app/AppShell";
import { createStudent, deleteStudent, geocodeStudentAddress, listStudents, updateStudent } from "../../core/api";
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

  const { data, isLoading, error } = useResource(
    () => listStudents(currentUser),
    [currentUser.id, reloadKey]
  );

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
        address_text: addressText.trim() || undefined,
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

    try {
      await updateStudent(currentUser, editId, {
        full_name: fullName.trim(),
        grade: grade.trim(),
        address_text: addressText.trim() || undefined,
        school_id: currentUser.role === "super_admin" ? (schoolId.trim() || undefined) : undefined
      });
      setEditId(null);
      setFullName("");
      setGrade("");
      setAddressText("");
      setFeedback("Student updated.");
      setReloadKey((value) => value + 1);
    } catch (updateError) {
      setFeedback(updateError instanceof Error ? updateError.message : "Update failed.");
    }
  }

  async function handleGeocodeStudent(studentId: string, rowAddress?: string) {
    try {
      const result = await geocodeStudentAddress(currentUser, studentId, rowAddress);
      if (result.geocodeStatus === "resolved") {
        setFeedback(`Geocoded ${studentId}: ${result.latitude}, ${result.longitude}`);
      } else {
        setFeedback(`Geocode failed for ${studentId}: ${result.error ?? "unknown error"}`);
      }
      setReloadKey((value) => value + 1);
    } catch (geocodeError) {
      setFeedback(geocodeError instanceof Error ? geocodeError.message : "Geocode failed.");
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
          {editId == null ? (
            <button className="resource-action" onClick={handleCreateStudent} type="button">
              Create Student
            </button>
          ) : (
            <button className="resource-action" onClick={handleUpdateStudent} type="button">
              Save Student
            </button>
          )}
        </div>
        {feedback && <p className="panel-summary">{feedback}</p>}

        {isLoading && <p className="panel-summary">Loading students from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {data && (
          <div className="table-shell">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Address</th>
                  <th>Geocode</th>
                  <th>School</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((student) => (
                  <tr key={String(student.id ?? Math.random())}>
                    <td>{String(student.id ?? "n/a")}</td>
                    <td>{String(student.full_name ?? student.name ?? "Unnamed Student")}</td>
                    <td>{String(student.grade ?? "n/a")}</td>
                    <td>{String(student.address_text ?? student.address ?? "n/a")}</td>
                    <td>
                      {student.lat != null && student.lng != null
                        ? `${student.lat}, ${student.lng}`
                        : String(student.geocode_status ?? "pending")}
                    </td>
                    <td>{String(student.school_id ?? currentUser.schoolId ?? "n/a")}</td>
                    <td>
                      {student.id != null && (
                        <button
                          className="resource-action subtle"
                          onClick={() =>
                            void handleGeocodeStudent(
                              String(student.id),
                              String(student.address_text ?? student.address ?? "")
                            )
                          }
                          type="button"
                        >
                          Geocode
                        </button>
                      )}
                      {student.id != null && (
                        <button
                          className="resource-action subtle"
                          onClick={() => {
                            setEditId(String(student.id));
                            setFullName(String(student.full_name ?? student.name ?? ""));
                            setGrade(String(student.grade ?? ""));
                            setAddressText(String(student.address_text ?? student.address ?? ""));
                            setSchoolId(String(student.school_id ?? currentUser.schoolId ?? ""));
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
    </AppShell>
  );
}
