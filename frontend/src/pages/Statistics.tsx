import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import SkeletonLoader from "../components/SkeletonLoader";
import { FaChartBar, FaSync, FaSearch, FaCheckCircle, FaExclamationTriangle, FaBug } from "react-icons/fa";
import "./Dashboard.css";

interface StatisticsData {
  total_scans: number;
  safe_files: number;
  risky_files: number;
  total_issues: number;
}

export default function Statistics() {
  const [stats, setStats] = useState<StatisticsData>({
    total_scans: 0,
    safe_files: 0,
    risky_files: 0,
    total_issues: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadStatistics = async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get("/api/v1/statistics/");
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadStatistics(false);
  }, []);

  return (
    <div className="enterprise-dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaChartBar style={{ color: "#10B981" }} /> Security Scan Statistics
          </h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0 0" }}>Live metrics and aggregate data from all security scans</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => loadStatistics(true)}
          disabled={refreshing || loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <FaSync className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      {loading ? (
        <SkeletonLoader type="card" count={4} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div className="card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.95rem" }}>Total Scans</span>
              <div style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaSearch size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>{stats.total_scans}</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "6px" }}>Cumulative files analyzed</p>
          </div>

          <div className="card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.95rem" }}>Safe Files</span>
              <div style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaCheckCircle size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: "#22c55e" }}>{stats.safe_files}</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "6px" }}>Files with zero vulnerabilities</p>
          </div>

          <div className="card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.95rem" }}>Risky Files</span>
              <div style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaExclamationTriangle size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: "#f59e0b" }}>{stats.risky_files}</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "6px" }}>Files requiring remediation</p>
          </div>

          <div className="card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.95rem" }}>Total Issues</span>
              <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaBug size={18} />
              </div>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: "#ef4444" }}>{stats.total_issues}</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "6px" }}>Vulnerabilities detected across code</p>
          </div>
        </div>
      )}
    </div>
  );
}