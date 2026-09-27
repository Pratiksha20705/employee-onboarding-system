// candidateService — talks to the real Spring Boot backend.
// The backend's Candidate entity doesn't carry a few UI-only fields
// (onboardingStage name, progress %, assignedHR, selectionDate), so
// adaptCandidate() derives/fills them without changing any page code.
import api, { apiErrorMessage } from "./api";

const STAGE_ORDER = [
  "SELECTED",
  "DOCUMENT_SUBMISSION",
  "DOCUMENT_VERIFICATION",
  "JOINING",
  "INDUCTION",
  "COMPLETED",
];

const STAGE_TO_FRONTEND = {
  SELECTED: "SELECTION",
  DOCUMENT_SUBMISSION: "DOCUMENTS",
  DOCUMENT_VERIFICATION: "VERIFICATION",
  JOINING: "JOINING",
  INDUCTION: "INDUCTION",
  COMPLETED: "COMPLETED",
};

function computeProgress(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < 0) return 0;
  return Math.round((idx / (STAGE_ORDER.length - 1)) * 100);
}

function currentUserName() {
  try {
    const raw = localStorage.getItem("onboardflow_user");
    return raw ? JSON.parse(raw).fullName : "HR Admin";
  } catch {
    return "HR Admin";
  }
}

export function adaptCandidate(c, progressOverride) {
  if (!c) return c;
  return {
    ...c,
    id: String(c.id),
    onboardingStage: STAGE_TO_FRONTEND[c.stage] || c.stage,
    progress: progressOverride ?? computeProgress(c.stage),
    selectionDate: c.createdAt ? c.createdAt.slice(0, 10) : null,
    joiningDate: c.joiningConfirmedDate || c.expectedJoiningDate || null,
    assignedHR: currentUserName(),
  };
}

export async function fetchCandidates({ search, status, department } = {}) {
  const { data } = await api.get("/candidates", { params: { search, status, department } });
  return data.map((c) => adaptCandidate(c));
}

export async function fetchCandidateById(id) {
  try {
    const { data } = await api.get(`/candidates/${id}`);
    return {
      ...adaptCandidate(data.candidate, data.progress),
      hasLoginAccount: !!data.hasLoginAccount,
    };
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw new Error(apiErrorMessage(err, "Could not load candidate."));
  }
}

export async function createCandidate(payload) {
  const body = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    dateOfBirth: payload.dateOfBirth,
    department: payload.department,
    position: payload.position,
    expectedJoiningDate: payload.joiningDate || payload.expectedJoiningDate,
  };
  try {
    const { data } = await api.post("/candidates", body);
    return adaptCandidate(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not create candidate."));
  }
}

export async function updateCandidate(id, payload) {
  try {
    const { data } = await api.put(`/candidates/${id}`, payload);
    return adaptCandidate(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not update candidate."));
  }
}

export async function deleteCandidate(id) {
  try {
    await api.delete(`/candidates/${id}`);
    return { success: true, id };
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not delete candidate."));
  }
}

// --- HR linking a candidate profile to a CANDIDATE portal login ---

export async function createCandidateAccount(id, password) {
  try {
    const { data } = await api.post(`/candidates/${id}/account`, { password: password || undefined });
    return data; // { email, temporaryPassword }
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not create a login account for this candidate."));
  }
}

// --- HR review of a candidate's self-submitted onboarding information ---

export async function verifyCandidateSubmission(id) {
  try {
    const { data } = await api.patch(`/candidates/${id}/verify`);
    return adaptCandidate(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not verify this candidate's submission."));
  }
}

export async function rejectCandidateSubmission(id, reason) {
  try {
    const { data } = await api.patch(`/candidates/${id}/reject`, { reason });
    return adaptCandidate(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not reject this candidate's submission."));
  }
}
