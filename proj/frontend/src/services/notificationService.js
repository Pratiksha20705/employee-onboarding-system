// notificationService — in-app notifications for the logged-in user
// (works for both HR and the Candidate Portal; the backend resolves the
// recipient from the JWT, so this is the same API for either role).
import api, { apiErrorMessage } from "./api";

export async function fetchNotifications() {
  try {
    const { data } = await api.get("/notifications");
    return data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not load notifications."));
  }
}

export async function markNotificationRead(id) {
  try {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not update the notification."));
  }
}

export async function markAllNotificationsRead() {
  try {
    await api.patch("/notifications/read-all");
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not update notifications."));
  }
}

// Small "time ago" formatter for the notification list (e.g. "2 minutes ago").
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
