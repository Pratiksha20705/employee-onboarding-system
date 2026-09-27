import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, PartyPopper } from "lucide-react";
import PageHeader from "../components/PageHeader";
import InductionTable from "../components/InductionTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { GraduationCap } from "lucide-react";
import { fetchCandidates } from "../services/candidateService";
import { fetchInductionActivities, markActivityComplete, createInductionActivity } from "../services/inductionService";
import { formatDate } from "../utils/dateUtils";
import { useToast } from "../hooks/useToast";

export default function Induction() {
  const { id: routeId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(routeId || null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", scheduledDate: "", assignedTo: "" });
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
    fetchInductionActivities(selectedId).then(setActivities).catch((err) => showToast(err.message, "error"));
  }, [selectedId]);

  const candidate = candidates.find((c) => c.id === selectedId);
  const allComplete = activities.length > 0 && activities.every((a) => a.status === "Completed");

  function handleComplete(activity) {
    markActivityComplete(selectedId, activity.id).then((updated) => {
      setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
      showToast(`${activity.name} marked as completed.`, "success");
    }).catch((err) => showToast(err.message, "error"));
  }

  function handleCreate(e) {
    e.preventDefault();
    createInductionActivity(selectedId, form).then((res) => {
      setActivities((prev) => [...prev, res]);
      showToast("Induction activity added.", "success");
      setModalOpen(false);
      setForm({ name: "", description: "", scheduledDate: "", assignedTo: "" });
    }).catch((err) => showToast(err.message, "error"));
  }

  if (loading) return <LoadingSpinner label="Loading induction activities…" size="lg" />;

  return (
    <div>
      <PageHeader
        title="Induction"
        description="Manage employee induction activities."
        actions={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Activity
          </button>
        }
      />

      {candidates.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No induction activities yet"
          description="Induction activities will appear here once a candidate has confirmed their joining."
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
              {candidate.position} · {candidate.department} · Joining {formatDate(candidate.joiningDate)}
            </span>
          )}
        </div>
      </div>

      {allComplete && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <PartyPopper />
          <div>
            <strong>All induction activities completed</strong>
            This candidate's onboarding status can now become COMPLETED.
          </div>
        </div>
      )}

      <div className="card card-flush">
        <InductionTable activities={activities} onComplete={handleComplete} />
      </div>
      </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Induction Activity"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name.trim()}>Add Activity</button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div className="stack" style={{ gap: 16 }}>
            <div className="form-field">
              <label htmlFor="actName">Activity Name</label>
              <input id="actName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Workstation Setup" />
            </div>
            <div className="form-field">
              <label htmlFor="actDesc">Description</label>
              <textarea id="actDesc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this activity involve?" />
            </div>
            <div className="form-field">
              <label htmlFor="actDate">Scheduled Date</label>
              <input id="actDate" type="date" value={form.scheduledDate} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="actAssignee">Assigned To</label>
              <input id="actAssignee" value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} placeholder="e.g. Anjali Menon" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
