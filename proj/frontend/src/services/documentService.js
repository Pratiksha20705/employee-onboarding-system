// documentService — real backend calls. The backend stores doc types as
// short codes (AADHAAR, PAN, ...); the UI shows human labels, so we map
// both ways here and keep every page unchanged.
import api, { apiErrorMessage, apiBlobErrorMessage } from "./api";
import { requiredDocumentTypes } from "../data/documents";

const TYPE_TO_CODE = {
  "Aadhaar Card": "AADHAAR",
  "PAN Card": "PAN",
  "Resume": "RESUME",
  "Degree Certificate": "DEGREE_CERTIFICATE",
  "Bank Details": "BANK_DETAILS",
  "Passport Photo": "PASSPORT_PHOTO",
};
const CODE_TO_TYPE = Object.fromEntries(Object.entries(TYPE_TO_CODE).map(([k, v]) => [v, k]));
const STATUS_MAP = { PENDING: "Submitted", VERIFIED: "Verified", REJECTED: "Rejected" };

function adaptDoc(d) {
  return {
    id: d.id,
    type: CODE_TO_TYPE[d.docType] || d.docType,
    submittedDate: d.uploadedAt ? d.uploadedAt.slice(0, 10) : null,
    status: STATUS_MAP[d.status] || d.status,
    verifiedBy: d.status === "VERIFIED" || d.status === "REJECTED" ? "HR Admin" : null,
    rejectionReason: d.rejectionReason || undefined,
  };
}

// Ranks a raw backend document record so that, if the same doc type ever
// shows up more than once in the API response (e.g. legacy duplicate rows
// from before the candidate_id+doc_type uniqueness was enforced), we keep
// the one row that actually matters instead of an arbitrary one: a verified
// document beats a rejected one, which beats a still-pending upload, and
// ties go to the most recently uploaded record. This never picks a
// placeholder over a real uploaded/verified document.
function docRank(d) {
  const STATUS_RANK = { VERIFIED: 3, REJECTED: 2, PENDING: 1 };
  return (STATUS_RANK[d.status] || 0) * 1e15 + (d.id || 0);
}

function mergeRequiredDocuments(rawDocs, requiredTypes, typeToCode, adapt) {
  const byCode = {};
  rawDocs.forEach((d) => {
    const current = byCode[d.docType];
    if (!current || docRank(d) > docRank(current)) byCode[d.docType] = d;
  });
  return requiredTypes.map((type) => {
    const code = typeToCode[type];
    const existing = byCode[code];
    return existing ? adapt(existing) : { id: null, type, submittedDate: null, status: "Pending", verifiedBy: null };
  });
}

export async function fetchDocuments(candidateId) {
  const { data } = await api.get(`/candidates/${candidateId}/documents`);
  return mergeRequiredDocuments(data, requiredDocumentTypes, TYPE_TO_CODE, adaptDoc);
}

export async function verifyDocument(candidateId, documentId) {
  try {
    const { data } = await api.patch(`/documents/${documentId}/verify`);
    return adaptDoc(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not verify document."));
  }
}

export async function rejectDocument(candidateId, documentId, reason) {
  try {
    const { data } = await api.patch(`/documents/${documentId}/reject`, { reason });
    return adaptDoc(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not reject document."));
  }
}

// Opens the candidate's actual uploaded file (PDF/image) in a new tab so HR
// can view/download it. Fetched as a blob (not a plain link) so the request
// still carries the JWT the same way every other API call does.
export async function viewDocumentFile(documentId) {
  try {
    const response = await api.get(`/documents/${documentId}/file`, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(response.data);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
  } catch (err) {
    throw new Error(await apiBlobErrorMessage(err, "Could not open the document."));
  }
}

export async function uploadDocument(candidateId, payload) {
  const code = TYPE_TO_CODE[payload.type] || payload.type;
  const formData = new FormData();
  formData.append("docType", code);
  if (payload.file) formData.append("file", payload.file);
  try {
    const { data } = await api.post(`/candidates/${candidateId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return adaptDoc(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not upload document."));
  }
}
