import { createContext, useState } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  getToken,
  getCurrentUser,
} from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [user, setUser] = useState(() => getCurrentUser());

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    setUser({ email: data.email, fullName: data.fullName, role: data.role });
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    logoutRequest();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
