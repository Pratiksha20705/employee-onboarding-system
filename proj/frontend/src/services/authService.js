import api, { apiErrorMessage } from "./api";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("onboardflow_token", data.token);
  localStorage.setItem(
    "onboardflow_user",
    JSON.stringify({ email: data.email, fullName: data.fullName, role: data.role })
  );
  return data;
}

// Candidate self-registration has been removed - candidates are provisioned
// by HR (see candidateService.createCandidateAccount) and log in with the
// credentials HR gives them.

export function logout() {
  localStorage.removeItem("onboardflow_token");
  localStorage.removeItem("onboardflow_user");
}

// Reads the token's own "exp" claim (no signature check - the backend still
// verifies that) so a stale token left over in localStorage from a previous,
// already-expired session isn't treated as a valid one on app startup.
function isTokenExpired(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function getToken() {
  const token = localStorage.getItem("onboardflow_token");
  if (!token) return null;
  if (isTokenExpired(token)) {
    // Stale session - don't let the app (or ProtectedRoute) treat this as
    // an authenticated user. Clear it so the next check is consistent too.
    logout();
    return null;
  }
  return token;
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("onboardflow_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
