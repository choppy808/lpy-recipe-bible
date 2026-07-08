import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  role: string;
  created_at: number;
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"staff" | "admin">("staff");
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUser = useMutation({
    mutationFn: (data: { username: string; password: string; role: string }) =>
      apiRequest("POST", "/api/users", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setNewUsername(""); setNewPassword(""); setNewRole("staff");
      toast({ title: "User created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetPw = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      apiRequest("PATCH", `/api/users/${id}/password`, { password }).then(r => r.json()),
    onSuccess: () => {
      setResetId(null); setResetPassword("");
      toast({ title: "Password updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const label = {
    color: "#4a4035", fontFamily: "DM Sans, sans-serif",
    fontSize: "0.75rem", letterSpacing: "0.08em",
  };
  const input = {
    padding: "0.5rem 0.7rem", border: "1px solid #c8bfaf",
    borderRadius: "4px", backgroundColor: "#f0ebe1",
    color: "#2c2418", fontFamily: "DM Sans, sans-serif",
    fontSize: "0.9rem", outline: "none",
  };
  const btn = (color = "#014643") => ({
    padding: "0.45rem 1rem", backgroundColor: color,
    color: "#f0ebe1", border: "none", borderRadius: "4px",
    fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem",
    cursor: "pointer",
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "680px" }}>
      <h1 style={{ color: "#014643", fontFamily: "DM Serif Display, serif", fontSize: "1.5rem", marginBottom: "2rem" }}>
        Team Members
      </h1>

      {/* Add user form */}
      <div style={{ backgroundColor: "#faf7f2", border: "1px solid #e2d9c8", borderRadius: "6px", padding: "1.25rem", marginBottom: "2rem" }}>
        <h2 style={{ color: "#014643", fontFamily: "DM Serif Display, serif", fontSize: "1rem", marginBottom: "1rem" }}>Add Member</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <div style={label} className="mb-1 uppercase">Username</div>
            <input data-testid="input-new-username" style={{ ...input, width: "160px" }} value={newUsername} onChange={e => setNewUsername(e.target.value)} />
          </div>
          <div>
            <div style={label} className="mb-1 uppercase">Password</div>
            <input data-testid="input-new-password" type="password" style={{ ...input, width: "160px" }} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <div style={label} className="mb-1 uppercase">Role</div>
            <select data-testid="select-new-role" style={{ ...input, width: "110px" }} value={newRole} onChange={e => setNewRole(e.target.value as any)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            data-testid="button-add-user"
            style={btn()}
            disabled={createUser.isPending || !newUsername || !newPassword}
            onClick={() => createUser.mutate({ username: newUsername, password: newPassword, role: newRole })}
          >
            {createUser.isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {/* User list */}
      {isLoading ? (
        <p style={{ color: "#6b5f4f", fontFamily: "DM Sans, sans-serif" }}>Loading…</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} style={{ backgroundColor: "#faf7f2", border: "1px solid #e2d9c8", borderRadius: "6px", padding: "0.9rem 1.1rem" }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span style={{ color: "#014643", fontFamily: "DM Serif Display, serif", fontSize: "1rem" }}>{u.username}</span>
                  <span style={{ marginLeft: "0.6rem", color: "#b8892a", fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {u.role}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    data-testid={`button-reset-pw-${u.id}`}
                    style={btn("#6b5f4f")}
                    onClick={() => { setResetId(u.id); setResetPassword(""); }}
                  >
                    Reset Password
                  </button>
                  {u.username !== me?.username && (
                    <button
                      data-testid={`button-delete-user-${u.id}`}
                      style={btn("#8b2c2c")}
                      disabled={deleteUser.isPending}
                      onClick={() => {
                        if (confirm(`Remove ${u.username}?`)) deleteUser.mutate(u.id);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Inline password reset */}
              {resetId === u.id && (
                <div className="flex gap-2 mt-3 items-center">
                  <input
                    data-testid={`input-reset-pw-${u.id}`}
                    type="password"
                    placeholder="New password"
                    style={{ ...input, width: "200px" }}
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                  />
                  <button
                    data-testid={`button-confirm-reset-${u.id}`}
                    style={btn()}
                    disabled={resetPw.isPending || !resetPassword}
                    onClick={() => resetPw.mutate({ id: u.id, password: resetPassword })}
                  >
                    {resetPw.isPending ? "Saving…" : "Save"}
                  </button>
                  <button style={{ ...btn("#6b5f4f") }} onClick={() => setResetId(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
