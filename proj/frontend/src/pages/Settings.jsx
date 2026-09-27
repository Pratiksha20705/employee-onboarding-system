import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/useToast";

export default function Settings() {
  const [profile, setProfile] = useState({ name: "HR Admin", email: "hr.admin@company.com", role: "Human Resources" });
  const [notifications, setNotifications] = useState({
    documentSubmitted: true,
    verificationPending: true,
    joiningConfirmed: false,
    weeklyDigest: true,
  });
  const [appPrefs, setAppPrefs] = useState({ density: "comfortable", defaultLanding: "/dashboard" });
  const { showToast } = useToast();

  function saveProfile(e) {
    e.preventDefault();
    showToast("Profile updated.", "success");
  }

  function toggleNotif(key) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, notifications and application preferences." />

      <div className="stack">
        <form onSubmit={saveProfile} className="card" style={{ maxWidth: 640 }}>
          <div className="form-section" style={{ marginBottom: 0 }}>
            <div className="form-section-title">Profile</div>
            <div className="form-section-desc">Your HR account details.</div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="name">Full Name</label>
                <input id="name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-field">
                <label htmlFor="settingsEmail">Email</label>
                <input id="settingsEmail" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-field">
                <label htmlFor="role">Role</label>
                <input id="role" value={profile.role} disabled />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>

        <div className="card" style={{ maxWidth: 640 }}>
          <div className="form-section-title">Notification Preferences</div>
          <div className="form-section-desc">Choose which onboarding events notify you.</div>
          <div className="stack" style={{ gap: 4 }}>
            {[
              ["documentSubmitted", "Document submitted for review"],
              ["verificationPending", "Verification pending reminders"],
              ["joiningConfirmed", "Joining confirmations"],
              ["weeklyDigest", "Weekly onboarding digest"],
            ].map(([key, label]) => (
              <label key={key} className="checkbox-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color)", fontSize: "var(--fs-sm)" }}>
                <input type="checkbox" checked={notifications[key]} onChange={() => toggleNotif(key)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ maxWidth: 640 }}>
          <div className="form-section-title">Application Preferences</div>
          <div className="form-section-desc">Adjust how OnboardFlow looks and behaves for you.</div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="density">Table Density</label>
              <select id="density" value={appPrefs.density} onChange={(e) => setAppPrefs((p) => ({ ...p, density: e.target.value }))}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="landing">Default Landing Page</label>
              <select id="landing" value={appPrefs.defaultLanding} onChange={(e) => setAppPrefs((p) => ({ ...p, defaultLanding: e.target.value }))}>
                <option value="/dashboard">Dashboard</option>
                <option value="/candidates">Candidates</option>
                <option value="/onboarding">Onboarding</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
