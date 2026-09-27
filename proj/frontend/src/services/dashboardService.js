import api from "./api";
import { fetchCandidates } from "./candidateService";

const PIPELINE_KEYS = ["SELECTED", "DOCUMENT_SUBMISSION", "DOCUMENT_VERIFICATION", "JOINING", "INDUCTION", "COMPLETED"];
const PIPELINE_LABELS = {
  SELECTED: "Selected",
  DOCUMENT_SUBMISSION: "Documents",
  DOCUMENT_VERIFICATION: "Verification",
  JOINING: "Joining",
  INDUCTION: "Induction",
  COMPLETED: "Completed",
};
const PIPELINE_FRONTEND_KEY = {
  SELECTED: "SELECTION",
  DOCUMENT_SUBMISSION: "DOCUMENTS",
  DOCUMENT_VERIFICATION: "VERIFICATION",
  JOINING: "JOINING",
  INDUCTION: "INDUCTION",
  COMPLETED: "COMPLETED",
};

export async function fetchDashboardStats() {
  const [{ data: summary }, { data: pipeline }] = await Promise.all([
    api.get("/dashboard/summary"),
    api.get("/dashboard/pipeline"),
  ]);
  return {
    totalCandidates: summary.totalCandidates,
    onboardingInProgress: summary.onboarding,
    documentsPending: summary.pendingDocuments,
    verificationPending: pipeline.DOCUMENT_VERIFICATION || 0,
    joiningPending: pipeline.JOINING || 0,
    completed: summary.completed,
  };
}

export async function fetchPipelineStages() {
  const { data } = await api.get("/dashboard/pipeline");
  return PIPELINE_KEYS.map((k) => ({
    key: PIPELINE_FRONTEND_KEY[k],
    label: PIPELINE_LABELS[k],
    count: data[k] || 0,
  }));
}

export async function fetchPendingActions() {
  const [{ data: summary }, { data: pipeline }] = await Promise.all([
    api.get("/dashboard/summary"),
    api.get("/dashboard/pipeline"),
  ]);
  const actions = [];
  if (summary.pendingDocuments > 0) {
    actions.push({
      id: 1,
      text: `${summary.pendingDocuments} document(s) awaiting verification`,
      sub: "Review in the Documents section",
      type: "documents",
      link: "/documents",
    });
  }
  if (pipeline.JOINING > 0) {
    actions.push({
      id: 2,
      text: `${pipeline.JOINING} candidate(s) awaiting joining confirmation`,
      sub: "Review in the Joining section",
      type: "joining",
      link: "/joining",
    });
  }
  if (pipeline.INDUCTION > 0) {
    actions.push({
      id: 3,
      text: `${pipeline.INDUCTION} candidate(s) in induction`,
      sub: "Review in the Induction section",
      type: "induction",
      link: "/induction",
    });
  }
  return actions;
}

// No dedicated analytics endpoints exist on the backend yet, so these two
// charts are computed live from the real candidate list instead of being
// hardcoded mock numbers.
export async function fetchReportData() {
  const candidates = await fetchCandidates();

  const deptCounts = {};
  candidates.forEach((c) => {
    deptCounts[c.department] = (deptCounts[c.department] || 0) + 1;
  });
  const palette = ["var(--action-500)", "var(--brass-500)", "var(--success-500)", "var(--warning-500)", "#8896ab", "#c084fc"];
  const departmentDistribution = Object.entries(deptCounts).map(([label, value], i) => ({
    label,
    value,
    color: palette[i % palette.length],
  }));

  const monthCounts = {};
  candidates.forEach((c) => {
    if (!c.selectionDate) return;
    const key = new Date(c.selectionDate).toLocaleString("en-US", { month: "short" });
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  const monthlyTrend = Object.entries(monthCounts).map(([month, value]) => ({ month, value }));

  return {
    monthlyTrend: monthlyTrend.length ? monthlyTrend : [{ month: "—", value: 0 }],
    departmentDistribution: departmentDistribution.length ? departmentDistribution : [{ label: "No data yet", value: 1, color: "#8896ab" }],
  };
}
