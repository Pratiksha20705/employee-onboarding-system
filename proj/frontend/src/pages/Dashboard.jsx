import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, GitBranch, FileClock, ShieldCheck, DoorOpen, CheckCircle2,
  FileText, GraduationCap, ChevronRight, AlertTriangle, RefreshCw,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Pipeline from "../components/Pipeline";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ProgressBar from "../components/ProgressBar";
import StatusBadge from "../components/StatusBadge";
import { fetchDashboardStats, fetchPipelineStages, fetchPendingActions } from "../services/dashboardService";
import { fetchCandidates } from "../services/candidateService";
import { apiErrorMessage } from "../services/api";
import { formatDate } from "../utils/dateUtils";
import { STAGE_LABELS, initialsOf } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";

const PENDING_ICON = { documents: FileText, joining: DoorOpen, induction: GraduationCap };
const PENDING_TONE = { documents: "brass", joining: "action", induction: "warning" };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [stages, setStages] = useState([]);
  const [pending, setPending] = useState([]);
  const [recent, setRecent] = useState([]);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchDashboardStats(), fetchPipelineStages(), fetchPendingActions(), fetchCandidates()])
      .then(([s, p, pa, candidates]) => {
        if (!active) return;
        setStats(s);
        setStages(p);
        setPending(pa);
        setRecent(candidates.slice(0, 5));
      })
      .catch((err) => {
        if (!active) return;
        setError(apiErrorMessage(err, "Could not load the dashboard right now."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description="Here's an overview of your employee onboarding activity."
        actions={<Link to="/candidates/new" className="btn btn-primary">+ Add Candidate</Link>}
      />

      {loading && <LoadingSpinner label="Loading dashboard…" size="lg" />}

      {!loading && error && (
        <div className="card">
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load the dashboard"
            description={error}
            action={
              <button className="btn btn-secondary btn-sm" onClick={load}>
                <RefreshCw size={14} /> Try again
              </button>
            }
          />
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="stat-grid">
            <StatCard icon={Users} label="Total Candidates" value={stats.totalCandidates} tone="neutral" />
            <StatCard icon={GitBranch} label="Onboarding In Progress" value={stats.onboardingInProgress} tone="action" />
            <StatCard icon={FileClock} label="Documents Pending" value={stats.documentsPending} tone="brass" />
            <StatCard icon={ShieldCheck} label="Verification Pending" value={stats.verificationPending} tone="warning" />
            <StatCard icon={DoorOpen} label="Joining Pending" value={stats.joiningPending} tone="action" />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="success" />
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title-row">
              <h3 className="section-title mb-0">Onboarding Pipeline</h3>
              <Link to="/onboarding" className="card-link">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <Pipeline stages={stages} />
          </div>

          <div className="two-col">
            <div className="card card-flush">
              <div className="card-header">
                <div>
                  <h3>Recent Candidates</h3>
                  <p>The latest candidates moving through the workflow</p>
                </div>
                <Link to="/candidates" className="btn btn-sm btn-secondary">View all</Link>
              </div>

              {recent.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No candidates yet"
                  description="Add your first candidate to start tracking their onboarding."
                  action={<Link to="/candidates/new" className="btn btn-sm btn-primary">+ Add Candidate</Link>}
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table" aria-label="Recent candidates">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Position</th>
                        <th>Department</th>
                        <th>Joining Date</th>
                        <th>Current Stage</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="cell-name">
                              <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                                {initialsOf(c.firstName, c.lastName)}
                              </span>
                              <span className="cell-primary">{c.firstName} {c.lastName}</span>
                            </div>
                          </td>
                          <td>{c.position}</td>
                          <td>{c.department}</td>
                          <td>{formatDate(c.joiningDate)}</td>
                          <td>{STAGE_LABELS[c.onboardingStage] || c.onboardingStage}</td>
                          <td style={{ minWidth: 120 }}><ProgressBar value={c.progress} /></td>
                          <td><StatusBadge status={c.status} /></td>
                          <td>
                            <Link to={`/candidates/${c.id}`} className="btn btn-sm btn-secondary">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="section-title">Needs Attention</h3>

              {pending.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="You're all caught up"
                  description="Nothing needs your attention right now."
                />
              ) : (
                <div className="pending-list">
                  {pending.map((item) => {
                    const Icon = PENDING_ICON[item.type] || FileText;
                    return (
                      <Link to={item.link} className="pending-item" key={item.id}>
                        <div className="pending-item-left">
                          <div className={`pending-item-icon tone-${PENDING_TONE[item.type] || "neutral"}`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="pending-item-text">{item.text}</div>
                            <div className="pending-item-sub">{item.sub}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="pending-item-chevron" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
