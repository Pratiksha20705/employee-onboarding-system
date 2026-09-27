import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Mail, Phone, Briefcase, Building2, CalendarDays, FileText, DoorOpen, GraduationCap, Check, X, KeyRound, Copy } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import Stepper from "../components/Stepper";
import Timeline from "../components/Timeline";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { useToast } from "../hooks/useToast";
import { fetchCandidateById, verifyCandidateSubmission, rejectCandidateSubmission, createCandidateAccount } from "../services/candidateService";
import { fetchActivityTimeline, stageOrder } from "../services/onboardingService";
import { formatDate } from "../utils/dateUtils";
import { initialsOf } from "../utils/constants";

const STAGE_STEPS = [
  { key: "SELECTION", title: "Candidate Selected", description: "Candidate confirmed for the role." },
  { key: "SELECTION_DONE", title: "Onboarding Started", description: "HR initiated the onboarding process." },
  { key: "DOCUMENTS", title: "Documents Submitted", description: "Required documents uploaded by candidate." },
  { key: "VERIFICATION", title: "Verification In Progress", description: "HR reviewing submitted documents." },
  { key: "JOINING", title: "Joining", description: "Joining details confirmed with reporting manager." },
  { key: "INDUCTION", title: "Induction", description: "Induction activities scheduled and completed." },
  { key: "COMPLETED", title: "Onboarding Completed", description: "Employee fully onboarded." },
];

function buildSteps(candidate) {
  const currentIdx = stageOrder.indexOf(candidate.onboardingStage);
  // Map the 6 backend stages onto the 7 display steps (Selection expands to 2 rows).
  const displayIndexForStage = (stageKey) => {
    if (stageKey === "SELECTION") return 1; // "Onboarding Started" row
    return currentIdx;
  };
  return STAGE_STEPS.map((step, i) => {
    let state = "pending";
    if (i === 0) state = "done"; // candidate selected always true once created
    else if (i <= displayIndexForStage(candidate.onboardingStage)) state = "done";
    if (STAGE_STEPS[i].key === candidate.onboardingStage) {
      state = candidate.onboardingStage === "COMPLETED" ? "done" : "current";
    }
    return {
      title: step.title,
      description: step.description,
      state,
      meta: i === 0
        ? formatDate(candidate.selectionDate)
        : state === "done"
        ? "Completed"
        : state === "current"
        ? "In progress"
        : "Not started",
    };
  });
}

