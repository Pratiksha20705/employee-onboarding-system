import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const PAGE_META = {
  "/dashboard": { title: "Dashboard", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Dashboard" }] },
  "/candidates": { title: "Candidates", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Candidates" }] },
  "/candidates/new": { title: "Add Candidate", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Candidates", to: "/candidates" }, { label: "Add Candidate" }] },
  "/onboarding": { title: "Employee Onboarding", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Onboarding" }] },
  "/documents": { title: "Documents", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Documents" }] },
  "/joining": { title: "Joining Details", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Joining" }] },
  "/induction": { title: "Induction", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Induction" }] },
  "/reports": { title: "Reports", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Reports" }] },
  "/settings": { title: "Settings", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Settings" }] },
  "/portal": { title: "My Onboarding", breadcrumb: [{ label: "My Onboarding" }] },
};

function resolveMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/candidates/")) {
    return { title: "Candidate Details", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Candidates", to: "/candidates" }, { label: "Details" }] };
  }
  if (pathname.startsWith("/onboarding/")) {
    if (pathname.includes("/documents")) return { title: "Documents", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Onboarding", to: "/onboarding" }, { label: "Documents" }] };
    if (pathname.includes("/joining")) return { title: "Joining Details", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Onboarding", to: "/onboarding" }, { label: "Joining" }] };
    if (pathname.includes("/induction")) return { title: "Induction", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Onboarding", to: "/onboarding" }, { label: "Induction" }] };
    return { title: "Employee Onboarding", breadcrumb: [{ label: "Home", to: "/dashboard" }, { label: "Onboarding" }] };
  }
  return { title: "OnboardFlow", breadcrumb: null };
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const meta = resolveMeta(location.pathname);

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="app-main">
        <Topbar title={meta.title} breadcrumb={meta.breadcrumb} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
