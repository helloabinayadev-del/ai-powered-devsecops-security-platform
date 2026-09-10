import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import SkeletonLoader from "../components/SkeletonLoader";
import { FaSync } from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import "./Dashboard.css";

interface AnalyticsData {
  security_score: number;
  summary: {
    total_scans: number;
    total_issues: number;
    average_issues_per_scan: number;
  };
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    safe: number;
  };
  recommendations: string[];
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const loadAnalytics = async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) setRefreshing(true);
    else if (!data) setLoading(true);

    try {
      const response = await api.get("/api/v1/analytics/");
      setData(response.data);
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadAnalytics(false);
    const interval = setInterval(() => {
      loadAnalytics(false);
    }, 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const pieData = [
    {
      name: "Critical",
      value: data?.risk_distribution.critical || 0,
    },
    {
      name: "High",
      value: data?.risk_distribution.high || 0,
    },
    {
      name: "Medium",
      value: data?.risk_distribution.medium || 0,
    },
    {
      name: "Low",
      value: data?.risk_distribution.low || 0,
    },
    {
      name: "Safe",
      value: data?.risk_distribution.safe || 0,
    },
  ].filter(i => i.value > 0);

  const COLORS = [
    "#dc2626",
    "#f97316",
    "#eab308",
    "#3b82f6",
    "#22c55e",
  ];

  const barData = [
    {
      name: "Critical",
      value: data?.risk_distribution.critical || 0,
    },
    {
      name: "High",
      value: data?.risk_distribution.high || 0,
    },
    {
      name: "Medium",
      value: data?.risk_distribution.medium || 0,
    },
    {
      name: "Low",
      value: data?.risk_distribution.low || 0,
    },
    {
      name: "Safe",
      value: data?.risk_distribution.safe || 0,
    },
  ];

  if (loading || !data) {
    return (
      <div className="dashboard-container">
        <h2>Loading Analytics...</h2>
        <br />
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="analytics-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", color: "#06B6D4", margin: 0 }}>Security Analytics Dashboard</h1>
          <p className="subtitle" style={{ color: "#94a3b8", margin: "4px 0 0 0" }}>
            AI-powered Security Insights & Threat Breakdown
          </p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <FaSync className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh Analytics"}
        </button>
      </div>

      {/* Security Score */}
      <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#94a3b8", margin: "0 0 8px 0" }}>Overall Security Health Score</h3>
        <h1 style={{ fontSize: "2.5rem", color: data.security_score >= 80 ? "#22c55e" : data.security_score >= 60 ? "#eab308" : "#ef4444", margin: 0 }}>
          {data.security_score}%
        </h1>
      </div>

      {/* Summary */}
      <div className="dashboard-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.25rem" }}>
          <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 6px 0" }}>Total Scans</h3>
          <h1 style={{ fontSize: "1.8rem", color: "#3b82f6", margin: 0 }}>{data.summary.total_scans}</h1>
        </div>

        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.25rem" }}>
          <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 6px 0" }}>Total Issues</h3>
          <h1 style={{ fontSize: "1.8rem", color: "#ef4444", margin: 0 }}>{data.summary.total_issues}</h1>
        </div>

        <div className="dashboard-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.25rem" }}>
          <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 6px 0" }}>Average Issues / Scan</h3>
          <h1 style={{ fontSize: "1.8rem", color: "#f59e0b", margin: 0 }}>
            {data.summary.average_issues_per_scan}
          </h1>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="chart-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
          <h2 style={{ color: "#f8fafc", fontSize: "1.2rem", marginBottom: "1rem" }}>Risk Distribution Share</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={90}
                label
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
          <h2 style={{ color: "#f8fafc", fontSize: "1.2rem", marginBottom: "1rem" }}>Severity Level Counts</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="chart-card" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.5rem" }}>
        <h2 style={{ color: "#f8fafc", fontSize: "1.2rem", marginBottom: "1rem" }}>🤖 AI Security Recommendations</h2>
        <div className="recommendation-list">
          {data.recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="recommendation-card"
              style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "1rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div className="recommendation-icon" style={{ fontSize: "1.3rem" }}>🛡️</div>
              <div className="recommendation-text" style={{ color: "#cbd5e1" }}>
                {recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
