// The backend's /joining/confirm endpoint only records a confirmation
// date + stage change — it doesn't store employeeId/designation/manager/
// location fields (the schema has no columns for them). We synthesize a
// joining record from the candidate for display, and still call the real
// confirm endpoint (which enforces the "all docs verified" business rule).
import api, { apiErrorMessage } from "./api";
import { fetchCandidateById } from "./candidateService";

export async function fetchJoiningDetails(candidateId) {
  const candidate = await fetchCandidateById(candidateId);
  if (!candidate) return null;
  const confirmed = candidate.status === "JOINED" || candidate.status === "COMPLETED";
  return {
    employeeId: `EMP-${candidate.id}`,
    joiningDate: candidate.joiningDate,
    designation: candidate.position,
    department: candidate.department,
    reportingManager: "",
    workLocation: "",
    status: confirmed ? "Confirmed" : "Pending",
  };
}

export async function confirmJoining(candidateId) {
  try {
    const { data } = await api.post(`/candidates/${candidateId}/joining/confirm`);
    return { success: true, candidate: data };
  } catch (err) {
    throw new Error(
      apiErrorMessage(err, "Could not confirm joining. All required documents must be verified first.")
    );
  }
}
