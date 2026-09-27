import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, GitBranch, FileText, DoorOpen,
  GraduationCap, BarChart3, Settings, PanelLeftClose, PanelLeft, User,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const HR_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/onboarding", label: "Onboarding", icon: GitBranch },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/joining", label: "Joining", icon: DoorOpen },
  { to: "/induction", label: "Induction", icon: GraduationCap },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

// Candidates get a single, focused destination rather than the full HR nav.
const CANDIDATE_NAV_ITEMS = [
  { to: "/portal", label: "My Onboarding", icon: User },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const NAV_ITEMS = user?.role === "CANDIDATE" ? CANDIDATE_NAV_ITEMS : HR_NAV_ITEMS;
  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">O</div>
          <div className="sidebar-brand-text">
            <h1>OnboardFlow</h1>
            <p>Employee Onboarding</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Workflow</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={onCloseMobile}
          >
            <Settings />
            <span>Settings</span>
          </NavLink>
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse}>
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            <span>Collapse</span>
          </button>
        </div>
      </aside>
      <div className={`sidebar-overlay ${mobileOpen ? "visible" : ""}`} onClick={onCloseMobile} />
    </>
  );
}
