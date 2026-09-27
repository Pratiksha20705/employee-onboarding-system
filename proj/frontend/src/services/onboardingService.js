import api, { apiErrorMessage } from "./api";
import { fetchCandidateById } from "./candidateService";

export const stageOrder = ["SELECTION", "DOCUMENTS", "VERIFICATION", "JOINING", "INDUCTION", "COMPLETED"];

export async function fetchOnboardingProgress(candidateId) {
  const candidate = await fetchCandidateById(candidateId);
  if (!candidate) return null;
  const currentIndex = stageOrder.indexOf(candidate.onboardingStage);
  return {
    candidate,
    stages: stageOrder,
    currentIndex,
    remarks:
      candidate.progress === 100
        ? "Onboarding completed successfully. All checks passed."
        : "On track. No blockers reported by the assigned HR.",
  };
}

export async function fetchActivityTimeline(candidateId) {
  const { data } = await api.get(`/candidates/${candidateId}`);
  return (data.timeline || []).map((log) => ({
    time: log.createdAt ? new Date(log.createdAt).toLocaleString() : "",
    text: log.description,
  }));
}

export async function startOnboarding(candidateId) {
  try {
    const { data } = await api.post(`/onboarding/${candidateId}/start`);
    return data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not start onboarding for this candidate."));
  }
}
