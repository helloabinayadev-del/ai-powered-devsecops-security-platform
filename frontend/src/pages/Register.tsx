import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setMessage("❌ Username and password are required");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");
      const response = await api.post("/api/v1/auth/register", {
        username: username.trim(),
        email: email.trim() || undefined,
        password,
      });

      if (response.data.access_token) {
        login(response.data.access_token, response.data.user);
        navigate("/dashboard");
      } else {
        setMessage("✅ Account created! Please log in.");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Registration failed";
      setMessage(`❌ ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      <form
        onSubmit={handleRegister}
        style={{
          width: 400,
          background: "#1e293b",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          border: "1px solid #334155",
        }}
      >
        <h2 style={{ textAlign: "center", margin: 0, fontSize: 24, color: "#38bdf8" }}>
          AI-Powered DevSecOps Security Platform
        </h2>
        <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: 20 }}>
          Create New Account
        </p>

        <label style={{ fontSize: 14, color: "#cbd5e1" }}>Username</label>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
            marginBottom: 15,
            boxSizing: "border-box",
            border: "1px solid #475569",
            borderRadius: 6,
            background: "#0f172a",
            color: "#fff",
          }}
        />

        <label style={{ fontSize: 14, color: "#cbd5e1" }}>Email (Optional)</label>
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
            marginBottom: 15,
            boxSizing: "border-box",
            border: "1px solid #475569",
            borderRadius: 6,
            background: "#0f172a",
            color: "#fff",
          }}
        />

        <label style={{ fontSize: 14, color: "#cbd5e1" }}>Password</label>
        <input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
            marginBottom: 15,
            boxSizing: "border-box",
            border: "1px solid #475569",
            borderRadius: 6,
            background: "#0f172a",
            color: "#fff",
          }}
        />

        <label style={{ fontSize: 14, color: "#cbd5e1" }}>Confirm Password</label>
        <input
          type="password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
            marginBottom: 15,
            boxSizing: "border-box",
            border: "1px solid #475569",
            borderRadius: 6,
            background: "#0f172a",
            color: "#fff",
          }}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 10,
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {isSubmitting ? "Creating Account…" : "Register"}
        </button>

        {message && (
          <p
            style={{
              textAlign: "center",
              marginTop: 15,
              color: message.startsWith("❌") ? "#f87171" : "#4ade80",
              fontSize: 14,
            }}
          >
            {message}
          </p>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#94a3b8" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "#38bdf8", textDecoration: "none" }}>
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
