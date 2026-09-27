import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import AddCandidate from "./pages/AddCandidate";
import CandidateDetails from "./pages/CandidateDetails";
import Onboarding from "./pages/Onboarding";
import Documents from "./pages/Documents";
import Joining from "./pages/Joining";
import Induction from "./pages/Induction";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CandidatePortal from "./pages/CandidatePortal";
import NotFound from "./pages/NotFound";

// Sends a logged-in user to the home page for their role.
function RoleHome() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "CANDIDATE" ? "/portal" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Candidate self-registration has been removed - candidates are
                provisioned by HR (Candidates -> Create Portal Access). */}
            <Route path="/" element={<RoleHome />} />

            {/* Candidate/Employee portal */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/portal" element={<CandidatePortal />} />
            </Route>

            {/* HR-only workspace */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["HR"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/candidates/new" element={<AddCandidate />} />
              <Route path="/candidates/:id" element={<CandidateDetails />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/onboarding/:id/documents" element={<Documents />} />
              <Route path="/onboarding/:id/joining" element={<Joining />} />
              <Route path="/onboarding/:id/induction" element={<Induction />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/joining" element={<Joining />} />
              <Route path="/induction" element={<Induction />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
