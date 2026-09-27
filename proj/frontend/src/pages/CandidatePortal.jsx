import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Clock, FileEdit, Upload, Eye, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import Timeline from "../components/Timeline";
import { useToast } from "../hooks/useToast";
import { fetchMyProfile, updateMyProfile, submitMyOnboarding, fetchMyDocuments, uploadMyDocument, viewMyDocumentFile } from "../services/meService";
import { formatDate } from "../utils/dateUtils";

const VERIFICATION_LABEL = {
  DRAFT: "Not Submitted",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default function CandidatePortal() {
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState(undefined);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const profile = await fetchMyProfile();
    if (profile) {
      setCandidate(profile.candidate);
      setTimeline(profile.timeline);
      setForm({
        firstName: profile.candidate.firstName || "",
        lastName: profile.candidate.lastName || "",
        phone: profile.candidate.phone || "",
        address: profile.candidate.address || "",
        dateOfBirth: profile.candidate.dateOfBirth || "",
      });
    } else {
      setCandidate(null);
    }
    try {
      setDocuments(await fetchMyDocuments());
    } catch {
      setDocuments([]);
    }
  }

  useEffect(() => { load(); }, []);

  if (candidate === undefined) return <LoadingSpinner label="Loading your onboarding profile…" size="lg" />;

  if (candidate === null) {
    return (
      <div className="alert alert-danger">
        <AlertTriangle size={16} />
        <div>No onboarding profile is linked to your account yet. Please contact HR.</div>
      </div>
    );
  }

  const verification = candidate.verificationStatus || "DRAFT";
  const locked = verification === "SUBMITTED" || verification === "UNDER_REVIEW" || verification === "VERIFIED";

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateMyProfile(form);
      setCandidate((c) => ({ ...c, ...updated }));
      showToast("Personal information saved.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const updated = await submitMyOnboarding();
      setCandidate((c) => ({ ...c, ...updated }));
      showToast("Onboarding information submitted for HR review.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(type, file) {
    try {
      const doc = await uploadMyDocument(type, file);
      setDocuments((docs) => docs.map((d) => (d.type === type ? doc : d)));
      showToast(`${type} uploaded.`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function handleView(doc) {
    if (!doc.id) return;
    viewMyDocumentFile(doc.id).catch((err) => showToast(err.message, "error"));
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${candidate.firstName}`}
        description={`${candidate.position} · ${candidate.department}`}
      />

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 6 }}>Onboarding Verification Status</h3>
            <StatusBadge status={verification} tone={undefined} />
          </div>
          <div style={{ minWidth: 220, flex: 1, maxWidth: 320 }}>
            <div className="cell-sub" style={{ marginBottom: 4 }}>Profile completion</div>
            <ProgressBar value={candidate.progress ?? 0} />
          </div>
        </div>

        {verification === "REJECTED" && candidate.verificationRejectionReason && (
          <div className="alert alert-danger" style={{ marginTop: 16 }}>
            <XCircle size={16} />
            <div>
              <strong>HR requested changes</strong>
              {candidate.verificationRejectionReason}
            </div>
          </div>
        )}
        {verification === "VERIFIED" && (
          <div className="alert alert-success" style={{ marginTop: 16 }}>
            <CheckCircle2 size={16} />
            <div>Your onboarding information has been verified by HR.</div>
          </div>
        )}
        {(verification === "SUBMITTED" || verification === "UNDER_REVIEW") && (
          <div className="alert alert-warning" style={{ marginTop: 16 }}>
            <Clock size={16} />
            <div>Your submission is with HR for review. You'll see the outcome here.</div>
          </div>
        )}
      </div>

      <div className="two-col">
        <div className="card">
          <h3 className="section-title">Personal Information</h3>
          <form onSubmit={handleSave}>
            <div className="stack" style={{ gap: 16 }}>
              <div className="form-field">
                <label>First Name</label>
                <input
                  value={form.firstName}
                  disabled={locked}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input
                  value={form.lastName}
                  disabled={locked}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input value={candidate.email} disabled />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input
                  value={form.phone}
                  disabled={locked}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label>Address</label>
                <input
                  value={form.address}
                  disabled={locked}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth || ""}
                  disabled={locked}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>

              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn btn-secondary" disabled={locked || saving}>
                  <FileEdit size={15} /> {saving ? "Saving…" : "Save Draft"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={locked || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Submitting…" : verification === "REJECTED" ? "Resubmit Profile" : "Submit Profile"}
                </button>
              </div>
              {locked && (
                <p className="cell-sub">
                  Your information is locked while it's {VERIFICATION_LABEL[verification].toLowerCase()}.
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="stack" style={{ gap: 24 }}>
          <div className="card">
            <h3 className="section-title">Required Documents</h3>
            <div className="stack" style={{ gap: 10 }}>
              {documents.map((doc) => (
                <DocRow key={doc.type} doc={doc} locked={locked} onUpload={handleUpload} onView={handleView} />
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Activity Timeline</h3>
            <Timeline items={timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocRow({ doc, locked, onUpload, onView }) {
  const inputRef = useRef(null);
  const canUpload = !locked && (doc.status === "Pending" || doc.status === "Rejected");

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--n-100)" }}>
      <div>
        <div className="cell-primary">{doc.type}</div>
        {doc.status === "Rejected" && doc.rejectionReason && (
          <div className="cell-sub" style={{ color: "var(--danger-600)" }}>{doc.rejectionReason}</div>
        )}
        {doc.submittedDate && <div className="cell-sub">Submitted {formatDate(doc.submittedDate)}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusBadge status={doc.status} />
        {doc.id && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onView(doc)}>
            <Eye size={13} /> View
          </button>
        )}
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(doc.type, file);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => inputRef.current?.click()}>
              <Upload size={13} /> Upload
            </button>
          </>
        )}
      </div>
    </div>
  );
}
