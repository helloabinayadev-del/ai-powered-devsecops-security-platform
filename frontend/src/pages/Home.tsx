import { Link } from "react-router-dom";
import { FaShieldAlt, FaUpload, FaChartBar, FaFileAlt, FaRobot, FaHeartbeat, FaCog } from "react-icons/fa";

export default function Home() {
  return (
    <div className="enterprise-home" style={{ padding: "1.5rem" }}>
      <div className="card" style={{ padding: "2rem", borderRadius: "16px", background: "var(--bg-card)" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)", fontSize: "1.8rem" }}>
          <FaShieldAlt style={{ color: "#38bdf8" }} /> Welcome to AI-Powered DevSecOps Security Platform
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginTop: "10px", lineHeight: "1.6" }}>
          Unified automated static code analysis, vulnerability reasoning, AI threat intelligence, and continuous infrastructure health monitoring.
        </p>

        <hr style={{ borderColor: "var(--border-color)", margin: "24px 0" }} />

        <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Quick Launch Modules</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <Link to="/upload" className="card hover-lift" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", textDecoration: "none", color: "var(--text-primary)", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <FaUpload style={{ color: "#3b82f6", fontSize: "1.4rem" }} />
            <div>
              <strong>Upload & Scan Code</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>Bandit AST Static Analysis</small>
            </div>
          </Link>

          <Link to="/reports" className="card hover-lift" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", textDecoration: "none", color: "var(--text-primary)", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <FaFileAlt style={{ color: "#22c55e", fontSize: "1.4rem" }} />
            <div>
              <strong>Security Audit Reports</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>PDF / JSON / TXT Exports</small>
            </div>
          </Link>

          <Link to="/analytics" className="card hover-lift" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", textDecoration: "none", color: "var(--text-primary)", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <FaChartBar style={{ color: "#c084fc", fontSize: "1.4rem" }} />
            <div>
              <strong>Security Analytics</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>Vulnerability Trend Analysis</small>
            </div>
          </Link>

          <Link to="/ai-summary" className="card hover-lift" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", textDecoration: "none", color: "var(--text-primary)", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <FaRobot style={{ color: "#facc15", fontSize: "1.4rem" }} />
            <div>
              <strong>AI Intelligence Engine</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>Automated Executive Summaries</small>
            </div>
          </Link>

          <Link to="/health" className="card hover-lift" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", textDecoration: "none", color: "var(--text-primary)", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <FaHeartbeat style={{ color: "#ef4444", fontSize: "1.4rem" }} />
            <div>
              <strong>System Telemetry Health</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>Real-time SOC Monitoring</small>
            </div>
          </Link>

          <Link to="/settings" className="card hover-lift" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", textDecoration: "none", color: "var(--text-primary)", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <FaCog style={{ color: "#94a3b8", fontSize: "1.4rem" }} />
            <div>
              <strong>Platform Settings</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>Theme & Security Credentials</small>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}