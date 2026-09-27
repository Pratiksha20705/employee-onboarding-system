import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/dateUtils";
import { CheckCircle2 } from "lucide-react";

export default function InductionTable({ activities, onComplete }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Activity</th>
            <th>Scheduled Date</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.id}>
              <td>
                <div className="cell-primary">{a.name}</div>
                <div className="cell-sub">{a.description}</div>
              </td>
              <td>{formatDate(a.scheduledDate)}</td>
              <td>{a.assignedTo}</td>
              <td><StatusBadge status={a.status} /></td>
              <td>
                {a.status !== "Completed" ? (
                  <button className="btn btn-sm btn-success" onClick={() => onComplete(a)}>
                    <CheckCircle2 size={13} /> Mark Complete
                  </button>
                ) : (
                  <span className="text-muted" style={{ fontSize: "var(--fs-xs)" }}>Done</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
