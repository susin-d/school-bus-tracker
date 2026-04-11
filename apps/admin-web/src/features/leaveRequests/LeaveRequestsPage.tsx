import { useMemo, useState } from "react";

import { AppShell } from "../../app/AppShell";
import { listLeaveRequests, updateLeaveRequestStatus } from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

export function LeaveRequestsPage() {
  const currentUser = useRequiredAdminUser();
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sortBy, setSortBy] = useState<"date" | "status" | "tripKind">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { data, isLoading, error } = useResource(
    () => listLeaveRequests(currentUser),
    [currentUser.id, reloadKey]
  );

  const filteredRequests = useMemo(
    () =>
      (data?.requests ?? []).filter((requestItem) =>
        statusFilter === "all" ? true : requestItem.status === statusFilter
      ),
    [data?.requests, statusFilter]
  );

  const sortedRequests = useMemo(() => {
    const items = [...filteredRequests];
    items.sort((left, right) => {
      const leftValue =
        sortBy === "status" ? left.status : sortBy === "tripKind" ? left.tripKind : left.leaveDate;
      const rightValue =
        sortBy === "status" ? right.status : sortBy === "tripKind" ? right.tripKind : right.leaveDate;
      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: "base"
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return items;
  }, [filteredRequests, sortBy, sortDirection]);

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
      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <p className="eyebrow">Live Data</p>
            <h2>Leave Requests</h2>
          </div>
          <div className="resource-actions-row">
            <select className="resource-input" onChange={(event) => setStatusFilter(event.target.value as "all" | "pending" | "approved" | "rejected")} value={statusFilter}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className="resource-input" onChange={(event) => setSortBy(event.target.value as "date" | "status" | "tripKind")} value={sortBy}>
              <option value="date">Sort: Leave Date</option>
              <option value="status">Sort: Status</option>
              <option value="tripKind">Sort: Trip Kind</option>
            </select>
            <select className="resource-input" onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")} value={sortDirection}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </header>

        {isLoading && <p className="panel-summary">Loading leave requests from the backend.</p>}
        {error && <p className="panel-summary error-copy">{error}</p>}
        {feedback && <p className="panel-summary">{feedback}</p>}
        {data && sortedRequests.length > 0 && (
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
                {sortedRequests.map((requestItem) => (
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
        {data && sortedRequests.length === 0 && (
          <div className="empty-state">
            <strong>No leave requests match the current filters.</strong>
            <span>Try a different status filter.</span>
          </div>
        )}
      </section>
    </AppShell>
  );
}
