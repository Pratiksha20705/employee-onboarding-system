import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  timeAgo,
} from "../services/notificationService";

const POLL_MS = 30_000;

// Shared between the HR dashboard and the Candidate Portal (both render the
// same Topbar). The backend already scopes /api/notifications to whoever is
// logged in, so this component doesn't need to know or care which role it's
// rendering for - except when deciding where "View" should navigate to.
export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      // Silent - the bell just stays at its last-known state. Not worth a
      // toast for a background poll.
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  }

  async function handleItemClick(notif) {
    setOpen(false);
    if (!notif.read) {
      // Optimistic - flip it locally right away, then confirm with the server.
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      try {
        await markNotificationRead(notif.id);
      } catch {
        load(); // fall back to the server's view if the update failed
      }
    }
    if (notif.candidateId) {
      navigate(user?.role === "CANDIDATE" ? "/portal" : `/candidates/${notif.candidateId}`);
    }
  }

  async function handleMarkAllRead(e) {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className="icon-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <Bell size={16} />
        {unreadCount > 0 && <span className="dot" />}
      </button>

      {open && (
        <div className="notif-panel" role="menu">
          <div className="notif-panel-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notif-panel-list">
            {loading && notifications.length === 0 && (
              <div className="notif-empty">Loading…</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="notif-empty">You're all caught up.</div>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                className={`notif-item ${!n.read ? "unread" : ""}`}
                onClick={() => handleItemClick(n)}
                role="menuitem"
              >
                <span className="notif-item-dot" aria-hidden="true" />
                <span className="notif-item-body">
                  <span className="notif-item-title">{n.title}</span>
                  <span className="notif-item-message">{n.message}</span>
                  <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
