import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const WORKFLOW = [
  "Selected candidate starts onboarding",
  "Documents submitted & verified",
  "Joining confirmed & induction completed",
];

const ROLE_PRESETS = {
  HR: {
    label: "HR / Admin",
    email: "hr@onboardflow.com",
    heading: "Sign in",
    subheading: "HR & Admin access to the onboarding console",
  },
  CANDIDATE: {
    label: "Candidate",
    email: "candidate@onboardflow.com",
    heading: "Sign in",
    subheading: "Candidate access to your onboarding portal",
  },
};

export default function Login() {
  const [role, setRole] = useState("HR");
  const [email, setEmail] = useState(ROLE_PRESETS.HR.email);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleRoleSelect(nextRole) {
    if (nextRole === role) return;
    setRole(nextRole);
    setEmail(ROLE_PRESETS[nextRole].email);
    setPassword("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data = await login(email, password);
      navigate(data.role === "CANDIDATE" ? "/portal" : "/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-brand-panel">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="sidebar-brand-mark" style={{ width: 40, height: 40, fontSize: 18 }}>O</div>
            <div>
              <h1 style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: "#fff" }}>OnboardFlow</h1>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--n-400)" }}>Employee Onboarding</p>
            </div>
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.9rem",
            color: "#fff", marginTop: 56, maxWidth: 420, lineHeight: 1.3,
          }}>
            One workflow, from selection to a fully onboarded employee.
          </h2>
          <p style={{ color: "var(--n-400)", marginTop: 16, maxWidth: 380, fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
            OnboardFlow keeps every candidate moving through documents, verification,
            joining and induction — with nothing left to track in a spreadsheet.
          </p>

          <div className="login-workflow">
            {WORKFLOW.map((step, i) => (
              <div className="login-workflow-step" key={i}>
                <span className="num">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "var(--fs-xs)", color: "var(--n-500)" }}>
          © 2026 OnboardFlow. Internal HR system.
        </p>
      </div>

      <div className="login-form-panel">
        <div className="login-card">
          <div
            role="tablist"
            aria-label="Login as"
            style={{
              display: "flex",
              background: "var(--n-100)",
              borderRadius: "var(--radius-md)",
              padding: 4,
              gap: 4,
              marginBottom: 24,
            }}
          >
            {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={role === key}
                onClick={() => handleRoleSelect(key)}
                style={{
                  flex: 1,
                  border: "none",
                  cursor: "pointer",
                  padding: "9px 0",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--fs-sm)",
                  fontWeight: 600,
                  transition: "background 0.15s, color 0.15s",
                  background: role === key ? "var(--n-0)" : "transparent",
                  color: role === key ? "var(--action-700)" : "var(--n-500)",
                  boxShadow: role === key ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 700, color: "var(--n-900)" }}>
            {ROLE_PRESETS[role].heading}
          </h2>
          <p style={{ color: "var(--n-500)", fontSize: "var(--fs-sm)", marginTop: 6, marginBottom: 32 }}>
            {ROLE_PRESETS[role].subheading}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="stack" style={{ gap: 18 }}>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--n-400)" }} />
                  <input
                    id="email"
                    type="email"
                    style={{ paddingLeft: 36 }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--n-400)" }} />
                  <input
                    id="password"
                    type="password"
                    style={{ paddingLeft: 36 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label className="checkbox-row">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <a href="#" style={{ fontSize: "var(--fs-xs)", color: "var(--action-600)", fontWeight: 600 }}>
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ padding: "11px 0" }} disabled={submitting}>
                {submitting ? "Signing in…" : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>

          {role === "CANDIDATE" ? (
            <p style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--n-400)", marginTop: 28 }}>
              Don't have login credentials? Please contact HR.
            </p>
          ) : (
            <p style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--n-400)", marginTop: 28 }}>
              Employee Onboarding Management System
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
