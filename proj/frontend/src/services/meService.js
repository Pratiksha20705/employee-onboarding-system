// meService — self-service calls for the logged-in user's own onboarding
// profile (used by the Candidate Portal). Mirrors the shape/adapters used
// by candidateService/documentService so the same UI pieces can be reused.
import api, { apiErrorMessage, apiBlobErrorMessage } from "./api";
import { adaptCandidate } from "./candidateService";
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
    rejectionReason: d.rejectionReason || undefined,
  };
}

export async function fetchMyProfile() {
  try {
    const { data } = await api.get("/me/candidate");
    return {
      candidate: adaptCandidate(data.candidate, data.progress),
      timeline: (data.timeline || []).map((log) => ({
        time: log.createdAt ? new Date(log.createdAt).toLocaleString() : "",
        text: log.description,
      })),
    };
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw new Error(apiErrorMessage(err, "Could not load your onboarding profile."));
  }
}

export async function updateMyProfile(payload) {
  try {
    const { data } = await api.put("/me/candidate", {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      address: payload.address,
      dateOfBirth: payload.dateOfBirth || null,
    });
    return adaptCandidate(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not save your information."));
  }
}

export async function submitMyOnboarding() {
  try {
    const { data } = await api.post("/me/submit");
    return adaptCandidate(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not submit your onboarding information."));
  }
}

// See documentService.js's identical docRank/merge logic for why this ranks
// rather than just overwrites: it keeps a verified/rejected/most-recent
// record over an older duplicate for the same doc type instead of picking
// whichever happens to come back last from the API.
function docRank(d) {
  const STATUS_RANK = { VERIFIED: 3, REJECTED: 2, PENDING: 1 };
  return (STATUS_RANK[d.status] || 0) * 1e15 + (d.id || 0);
}

export async function fetchMyDocuments() {
  const { data } = await api.get("/me/documents");
  const byCode = {};
  data.forEach((d) => {
    const current = byCode[d.docType];
    if (!current || docRank(d) > docRank(current)) byCode[d.docType] = d;
  });
  return requiredDocumentTypes.map((type) => {
    const code = TYPE_TO_CODE[type];
    const existing = byCode[code];
    return existing
      ? adaptDoc(existing)
      : { id: null, type, submittedDate: null, status: "Pending" };
  });
}

// Lets the candidate view/download the file they previously uploaded.
export async function viewMyDocumentFile(documentId) {
  try {
    const response = await api.get(`/me/documents/${documentId}/file`, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(response.data);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
  } catch (err) {
    throw new Error(await apiBlobErrorMessage(err, "Could not open the document."));
  }
}

export async function uploadMyDocument(type, file) {
  const code = TYPE_TO_CODE[type] || type;
  const formData = new FormData();
  formData.append("docType", code);
  if (file) formData.append("file", file);
  try {
    const { data } = await api.post("/me/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return adaptDoc(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not upload document."));
  }
}
