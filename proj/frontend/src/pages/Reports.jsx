import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchDashboardStats, fetchReportData } from "../services/dashboardService";
import { departments } from "../data/candidates";
import { Users, GitBranch, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [dateRange, setDateRange] = useState("last6months");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchReportData()]).then(([s, r]) => {
      setStats(s);
      setReport(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner label="Loading reports…" size="lg" />;

  const maxTrend = Math.max(...report.monthlyTrend.map((m) => m.value));
  const totalDept = report.departmentDistribution.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analyze onboarding performance across departments and time."
        actions={
          <button className="btn btn-secondary">
            <Download size={16} /> Export Report
          </button>
        }
      />

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <StatCard icon={Users} label="Total Candidates" value={stats.totalCandidates} tone="action" />
        <StatCard icon={GitBranch} label="Onboarding In Progress" value={stats.onboardingInProgress} tone="warning" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="success" />
        <StatCard icon={ShieldCheck} label="Pending Verification" value={stats.verificationPending} tone="neutral" />
      </div>

      <div className="toolbar">
        <select className="filter-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="last30days">Last 30 days</option>
          <option value="last6months">Last 6 months</option>
          <option value="thisyear">This year</option>
        </select>
        <select className="filter-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="two-col">
        <div className="card">
          <h3 className="section-title">Monthly Onboarding Trend</h3>
          <div className="bar-chart">
            {report.monthlyTrend.map((m) => (
              <div className="bar-chart-col" key={m.month}>
                <div className="bar-chart-bar" style={{ height: `${(m.value / maxTrend) * 100}%` }} title={`${m.value} candidates`} />
                <span className="bar-chart-label">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Department Distribution</h3>
          <svg viewBox="0 0 42 42" width="140" height="140" style={{ display: "block", margin: "0 auto 20px" }}>
            {(() => {
              let cumulative = 0;
              return report.departmentDistribution.map((d, i) => {
                const pct = (d.value / totalDept) * 100;
                const dasharray = `${pct} ${100 - pct}`;
                const dashoffset = 25 - cumulative;
                cumulative += pct;
                return (
                  <circle
                    key={i}
                    cx="21" cy="21" r="15.9"
                    fill="transparent"
                    stroke={d.color}
                    strokeWidth="6"
                    strokeDasharray={dasharray}
                    strokeDashoffset={dashoffset}
                  />
                );
              });
            })()}
          </svg>
          <div className="donut-legend">
            {report.departmentDistribution.map((d) => (
              <div className="donut-legend-item" key={d.label}>
                <span className="donut-legend-swatch" style={{ background: d.color }} />
                <span>{d.label}</span>
                <span style={{ marginLeft: "auto", fontWeight: 600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 className="section-title">Candidates by Onboarding Stage</h3>
        <p className="text-muted" style={{ fontSize: "var(--fs-sm)" }}>
          See the Dashboard's onboarding pipeline for a live breakdown of candidates at each stage — Selected, Documents,
          Verification, Joining, Induction and Completed.
        </p>
      </div>
    </div>
  );
}
