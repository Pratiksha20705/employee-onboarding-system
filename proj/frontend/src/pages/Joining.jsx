import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { DoorOpen } from "lucide-react";
import { fetchCandidates } from "../services/candidateService";
import { fetchDocuments } from "../services/documentService";
import { fetchJoiningDetails, confirmJoining } from "../services/joiningService";
import { departments } from "../data/candidates";
import { formatDate } from "../utils/dateUtils";
import { useToast } from "../hooks/useToast";

const emptyForm = {
  employeeId: "",
  joiningDate: "",
  designation: "",
  department: "",
  reportingManager: "",
  workLocation: "",
};

export default function Joining() {
  const { id: routeId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(routeId || null);
  const [documents, setDocuments] = useState([]);
  const [joining, setJoining] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCandidates().then((data) => {
      const relevant = data.filter((c) => c.status === "ONBOARDING" || c.status === "COMPLETED");
      setCandidates(relevant);
      if (!routeId) setSelectedId(relevant[0]?.id || null);
      setLoading(false);
    }).catch((err) => { showToast(err.message, "error"); setLoading(false); });
  }, [routeId]);

  useEffect(() => {
    if (!selectedId) return;
    fetchDocuments(selectedId).then(setDocuments).catch((err) => showToast(err.message, "error"));
    fetchJoiningDetails(selectedId).then((data) => {
      setJoining(data);
      setForm(data ? { ...data } : { ...emptyForm });
    }).catch((err) => showToast(err.message, "error"));
  }, [selectedId]);

  const candidate = candidates.find((c) => c.id === selectedId);
  const allVerified = documents.length > 0 && documents.every((d) => d.status === "Verified");
  const canConfirm = allVerified && joining?.status !== "Confirmed";

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!allVerified) return;
    confirmJoining(selectedId).then(() => {
      setJoining({ ...form, status: "Confirmed" });
      showToast("Joining confirmed successfully.", "success");
    }).catch((err) => showToast(err.message, "error"));
  }

  if (loading) return <LoadingSpinner label="Loading joining details…" size="lg" />;

  return (
    <div>
      <PageHeader title="Joining Details" description="Confirm employee joining details once documents are verified." />

      {candidates.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No candidates ready for joining"
          description="Candidates will appear here once they've started onboarding and have documents to verify."
        />
      ) : (
      <>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <select className="filter-select" value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)} style={{ minWidth: 260 }}>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.id}</option>
            ))}
          </select>
          {candidate && (
            <span className="text-muted" style={{ fontSize: "var(--fs-sm)" }}>
              {candidate.position} · {candidate.department} · Expected {formatDate(candidate.joiningDate)}
            </span>
          )}
          {joining && <span style={{ marginLeft: "auto" }}><StatusBadge status={joining.status} /></span>}
        </div>
      </div>

      {!allVerified && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle />
          <div>
            <strong>Joining cannot be confirmed yet</strong>
            Joining cannot be confirmed until all required documents are verified. {documents.filter(d => d.status !== "Verified").length} document(s) still need attention.
          </div>
        </div>
      )}

      {joining?.status === "Confirmed" && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <CheckCircle2 />
          <div>
            <strong>Joining confirmed</strong>
            This employee's joining has been confirmed and recorded.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ maxWidth: 780 }}>
          <div className="form-section" style={{ marginBottom: 0 }}>
            <div className="form-section-title">Joining Information</div>
            <div className="form-section-desc">These details will be recorded as the employee's official joining record.</div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="employeeId">Employee ID</label>
                <input id="employeeId" value={form.employeeId} onChange={(e) => update("employeeId", e.target.value)} placeholder="e.g. EMP-0452" disabled={!allVerified} />
              </div>
              <div className="form-field">
                <label htmlFor="joiningDate">Joining Date</label>
                <input id="joiningDate" type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} disabled={!allVerified} />
              </div>
              <div className="form-field">
                <label htmlFor="designation">Designation</label>
                <input id="designation" value={form.designation} onChange={(e) => update("designation", e.target.value)} placeholder="e.g. Data Analyst" disabled={!allVerified} />
              </div>
              <div className="form-field">
                <label htmlFor="jDepartment">Department</label>
                <select id="jDepartment" value={form.department} onChange={(e) => update("department", e.target.value)} disabled={!allVerified}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="reportingManager">Reporting Manager</label>
                <input id="reportingManager" value={form.reportingManager} onChange={(e) => update("reportingManager", e.target.value)} placeholder="e.g. Sunita Rao" disabled={!allVerified} />
              </div>
              <div className="form-field">
                <label htmlFor="workLocation">Work Location</label>
                <input id="workLocation" value={form.workLocation} onChange={(e) => update("workLocation", e.target.value)} placeholder="e.g. Pune - Hinjawadi Office" disabled={!allVerified} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={!canConfirm}>
              Confirm Joining
            </button>
          </div>
        </div>
      </form>
      </>
      )}
    </div>
  );
}
