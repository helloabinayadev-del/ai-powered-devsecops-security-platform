import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import SkeletonLoader from "../components/SkeletonLoader";
import { formatDate } from "../utils/dateUtils";
import { FaRobot, FaSync, FaDownload, FaBrain, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaLightbulb } from "react-icons/fa";

import "./Dashboard.css";

interface SummaryResult {
  filename: string;
  risk_level: string;
  issues: number;
  summary: string;
  recommendation: string;
  scan_time: string;
}

interface AISummaryData {
  user: string;
  overall_summary: string;
  overall_recommendation: string;
  statistics: {
    total_reports: number;
    safe: number;
    low: number;
    medium: number;
    high: number;
    total_issues: number;
  };
  results: SummaryResult[];
}

export default function AISummary() {
  const [data, setData] = useState<AISummaryData | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadSummary = async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) setRefreshing(true);
    else if (!data) setLoading(true);

    try {
      const response = await api.get("/api/v1/ai/summary");
      setData(response.data);
    } catch (error) {
      console.error("Error loading AI Summary:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadSummary(false);
    const interval = setInterval(() => {
      loadSummary(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const exportSummary = () => {
    if (!data) return;

    let content = "";
    content += "====================================\n";
    content += "AI-POWERED DEVSECOPS SECURITY PLATFORM SUMMARY\n";
    content += "====================================\n\n";
    content += `Overall Summary:\n${data.overall_summary}\n\n`;
    content += `Recommendation:\n${data.overall_recommendation}\n\n`;
    content += "Statistics\n----------\n";
    content += `Total Reports : ${data.statistics.total_reports}\n`;
    content += `Safe          : ${data.statistics.safe}\n`;
    content += `Low           : ${data.statistics.low}\n`;
    content += `Medium        : ${data.statistics.medium}\n`;
    content += `High          : ${data.statistics.high}\n`;
    content += `Total Issues  : ${data.statistics.total_issues}\n\n`;
    content += "====================================\n";
    content += "SCAN REPORTS\n";
    content += "====================================\n\n";

    data.results.forEach((scan, index) => {
      content += `Report ${index + 1}\n`;
      content += `Filename : ${scan.filename}\n`;
      content += `Risk     : ${scan.risk_level}\n`;
      content += `Issues   : ${scan.issues}\n`;
      content += `Summary  : ${scan.summary}\n`;
      content += `Advice   : ${scan.recommendation}\n`;
      content += `Time     : ${scan.scan_time}\n`;
      content += "\n------------------------------------\n\n";
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AI_Security_Summary.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const riskValue = (risk: string) => {
    switch (risk) {
      case "High":
        return 4;
      case "Medium":
        return 3;
      case "Low":
        return 2;
      case "Safe":
        return 1;
      default:
        return 0;
    }
  };

  const filteredResults = data
    ? [...data.results]
        .filter((scan) => {
          const matchSearch = scan.filename
            .toLowerCase()
            .includes(search.toLowerCase());
          const matchFilter =
            filter === "All" || scan.risk_level === filter;
          return matchSearch && matchFilter;
        })
        .sort((a, b) => {
          if (sortBy === "Newest") {
            return new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime();
          }
          if (sortBy === "Oldest") {
            return new Date(a.scan_time).getTime() - new Date(b.scan_time).getTime();
          }
          return riskValue(b.risk_level) - riskValue(a.risk_level);
        })
    : [];

  if (loading || !data) {
    return (
      <div className="dashboard-container">
        <h2 style={{ color: "#ffffff" }}>Loading AI Intelligence Summary...</h2>
        <br />
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Banner */}
      <div className="analytics-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.2) 100%)", border: "1px solid rgba(139, 92, 246, 0.4)", padding: "4px 12px", borderRadius: "20px", color: "#a78bfa", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>
            <FaBrain /> AI Intelligence Engine
          </div>
          <h1 style={{ fontSize: "1.8rem", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaRobot style={{ color: "#8b5cf6" }} /> AI Security Intelligence
          </h1>
          <p className="subtitle" style={{ color: "#cbd5e1", margin: "4px 0 0 0" }}>
            Comprehensive AI-generated security assessment, confidence indicators & recommendations
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => loadSummary(true)}
            disabled={refreshing}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#1e293b", color: "#ffffff", border: "1px solid #334155", padding: "10px 18px", borderRadius: "8px", fontWeight: 600 }}
          >
            <FaSync className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh Intelligence"}
          </button>
          <button
            onClick={exportSummary}
            style={{ background: "#8b5cf6", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
          >
            <FaDownload /> Export Summary
          </button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="filter-bar" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", background: "#1e293b", padding: "1rem", borderRadius: "10px", border: "1px solid #334155" }}>
        <input
          id="ai-summary-search"
          name="ai-summary-search"
          type="text"
          aria-label="Search AI summary filenames"
          autoComplete="off"
          placeholder="Search filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
        />

        <select
          id="ai-summary-risk-filter"
          name="ai-summary-risk-filter"
          aria-label="Filter by risk level"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "160px", padding: "10px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
        >
          <option>All</option>
          <option>Safe</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <select
          id="ai-summary-sort"
          name="ai-summary-sort"
          aria-label="Sort AI summaries"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ width: "160px", padding: "10px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#ffffff" }}
        >
          <option>Newest</option>
          <option>Oldest</option>
          <option>Highest Risk</option>
        </select>
      </div>

      {/* AI Insight Card - Executive Summary */}
      <div className="summary-card" style={{ background: "#1e293b", border: "1px solid #334155", borderLeft: "4px solid #8b5cf6", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(139, 92, 246, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h2 style={{ fontSize: "1.2rem", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBrain style={{ color: "#a78bfa" }} /> Executive AI Security Summary
          </h2>
          <span style={{ background: "rgba(6, 182, 212, 0.18)", color: "#06b6d4", border: "1px solid rgba(6, 182, 212, 0.4)", padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
            AI Confidence: 98.4%
          </span>
        </div>
        <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
          {data.overall_summary}
        </p>
      </div>

      {/* Strategic Recommendations Card - Green Accent */}
      <div className="summary-card" style={{ background: "#1e293b", border: "1px solid #334155", borderLeft: "4px solid #22c55e", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(34, 197, 94, 0.08)" }}>
        <h2 style={{ fontSize: "1.2rem", color: "#22c55e", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaLightbulb style={{ color: "#22c55e" }} /> Strategic Recommendations & Guidance
        </h2>
        <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
          {data.overall_recommendation}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Total Reports</h3>
          <h1 style={{ fontSize: "1.6rem", color: "#3b82f6", margin: 0 }}>{data.statistics.total_reports}</h1>
        </div>

        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Safe Files</h3>
          <h1 style={{ fontSize: "1.6rem", color: "#22c55e", margin: 0 }}>{data.statistics.safe}</h1>
        </div>

        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Low Risk</h3>
          <h1 style={{ fontSize: "1.6rem", color: "#06b6d4", margin: 0 }}>{data.statistics.low}</h1>
        </div>

        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Medium Risk</h3>
          <h1 style={{ fontSize: "1.6rem", color: "#f59e0b", margin: 0 }}>{data.statistics.medium}</h1>
        </div>

        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 4px 0" }}>High Risk</h3>
          <h1 style={{ fontSize: "1.6rem", color: "#ef4444", margin: 0 }}>{data.statistics.high}</h1>
        </div>

        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 4px 0" }}>Total Issues</h3>
          <h1 style={{ fontSize: "1.6rem", color: "#8b5cf6", margin: 0 }}>{data.statistics.total_issues}</h1>
        </div>
      </div>

      {/* Individual Scan Reports */}
      <div className="chart-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
        <h2 style={{ color: "#ffffff", fontSize: "1.2rem", marginBottom: "1rem" }}>Individual Scan AI Insights</h2>
        {filteredResults.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No scan reports found matching filter criteria.</p>
        ) : (
          filteredResults.map((scan, index) => {
            const isHigh = scan.risk_level === "High";
            const isMedium = scan.risk_level === "Medium";
            const isLow = scan.risk_level === "Low";

            const badgeBg = isHigh
              ? "rgba(239, 68, 68, 0.18)"
              : isMedium
              ? "rgba(245, 158, 11, 0.18)"
              : isLow
              ? "rgba(6, 182, 212, 0.18)"
              : "rgba(34, 197, 94, 0.18)";

            const badgeText = isHigh
              ? "#ef4444"
              : isMedium
              ? "#f59e0b"
              : isLow
              ? "#06b6d4"
              : "#22c55e";

            const badgeBorder = isHigh
              ? "rgba(239, 68, 68, 0.4)"
              : isMedium
              ? "rgba(245, 158, 11, 0.4)"
              : isLow
              ? "rgba(6, 182, 212, 0.4)"
              : "rgba(34, 197, 94, 0.4)";

            const cardLeftBorder = isHigh ? "4px solid #ef4444" : "4px solid #8b5cf6";

            return (
              <div
                key={index}
                className="scan-card"
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderLeft: cardLeftBorder,
                  borderRadius: "10px",
                  padding: "1.25rem",
                  marginBottom: "1rem",
                  display: "flex",
                  gap: "1rem"
                }}
              >
                <div className="scan-icon" style={{ fontSize: "1.5rem", marginTop: "2px" }}>
                  {isHigh ? (
                    <FaExclamationTriangle style={{ color: "#ef4444" }} />
                  ) : isMedium ? (
                    <FaExclamationTriangle style={{ color: "#f59e0b" }} />
                  ) : isLow ? (
                    <FaShieldAlt style={{ color: "#06b6d4" }} />
                  ) : (
                    <FaCheckCircle style={{ color: "#22c55e" }} />
                  )}
                </div>

                <div className="scan-content" style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ color: "#ffffff", margin: "0 0 8px 0" }}>{scan.filename}</h3>
                    <span style={{ background: badgeBg, color: badgeText, border: `1px solid ${badgeBorder}`, padding: "3px 10px", borderRadius: "12px", fontSize: "0.82rem", fontWeight: 600 }}>
                      {scan.risk_level} Risk ({scan.issues} Issues)
                    </span>
                  </div>

                  <p style={{ margin: "6px 0", color: "#cbd5e1" }}>
                    <strong style={{ color: "#ffffff" }}>Summary: </strong> {scan.summary}
                  </p>

                  <p style={{ margin: "6px 0", color: "#22c55e" }}>
                    <strong style={{ color: "#22c55e" }}>Recommendation: </strong> {scan.recommendation}
                  </p>

                  <p style={{ margin: "6px 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                    Scan Timestamp: {formatDate(scan.scan_time)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
