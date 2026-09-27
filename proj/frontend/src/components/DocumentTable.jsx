import { Fragment } from "react";
import { Eye, Check, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/dateUtils";

export default function DocumentTable({ documents, onVerify, onReject, onView }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Submitted Date</th>
            <th>Status</th>
            <th>Verified By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            // doc.id is null for a not-yet-uploaded (Pending) document, and
            // there can be several Pending rows at once - keying on doc.id
            // alone would give them all the same key ("null") and let React
            // mix up/reuse their rows across re-renders. doc.type is always
            // present and unique per required document, so it's the part of
            // the key that's guaranteed unique; doc.id (when present)
            // additionally keys the row on upload/verify/reject id changes.
            <Fragment key={doc.id ? `${doc.type}-${doc.id}` : doc.type}>
              <tr>
                <td className="cell-primary">{doc.type}</td>
                <td className="cell-sub">Identity / KYC</td>
                <td>{formatDate(doc.submittedDate)}</td>
                <td><StatusBadge status={doc.status} /></td>
                <td>{doc.verifiedBy || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {doc.id && (
                      <button className="btn btn-sm btn-secondary" onClick={() => onView(doc)}>
                        <Eye size={13} /> View
                      </button>
                    )}
                    {doc.status === "Submitted" && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => onVerify(doc)}>
                          <Check size={13} /> Verify
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => onReject(doc)}>
                          <X size={13} /> Reject
                        </button>
                      </>
                    )}
                    {!doc.id && (
                      <span className="text-muted" style={{ fontSize: "var(--fs-xs)" }}>Awaiting candidate</span>
                    )}
                  </div>
                </td>
              </tr>
              {doc.status === "Rejected" && doc.rejectionReason && (
                <tr>
                  <td colSpan={6} style={{ paddingTop: 0 }}>
                    <div className="alert alert-danger" style={{ marginTop: -4, marginBottom: 8 }}>
                      <X size={16} />
                      <div>
                        <strong>Rejection reason</strong>
                        {doc.rejectionReason}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
