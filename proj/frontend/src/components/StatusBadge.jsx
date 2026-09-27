const TONE_MAP = {
  SELECTED: "action",
  ONBOARDING: "warning",
  JOINED: "success",
  COMPLETED: "success",
  REJECTED: "danger",
  Pending: "neutral",
  Submitted: "action",
  Verified: "success",
  Rejected: "danger",
  Confirmed: "success",
  Cancelled: "danger",
  "In Progress": "warning",
  "Completed": "success",
  DRAFT: "neutral",
  SUBMITTED: "action",
  UNDER_REVIEW: "warning",
  VERIFIED: "success",
};

export default function StatusBadge({ status, tone }) {
  const resolvedTone = tone || TONE_MAP[status] || "neutral";
  return <span className={`badge badge-${resolvedTone}`}>{status}</span>;
}
