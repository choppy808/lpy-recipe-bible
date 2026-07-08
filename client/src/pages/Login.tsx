import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      toast({ title: "Login failed", description: "Invalid username or password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: "#f0ebe1", minHeight: "100vh" }}
      className="flex items-center justify-center"
    >
      <div className="w-full max-w-sm mx-4">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="Lao Peng You">
              <rect width="36" height="36" rx="4" fill="#014643"/>
              <text x="18" y="25" textAnchor="middle" fill="#f0ebe1" fontSize="18" fontFamily="serif" fontWeight="bold">老</text>
            </svg>
            <div>
              <div style={{ color: "#014643", fontFamily: "DM Serif Display, serif", fontSize: "1.4rem", lineHeight: 1 }}>
                Lao Peng You
              </div>
              <div style={{ color: "#b8892a", fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem", letterSpacing: "0.12em" }}>
                RECIPE BIBLE
              </div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div
          style={{ backgroundColor: "#faf7f2", border: "1px solid #e2d9c8", borderRadius: "8px" }}
          className="p-8 shadow-sm"
        >
          <h2 style={{ color: "#014643", fontFamily: "DM Serif Display, serif", fontSize: "1.25rem" }} className="mb-6">
            Sign in
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                style={{ color: "#4a4035", fontFamily: "DM Sans, sans-serif", fontSize: "0.8rem", letterSpacing: "0.08em" }}
                className="block mb-1 uppercase"
              >
                Username
              </label>
              <input
                data-testid="input-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: "100%", padding: "0.6rem 0.75rem",
                  border: "1px solid #c8bfaf", borderRadius: "4px",
                  backgroundColor: "#f0ebe1", color: "#2c2418",
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                style={{ color: "#4a4035", fontFamily: "DM Sans, sans-serif", fontSize: "0.8rem", letterSpacing: "0.08em" }}
                className="block mb-1 uppercase"
              >
                Password
              </label>
              <input
                data-testid="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "0.6rem 0.75rem",
                  border: "1px solid #c8bfaf", borderRadius: "4px",
                  backgroundColor: "#f0ebe1", color: "#2c2418",
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>
            <button
              data-testid="button-login"
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "0.65rem",
                backgroundColor: loading ? "#4a7a77" : "#014643",
                color: "#f0ebe1", border: "none", borderRadius: "4px",
                fontFamily: "DM Sans, sans-serif", fontSize: "0.9rem",
                letterSpacing: "0.06em", cursor: loading ? "not-allowed" : "pointer",
                marginTop: "0.5rem",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
