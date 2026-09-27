import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ActionMenu from "./ActionMenu";
import EmptyState from "./EmptyState";
import { formatDate } from "../utils/dateUtils";
import { initialsOf } from "../utils/constants";
import { Users } from "lucide-react";

export default function CandidateTable({ candidates, onDelete, onCreatePortalAccess }) {
  const navigate = useNavigate();

  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No candidates found"
        description="Try adjusting your search or filters, or add a new candidate to get started."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Candidate ID</th>
            <th>Candidate</th>
            <th>Email</th>
            <th>Position</th>
            <th>Department</th>
            <th>Selection Date</th>
            <th>Joining Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id}>
              <td className="cell-sub">{c.id}</td>
              <td>
                <div className="cell-name">
                  <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                    {initialsOf(c.firstName, c.lastName)}
                  </span>
                  <span className="cell-primary">{c.firstName} {c.lastName}</span>
                </div>
              </td>
              <td>{c.email}</td>
              <td>{c.position}</td>
              <td>{c.department}</td>
              <td>{formatDate(c.selectionDate)}</td>
              <td>{formatDate(c.joiningDate)}</td>
              <td><StatusBadge status={c.status} /></td>
              <td>
                <ActionMenu
                  items={[
                    { label: "View", icon: Eye, onClick: () => navigate(`/candidates/${c.id}`) },
                    { label: "Edit", icon: Pencil, onClick: () => {} },
                    c.hasLoginAccount
                      ? { label: "Portal Access Created", icon: ShieldCheck, disabled: true }
                      : {
                          label: "Create Portal Access",
                          icon: KeyRound,
                          onClick: () => onCreatePortalAccess && onCreatePortalAccess(c),
                        },
                    { label: "Delete", icon: Trash2, danger: true, onClick: () => onDelete && onDelete(c) },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
