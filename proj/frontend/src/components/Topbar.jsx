import { Menu, Search, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../hooks/useAuth";
import { initialsOf } from "../utils/constants";

export default function Topbar({ title, breadcrumb, onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [first, ...rest] = (user?.fullName || "HR Admin").split(" ");
  const last = rest.join(" ");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onOpenMobileMenu} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div className="topbar-title">
          <h2>{title}</h2>
          {breadcrumb && <div className="topbar-breadcrumb"><Breadcrumb items={breadcrumb} /></div>}
        </div>
      </div>
      <div className="topbar-right">
        <label className="topbar-search">
          <Search size={15} />
          <input type="text" placeholder="Search…" aria-label="Search" />
        </label>
        <NotificationBell />
        <div className="topbar-user">
          <div className="avatar">{initialsOf(first, last)}</div>
          <div>
            <div className="topbar-user-name">{user?.fullName || "HR Admin"}</div>
            <div className="topbar-user-role">{user?.role || "Human Resources"}</div>
          </div>
        </div>
        <button className="icon-btn" aria-label="Log out" title="Log out" onClick={handleLogout}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
