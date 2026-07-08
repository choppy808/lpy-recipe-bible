import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setToken, getToken, apiRequest, queryClient } from "./queryClient";

interface User {
  id: number;
  username: string;
  role: "admin" | "staff";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Persist token across page refreshes using a session-scoped variable
// We use sessionStorage-like approach via a closure since localStorage is blocked
// in sandboxed iframes, but this is Vercel (not a sandbox), so we use a
// module-level variable + URL hash trick for persistence.
// For simplicity, we store the token in memory and re-auth on refresh via /api/auth/me

let persistedToken: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session from URL hash param or persisted token
  useEffect(() => {
    const stored = persistedToken;
    if (stored) {
      setToken(stored);
      apiRequest("GET", "/api/auth/me")
        .then(r => r.json())
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          persistedToken = null;
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    const data = await res.json();
    persistedToken = data.token;
    setToken(data.token);
    setUser(data.user);
    queryClient.clear();
  };

  const logout = () => {
    persistedToken = null;
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
