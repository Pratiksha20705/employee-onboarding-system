import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import HorizontalStepper from "../components/HorizontalStepper";
import ProgressBar from "../components/ProgressBar";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { GitBranch } from "lucide-react";
import { fetchCandidates } from "../services/candidateService";
import { fetchOnboardingProgress, startOnboarding } from "../services/onboardingService";
import { formatDate } from "../utils/dateUtils";
import { STAGE_LABELS } from "../utils/constants";
import { stageOrder } from "../services/onboardingService";
import { useToast } from "../hooks/useToast";

const STEP_LABELS = ["Selection", "Documentation", "Verification", "Joining", "Induction", "Completion"];

export default function Onboarding() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [starting, setStarting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCandidates().then((data) => {
      const active = data.filter((c) => c.status === "ONBOARDING" || c.status === "SELECTED");
      setCandidates(active);
      setSelectedId(active[0]?.id || null);
      setLoading(false);
    }).catch((err) => { showToast(err.message, "error"); setLoading(false); });
  }, []);

  function reloadProgress() {
    if (!selectedId) return;
    fetchOnboardingProgress(selectedId).then(setProgress).catch((err) => showToast(err.message, "error"));
  }

  useEffect(reloadProgress, [selectedId]);

  function handleStartOnboarding() {
    setStarting(true);
    startOnboarding(selectedId).then(() => {
      showToast("Onboarding started.", "success");
      reloadProgress();
    }).catch((err) => showToast(err.message, "error")).finally(() => setStarting(false));
  }

  if (loading) return <LoadingSpinner label="Loading onboarding overview…" size="lg" />;

  const candidate = progress?.candidate;
  const currentIndex = progress?.currentIndex ?? 0;

  const steps = STEP_LABELS.map((label, i) => ({
    title: label,
    state: i < currentIndex ? "done" : i === currentIndex ? "current" : "pending",
    status: i < currentIndex ? "Completed" : i === currentIndex ? "In Progress" : "Pending",
  }));

  return (
    <div>
      <PageHeader
        title="Employee Onboarding"
        description="Track each candidate's progress through the full onboarding workflow."
      />

      {candidates.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No candidates currently onboarding"
          description="Once a candidate is selected, they'll appear here to track through the onboarding workflow."
        />
      ) : (
      <div className="toolbar">
        <select className="filter-select" value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)} style={{ minWidth: 260 }}>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.position}</option>
          ))}
        </select>
      </div>
      )}

      {candidate && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{candidate.firstName} {candidate.lastName}</h3>
                <p className="text-muted" style={{ fontSize: "var(--fs-xs)", marginTop: 2 }}>{candidate.position} · {candidate.department}</p>
              </div>
              <StatusBadge status={candidate.status} />
            </div>
            <HorizontalStepper steps={steps} />
          </div>

          <div className="two-col">
            <div className="card">
              <h3 className="section-title">Onboarding Summary</h3>
              <div className="form-grid" style={{ marginBottom: 8 }}>
                <div className="form-field">
                  <label>Onboarding Start Date</label>
                  <p style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{formatDate(candidate.selectionDate)}</p>
                </div>
                <div className="form-field">
                  <label>Assigned HR</label>
                  <p style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{candidate.assignedHR}</p>
                </div>
                <div className="form-field">
                  <label>Current Stage</label>
                  <p style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{STAGE_LABELS[candidate.onboardingStage]}</p>
                </div>
                <div className="form-field">
                  <label>Overall Progress</label>
                  <ProgressBar value={candidate.progress} />
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {candidate.status === "SELECTED" && (
                  <button className="btn btn-primary btn-sm" onClick={handleStartOnboarding} disabled={starting}>
                    {starting ? "Starting…" : "Start Onboarding"}
                  </button>
                )}
                <Link to={`/onboarding/${candidate.id}/documents`} className="btn btn-secondary btn-sm">Documents</Link>
                <Link to={`/onboarding/${candidate.id}/joining`} className="btn btn-secondary btn-sm">Joining</Link>
                <Link to={`/onboarding/${candidate.id}/induction`} className="btn btn-secondary btn-sm">Induction</Link>
                <Link to={`/candidates/${candidate.id}`} className="btn btn-secondary btn-sm">Full Profile</Link>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">Remarks</h3>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--n-700)", lineHeight: 1.6 }}>{progress.remarks}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
