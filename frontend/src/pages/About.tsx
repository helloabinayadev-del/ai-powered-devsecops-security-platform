import { FaShieldAlt, FaCode, FaCheckCircle, FaLock } from "react-icons/fa";

export default function About() {
  return (
    <div className="enterprise-about" style={{ padding: "1.5rem" }}>
      <div className="card" style={{ padding: "2rem", borderRadius: "16px", background: "var(--bg-card)" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)", fontSize: "1.8rem" }}>
          <FaShieldAlt style={{ color: "#38bdf8" }} /> About AI-Powered DevSecOps Security Platform
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginTop: "8px" }}>
          Enterprise Static Analysis Security Testing (SAST) & Threat Intelligence Platform v1.0.0
        </p>

        <hr style={{ borderColor: "var(--border-color)", margin: "24px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div className="setting-card" style={{ flexDirection: "column", alignItems: "flex-start", padding: "20px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)", fontSize: "1.1rem" }}>
              <FaCode style={{ color: "#3b82f6" }} /> Technology Stack
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0 0", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.8" }}>
              <li><strong>Frontend:</strong> React 19 + TypeScript + Vite</li>
              <li><strong>Backend Engine:</strong> FastAPI + Python 3.10</li>
              <li><strong>Security Audit:</strong> Bandit AST Static Analyzer</li>
              <li><strong>Database:</strong> SQLite / PostgreSQL ORM</li>
            </ul>
          </div>

          <div className="setting-card" style={{ flexDirection: "column", alignItems: "flex-start", padding: "20px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)", fontSize: "1.1rem" }}>
              <FaLock style={{ color: "#22c55e" }} /> Core Security Capabilities
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0 0", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.8" }}>
              <li><FaCheckCircle style={{ color: "#22c55e", marginRight: "6px" }} /> JWT Token Authentication & Salt Hashing</li>
              <li><FaCheckCircle style={{ color: "#22c55e", marginRight: "6px" }} /> Multi-file Upload Validation & Storage Isolation</li>
              <li><FaCheckCircle style={{ color: "#22c55e", marginRight: "6px" }} /> Real-Time Health Telemetry Monitoring</li>
              <li><FaCheckCircle style={{ color: "#22c55e", marginRight: "6px" }} /> High-Contrast Cybersecurity Theme Palette</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}