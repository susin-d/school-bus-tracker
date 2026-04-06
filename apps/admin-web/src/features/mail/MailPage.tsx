import { useMemo, useState } from "react";

import { AppShell } from "../../app/AppShell";
import { listStudents, sendAdminMail } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

type MailMode = "all_students" | "selected_students" | "emails";

export function MailPage() {
  const currentUser = useRequiredAdminUser();
  const [mode, setMode] = useState<MailMode>("all_students");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emailList, setEmailList] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [schoolIdInput, setSchoolIdInput] = useState(currentUser.schoolId ?? "");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isSuperAdmin = currentUser.role === "super_admin";
  const resolvedSchoolId = isSuperAdmin ? schoolIdInput.trim() : currentUser.schoolId;
  const shouldLoadStudents = mode === "selected_students";

  const { data, isLoading, error } = useResource(
    () => shouldLoadStudents ? listStudents(currentUser, resolvedSchoolId || undefined) : Promise.resolve({ items: [] }),
    [currentUser.id, shouldLoadStudents, resolvedSchoolId]
  );

  const students = useMemo(
    () =>
      (data?.items ?? []).map((row) => ({
        id: String(row.id ?? ""),
        fullName: String(row.full_name ?? row.name ?? "Student"),
        schoolId: String(row.school_id ?? "")
      })),
    [data]
  );

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  }

  async function handleSend() {
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanSubject || !cleanMessage) {
      setFeedback("Subject and message are required.");
      return;
    }

    if (mode === "selected_students" && selectedStudentIds.length === 0) {
      setFeedback("Select at least one student.");
      return;
    }

    if (mode === "emails" && !isSuperAdmin) {
      setFeedback("Only super admin can send to arbitrary email addresses.");
      return;
    }

    const emails =
      mode === "emails"
        ? emailList
            .split(/[\n,;]+/)
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        : undefined;

    if (mode === "emails" && (!emails || emails.length === 0)) {
      setFeedback("Enter at least one recipient email.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await sendAdminMail(currentUser, {
        mode,
        schoolId: isSuperAdmin ? resolvedSchoolId || undefined : undefined,
        studentIds: mode === "selected_students" ? selectedStudentIds : undefined,
        emails,
        subject: cleanSubject,
        message: cleanMessage
      });

      setFeedback(`Email sent successfully to ${response.recipientCount} recipient(s).`);
      setMessage("");
      if (mode === "selected_students") {
        setSelectedStudentIds([]);
      }
      if (mode === "emails") {
        setEmailList("");
      }
    } catch (sendError) {
      setFeedback(sendError instanceof Error ? sendError.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Broadcast Mail"
      subtitle={
        isSuperAdmin
          ? "Send operational emails across schools, students, and external recipients."
          : "Send operational emails to guardians of all students or selected students in your school."
      }
      activeRoute="mail"
    >
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Communication</p>
            <h2>Send Email</h2>
          </div>
        </header>

        <div className="resource-form one-column">
          <label className="role-select-label" htmlFor="mail-mode">Target Mode</label>
          <select
            id="mail-mode"
            className="resource-input"
            value={mode}
            onChange={(event) => {
              const nextMode = event.target.value as MailMode;
              setMode(nextMode);
              setFeedback("");
            }}
          >
            <option value="all_students">All Students (via guardians)</option>
            <option value="selected_students">Selected Students (via guardians)</option>
            {isSuperAdmin && <option value="emails">Any Email Addresses</option>}
          </select>

          {isSuperAdmin && mode !== "emails" && (
            <input
              className="resource-input"
              onChange={(event) => setSchoolIdInput(event.target.value)}
              placeholder="Optional school ID (blank = all schools)"
              value={schoolIdInput}
            />
          )}

          {mode === "emails" && (
            <textarea
              className="resource-input"
              onChange={(event) => setEmailList(event.target.value)}
              placeholder="Enter emails separated by comma, semicolon, or new line"
              rows={5}
              value={emailList}
            />
          )}

          <input
            className="resource-input"
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            value={subject}
          />
          <textarea
            className="resource-input"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message"
            rows={8}
            value={message}
          />

          <button className="resource-action" disabled={busy} onClick={() => void handleSend()} type="button">
            {busy ? "Sending..." : "Send Email"}
          </button>
        </div>

        {feedback && <p className="panel-summary">{feedback}</p>}
      </section>

      {mode === "selected_students" && (
        <section className="resource-panel" style={{ marginTop: 20 }}>
          <header className="resource-header">
            <div>
              <p className="eyebrow">Recipients</p>
              <h2>Select Students</h2>
            </div>
          </header>
          {isLoading && <p className="panel-summary">Loading students…</p>}
          {error && <p className="panel-summary error-copy">{error}</p>}
          {!isLoading && !error && (
            <div className="table-shell">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Student</th>
                    <th>School</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <input
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          type="checkbox"
                        />
                      </td>
                      <td>{student.fullName}</td>
                      <td>{student.schoolId || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
