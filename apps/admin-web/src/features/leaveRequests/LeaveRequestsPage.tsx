import { useState } from "react";

import { AppShell } from "../../app/AppShell";
import { listLeaveRequests, updateLeaveRequestStatus } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";
import { LeaveRequestsOverview } from "./LeaveRequestsOverview";

export function LeaveRequestsPage() {
  const currentUser = useRequiredAdminUser();
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { data, isLoading, error } = useResource(
    () => listLeaveRequests(currentUser),
    [currentUser.id, reloadKey]
  );

  async function handleStatusChange(leaveRequestId: string, status: "approved" | "rejected") {
    try {
      await updateLeaveRequestStatus(currentUser, leaveRequestId, status);
      setFeedback(`Leave request ${status}.`);
      setReloadKey((value) => value + 1);
    } catch (actionError) {
      setFeedback(actionError instanceof Error ? actionError.message : "Status update failed.");
    }
  }

  return (
    <AppShell
      title="Leave Requests"
      subtitle={
        currentUser.role === "super_admin"
          ? "Cross-school leave analytics and policy review."
          : "School-scoped leave review and approvals."
      }
      activeRoute="leaveRequests"
    >
      <section className="panel-grid compact" style={{ marginTop: 20 }}>
        <LeaveRequestsOverview view={currentUser.role === "super_admin" ? "super_admin" : "school_admin"} />
      </section>
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>Leave Requests</h2>
          </div>
        </header>

        {isLoading && <p className="panel-summary">Loading leave requests from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {feedback && <p className="panel-summary">{feedback}</p>}
        {data && (
          <div className="table-shell">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Student ID</th>
                  <th>Trip Kind</th>
                  <th>Status</th>
                  <th>Leave Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((requestItem) => (
                  <tr key={requestItem.id}>
                    <td>{requestItem.id}</td>
                    <td>{requestItem.studentId}</td>
                    <td>{requestItem.tripKind}</td>
                    <td>{requestItem.status}</td>
                    <td>{requestItem.leaveDate}</td>
                    <td>
                      {requestItem.status === "pending" && (
                        <>
                          <button
                            className="resource-action subtle"
                            onClick={() => handleStatusChange(requestItem.id, "approved")}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="resource-danger"
                            onClick={() => handleStatusChange(requestItem.id, "rejected")}
                            type="button"
                          >
                            Reject
                          </button>
                        </>
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
