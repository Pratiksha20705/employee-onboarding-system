import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DocumentTable from "../components/DocumentTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { FileText } from "lucide-react";
import { fetchCandidates } from "../services/candidateService";
import { fetchDocuments, verifyDocument, rejectDocument, uploadDocument, viewDocumentFile } from "../services/documentService";
import { requiredDocumentTypes } from "../data/documents";
import { formatDate } from "../utils/dateUtils";
import { useToast } from "../hooks/useToast";

export default function Documents() {
  const { id: routeId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(routeId || null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [uploadForm, setUploadForm] = useState({ type: requiredDocumentTypes[0], fileName: "" });
  const [uploadFile, setUploadFile] = useState(null);
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
  }, [selectedId]);

  const candidate = candidates.find((c) => c.id === selectedId);

  function handleVerify(doc) {
    if (!doc.id) { showToast("Upload this document before verifying it.", "error"); return; }
    verifyDocument(selectedId, doc.id).then((updated) => {
      setDocuments((prev) => prev.map((d) => (d.type === doc.type ? updated : d)));
      showToast(`${doc.type} marked as verified.`, "success");
    }).catch((err) => showToast(err.message, "error"));
  }

  function handleView(doc) {
    if (!doc.id) return;
    viewDocumentFile(doc.id).catch((err) => showToast(err.message, "error"));
  }

  function handleRejectConfirm() {
    if (!rejectTarget?.id) { showToast("Upload this document before rejecting it.", "error"); return; }
    rejectDocument(selectedId, rejectTarget.id, rejectReason).then((updated) => {
      setDocuments((prev) => prev.map((d) => (d.type === rejectTarget.type ? updated : d)));
      showToast(`${rejectTarget.type} was rejected.`, "error");
      setRejectTarget(null);
      setRejectReason("");
    }).catch((err) => showToast(err.message, "error"));
  }

  function handleUpload(e) {
    e.preventDefault();
    uploadDocument(selectedId, { type: uploadForm.type, file: uploadFile }).then((updated) => {
      setDocuments((prev) => {
        const existingIdx = prev.findIndex((d) => d.type === uploadForm.type);
        if (existingIdx > -1) {
          const copy = [...prev];
          copy[existingIdx] = updated;
          return copy;
        }
        return [...prev, updated];
      });
      showToast("Document uploaded successfully.", "success");
      setUploadOpen(false);
      setUploadForm({ type: requiredDocumentTypes[0], fileName: "" });
      setUploadFile(null);
    }).catch((err) => showToast(err.message, "error"));
  }

  if (loading) return <LoadingSpinner label="Loading documents…" size="lg" />;

  const verifiedCount = documents.filter((d) => d.status === "Verified").length;

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Review and verify candidate documents."
        actions={
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
            <UploadCloud size={16} /> Upload Document
          </button>
        }
      />

      {candidates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents to review"
          description="Once a candidate begins onboarding, their submitted documents will appear here for verification."
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
          <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>
            {verifiedCount} / {documents.length} verified
          </span>
        </div>
      </div>

      <div className="card card-flush">
        <DocumentTable documents={documents} onVerify={handleVerify} onReject={setRejectTarget} onView={handleView} />
      </div>
      </>
      )}

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={`Reject ${rejectTarget?.type || ""}`}
        maxWidth={440}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
            <button className="btn btn-danger-solid" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>Reject Document</button>
          </>
        }
      >
        <div className="form-field">
          <label htmlFor="reason">Rejection Reason</label>
          <textarea
            id="reason"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Document image is unclear. Please upload a clearer copy."
          />
        </div>
      </Modal>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Document"
        maxWidth={440}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setUploadOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpload}>Upload Document</button>
          </>
        }
      >
        <form onSubmit={handleUpload}>
          <div className="stack" style={{ gap: 16 }}>
            <div className="form-field">
              <label htmlFor="docType">Document Type</label>
              <select id="docType" value={uploadForm.type} onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value }))}>
                {requiredDocumentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="file">Choose File</label>
              <input id="file" type="file" onChange={(e) => {
                const f = e.target.files[0] || null;
                setUploadFile(f);
                setUploadForm((form) => ({ ...form, fileName: f?.name || "" }));
              }} />
            </div>
            <div className="form-field">
              <label htmlFor="docName">Document Name</label>
              <input id="docName" value={uploadForm.fileName} onChange={(e) => setUploadForm((f) => ({ ...f, fileName: e.target.value }))} placeholder="e.g. aadhaar_priya.pdf" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
