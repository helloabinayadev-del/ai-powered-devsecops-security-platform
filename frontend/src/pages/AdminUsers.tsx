import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FaUserShield, FaUserCheck, FaUserSlash, FaUserCog } from "react-icons/fa";

interface UserItem {
  id: number;
  username: string;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/admin/users");
      setUsers(response.data);
    } catch (err: any) {
      setMessage("Failed to load user list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userItem: UserItem) => {
    try {
      setMessage("");
      const newStatus = !userItem.is_active;
      await api.patch(`/api/v1/admin/users/${userItem.id}/status`, {
        is_active: newStatus,
      });
      setMessage(`Updated ${userItem.username} status successfully`);
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Status update failed";
      setMessage(`Error: ${detail}`);
    }
  };

  const handleToggleRole = async (userItem: UserItem) => {
    try {
      setMessage("");
      const newRole = userItem.role.toUpperCase() === "ADMIN" ? "USER" : "ADMIN";
      await api.patch(`/api/v1/admin/users/${userItem.id}/role`, {
        role: newRole,
      });
      setMessage(`Updated ${userItem.username} role to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Role update failed";
      setMessage(`Error: ${detail}`);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <FaUserShield style={{ fontSize: 28, color: "#38bdf8" }} />
        <div>
          <h2 style={{ margin: 0, color: "var(--text-primary, #f8fafc)" }}>User Management</h2>
          <small style={{ color: "#94a3b8" }}>Platform Administration & Access Controls</small>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 20,
            borderRadius: 6,
            background: message.startsWith("Error") ? "#451a1a" : "#14532d",
            color: message.startsWith("Error") ? "#fca5a5" : "#86efac",
            border: "1px solid currentColor",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading users…</p>
      ) : (
        <div
          style={{
            background: "var(--card-bg, #1e293b)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            border: "1px solid var(--border-color, #334155)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              color: "var(--text-primary, #f8fafc)",
            }}
          >
            <thead>
              <tr style={{ background: "#0f172a", borderBottom: "1px solid #334155" }}>
                <th style={{ padding: "12px 16px" }}>ID</th>
                <th style={{ padding: "12px 16px" }}>Username</th>
                <th style={{ padding: "12px 16px" }}>Email</th>
                <th style={{ padding: "12px 16px" }}>Role</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "12px 16px" }}>#{u.id}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{u.email || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: u.role.toUpperCase() === "ADMIN" ? "#1e40af" : "#334155",
                        color: u.role.toUpperCase() === "ADMIN" ? "#93c5fd" : "#cbd5e1",
                      }}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: u.is_active ? "#14532d" : "#7f1d1d",
                        color: u.is_active ? "#86efac" : "#fca5a5",
                      }}
                    >
                      {u.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "Cannot deactivate yourself" : "Toggle Status"}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "none",
                          cursor: u.id === currentUser?.id ? "not-allowed" : "pointer",
                          background: u.is_active ? "#ef4444" : "#22c55e",
                          color: "white",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {u.is_active ? <FaUserSlash /> : <FaUserCheck />}
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "Cannot change your own role" : "Toggle Role"}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "1px solid #3b82f6",
                          background: "transparent",
                          color: "#3b82f6",
                          cursor: u.id === currentUser?.id ? "not-allowed" : "pointer",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FaUserCog />
                        {u.role.toUpperCase() === "ADMIN" ? "Make User" : "Make Admin"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
