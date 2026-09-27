export const STAGE_LABELS = {
  SELECTION: "Selection",
  DOCUMENTS: "Documents",
  VERIFICATION: "Document Verification",
  JOINING: "Joining",
  INDUCTION: "Induction",
  COMPLETED: "Completed",
};

export const CANDIDATE_STATUS_TONE = {
  SELECTED: "action",
  ONBOARDING: "warning",
  JOINED: "success",
  COMPLETED: "success",
  REJECTED: "danger",
};

export function initialsOf(firstName, lastName) {
  return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
}