export default function CandidateDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState(undefined);
  const [activity, setActivity] = useState([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountResult, setAccountResult] = useState(null);
  const [accountBusy, setAccountBusy] = useState(false);

  function reload() {
    fetchCandidateById(id).then(setCandidate);
    fetchActivityTimeline(id).then(setActivity);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleVerify() {
    setBusy(true);
    try {
      await verifyCandidateSubmission(id);
      showToast("Candidate's onboarding submission verified.", "success");
      reload();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectCandidateSubmission(id, rejectReason);
      showToast("Submission sent back to the candidate with your feedback.", "success");
      setRejectOpen(false);
      setRejectReason("");
      reload();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function openAccountModal() {
    setAccountPassword("");
    setAccountResult(null);
    setAccountOpen(true);
  }

  async function handleCreateAccount() {
    setAccountBusy(true);
    try {
      const result = await createCandidateAccount(id, accountPassword);
      setAccountResult(result);
      reload();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAccountBusy(false);
    }
  }

  if (candidate === undefined) return <LoadingSpinner label="Loading candidate…" size="lg" />;

  if (candidate === null) {
    return (
      <EmptyState
        icon={FileText}
        title="Candidate not found"
        description="This candidate may have been removed."
        action={<Link to="/candidates" className="btn btn-secondary">Back to Candidates</Link>}
      />
    );
  }

  const steps = buildSteps(candidate);

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
              {initialsOf(candidate.firstName, candidate.lastName)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: 600 }}>
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <StatusBadge status={candidate.status} />
              </div>
              <div className="cell-sub" style={{ marginTop: 4 }}>{candidate.id}</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--n-600)" }}><Mail size={14} /> {candidate.email}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--n-600)" }}><Phone size={14} /> {candidate.phone}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--n-600)" }}><Briefcase size={14} /> {candidate.position}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--n-600)" }}><Building2 size={14} /> {candidate.department}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--n-600)" }}><CalendarDays size={14} /> Joining {formatDate(candidate.joiningDate)}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                {candidate.hasLoginAccount ? (
                  <span className="badge badge-success">Portal login linked</span>
                ) : (
                  <span className="badge badge-neutral">No portal login yet</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignSelf: "flex-start" }}>
            {!candidate.hasLoginAccount && (
              <button className="btn btn-secondary" onClick={openAccountModal}>
                <KeyRound size={15} /> Create Portal Login
              </button>
            )}
            <Link to="/documents" className="btn btn-secondary"><FileText size={15} /> View Documents</Link>
            <Link to="/joining" className="btn btn-secondary"><DoorOpen size={15} /> Manage Joining</Link>
            <Link to="/induction" className="btn btn-secondary"><GraduationCap size={15} /> Manage Induction</Link>
          </div>
        </div>
      </div>

      {candidate.verificationStatus && candidate.verificationStatus !== "DRAFT" && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h3 className="section-title" style={{ marginBottom: 6 }}>Candidate's Onboarding Submission</h3>
              <StatusBadge status={candidate.verificationStatus} />
            </div>
            {(candidate.verificationStatus === "SUBMITTED" || candidate.verificationStatus === "UNDER_REVIEW") && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-danger" disabled={busy} onClick={() => setRejectOpen(true)}>
                  <X size={15} /> Reject
                </button>
                <button className="btn btn-success" disabled={busy} onClick={handleVerify}>
                  <Check size={15} /> Verify
                </button>
              </div>
            )}
          </div>
          {candidate.verificationStatus === "REJECTED" && candidate.verificationRejectionReason && (
            <div className="alert alert-danger" style={{ marginTop: 16 }}>
              <X size={16} />
              <div>
                <strong>Reason sent to candidate</strong>
                {candidate.verificationRejectionReason}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h3 className="section-title">Onboarding Progress</h3>
          <Stepper steps={steps} />
        </div>

        <div className="card">
          <h3 className="section-title">Activity Timeline</h3>
          <Timeline items={activity} />
        </div>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Onboarding Submission"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRejectOpen(false)}>Cancel</button>
            <button className="btn btn-danger-solid" disabled={!rejectReason.trim() || busy} onClick={handleReject}>
              Send Back to Candidate
            </button>
          </>
        }
      >
        <div className="form-field">
          <label>Reason for rejection</label>
          <textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain what the candidate needs to fix…"
          />
        </div>
      </Modal>

      <Modal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Create Candidate Portal Login"
        footer={
          accountResult ? (
            <button className="btn btn-primary" onClick={() => setAccountOpen(false)}>Done</button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setAccountOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={accountBusy} onClick={handleCreateAccount}>
                {accountBusy ? "Creating…" : "Create Login"}
              </button>
            </>
          )
        }
      >
        {accountResult ? (
          <div className="stack" style={{ gap: 12 }}>
            <div className="alert alert-success">
              <Check size={16} />
              <div>Login created. Share these credentials with the candidate securely — this password won't be shown again.</div>
            </div>
            <div className="form-field">
              <label>Email</label>
              <input value={accountResult.email} disabled />
            </div>
            <div className="form-field">
              <label>Temporary Password</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={accountResult.temporaryPassword} disabled style={{ fontFamily: "monospace" }} />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigator.clipboard?.writeText(accountResult.temporaryPassword)}
                >
                  <Copy size={13} /> Copy
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 16 }}>
            <p className="cell-sub">
              This links <strong>{candidate.email}</strong> to a new CANDIDATE portal account so they can log in and
              complete their onboarding profile.
            </p>
            <div className="form-field">
              <label>Temporary Password (optional)</label>
              <input
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
