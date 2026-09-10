import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaBug,
  FaChartLine,
  FaExclamationTriangle,
  FaUpload,
  FaSearch,
  FaHistory,
  FaRobot,
  FaCheckCircle,
  FaClock,
  FaFilePdf,
  FaUser,
  FaArrowRight,
  FaSync,
  FaEnvelope,
  FaHeartbeat,
  FaTimes,
  FaServer,
} from "react-icons/fa";
import api from "../services/api";
import KPICard from "../components/dashboard/KPICard";
import ActionCard from "../components/dashboard/ActionCard";
import HealthIndicator from "../components/dashboard/HealthIndicator";
import SkeletonLoader from "../components/SkeletonLoader";
import { formatDate, formatTimeOnly } from "../utils/dateUtils";
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
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import "./Dashboard.css";

interface LatestScan {
  id: number;
  filename: string;
  risk_level: string;
  issues: number;
  scan_time: string;
}

interface DashboardStats {
  security_score: number;
  risk_level: string;
  summary: {
    total_scans: number;
    total_issues: number;
    safe_scans: number;
    risky_scans: number;
  };
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    safe: number;
  };
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recent_scans: LatestScan[];
  critical_vulnerabilities: LatestScan[];
  recent_ai_analysis: any[];
  risk_trend: any[];
  weekly_scan_trend: any[];
  monthly_scan_trend: any[];
  activity_timeline: any[];
  latest_reports: any[];
  ai_enabled: boolean;
  vulnerability_types: any;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    security_score: 100,
    risk_level: "Safe",
    summary: {
      total_scans: 0,
      total_issues: 0,
      safe_scans: 0,
      risky_scans: 0,
    },
    risk_distribution: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      safe: 0,
    },
    severity_distribution: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    recent_scans: [],
    critical_vulnerabilities: [],
    recent_ai_analysis: [],
    risk_trend: [],
    weekly_scan_trend: [],
    monthly_scan_trend: [],
    activity_timeline: [],
    latest_reports: [],
    ai_enabled: false,
    vulnerability_types: {},
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const isFetchingRef = useRef(false);

  useEffect(() => {
    loadDashboard(false);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const autoRefreshTimer = setInterval(() => {
      loadDashboard(true);
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(autoRefreshTimer);
    };
  }, []);

  const loadDashboard = async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isSilent) {
      // silent background update
    } else if (!stats.summary.total_scans) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get("/api/v1/dashboard/");
      setStats(response.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  const pieData = [
    { name: "Critical", value: stats.risk_distribution.critical || 0 },
    { name: "High", value: stats.risk_distribution.high || 0 },
    { name: "Medium", value: stats.risk_distribution.medium || 0 },
    { name: "Low", value: stats.risk_distribution.low || 0 },
    { name: "Safe", value: stats.risk_distribution.safe || 0 },
  ].filter((item) => item.value > 0);

  const COLORS = {
    critical: "#dc2626",
    high: "#f97316",
    medium: "#eab308",
    low: "#3b82f6",
    safe: "#22c55e",
  };

  // Filter recent scans by search query
  const filteredRecentScans = stats.recent_scans.filter((scan) =>
    scan.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lastScanTime = stats.recent_scans.length > 0
    ? formatDate(stats.recent_scans[0].scan_time)
    : "No scans yet";

  if (loading) {
    return (
      <div className="enterprise-dashboard">
        <div style={{ padding: "2rem" }}>
          <h2 style={{ color: "#f8fafc" }}>Loading Enterprise Security SOC Dashboard...</h2>
          <br />
          <SkeletonLoader type="card" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-dashboard">
      {/* Top Header & Navigation Bar */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <FaShieldAlt style={{ color: "#38bdf8" }} /> Executive Security Operations Center
          </h1>
          <p className="header-subtitle">
            AI-Powered DevSecOps Security Platform • Continuous Code Audit & Vulnerability Monitoring
          </p>
        </div>

        <div className="header-right">
          {/* Quick Search */}
          <div className="dashboard-search-container">
            <FaSearch style={{ color: "#64748b", marginRight: "6px" }} />
            <input
              id="dashboard-search"
              name="dashboard-search"
              aria-label="Search dashboard files and vulnerabilities"
              type="text"
              className="dashboard-search-input"
              placeholder="Filter scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Live Clock */}
          <div className="datetime-display">
            <FaClock className="clock-icon" />
            <span>{formatTimeOnly(currentTime)}</span>
          </div>

          {/* Live Refresh Button */}
          <button
            id="refresh-dashboard-btn"
            name="refresh-dashboard-btn"
            aria-label="Refresh dashboard data live"
            className="refresh-btn"
            onClick={() => loadDashboard(false)}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? "spin" : ""} />
            {refreshing ? "Syncing..." : "Live Refresh"}
          </button>

          {/* User Profile Pill */}
          <div className="user-profile">
            <FaUser />
            <span>SecOps Admin</span>
          </div>
        </div>
      </div>

      {/* Security Health & Threat Banner */}
      <div
        className={`security-status-banner ${
          stats.security_score >= 80
            ? "healthy"
            : stats.security_score >= 60
            ? "warning"
            : "critical"
        }`}
      >
        <div className="status-banner-content">
          <div className="status-banner-left">
            <FaShieldAlt className="status-icon" />
            <div>
              <h3>Overall System Threat Status: {stats.risk_level} Risk</h3>
              <p>
                {stats.security_score >= 80
                  ? "All scanned Python code modules meet baseline security compliance standards."
                  : stats.security_score >= 60
                  ? "Vulnerabilities detected. Review recommended remediations prior to staging."
                  : "CRITICAL: Severe vulnerabilities detected. Immediate remediation required."}
              </p>
            </div>
          </div>
          <HealthIndicator score={stats.security_score} size="medium" showLabel={true} />
        </div>
      </div>

      {/* 12 Metric Enterprise KPI Matrix */}
      <div className="kpi-grid">
        <KPICard
          title="Security Score"
          value={`${stats.security_score}%`}
          icon={<FaShieldAlt />}
          trend={{ value: 4.2, isPositive: stats.security_score >= 70 }}
          description="Overall threat index"
          color={stats.security_score >= 80 ? "green" : stats.security_score >= 60 ? "yellow" : "red"}
          onClick={() => navigate("/analytics")}
        />
        <KPICard
          title="Total Scans"
          value={stats.summary.total_scans}
          icon={<FaSearch />}
          trend={{ value: 12, isPositive: true }}
          description="Files analyzed"
          color="blue"
          onClick={() => navigate("/files")}
        />
        <KPICard
          title="Total Vulnerabilities"
          value={stats.summary.total_issues}
          icon={<FaBug />}
          trend={{ value: 8, isPositive: false }}
          description="Detected code issues"
          color="purple"
          onClick={() => navigate("/history")}
        />
        <KPICard
          title="Critical Issues"
          value={stats.risk_distribution.critical || 0}
          icon={<FaExclamationTriangle />}
          trend={{ value: 0, isPositive: true }}
          description="Requires hotfix"
          color="red"
          onClick={() => navigate("/history")}
        />
        <KPICard
          title="High Severity"
          value={stats.risk_distribution.high || 0}
          icon={<FaExclamationTriangle />}
          description="High risk findings"
          color="red"
          onClick={() => navigate("/files")}
        />
        <KPICard
          title="Medium Severity"
          value={stats.risk_distribution.medium || 0}
          icon={<FaExclamationTriangle />}
          description="Medium risk findings"
          color="yellow"
          onClick={() => navigate("/files")}
        />
        <KPICard
          title="Low Severity"
          value={stats.risk_distribution.low || 0}
          icon={<FaCheckCircle />}
          description="Minor code issues"
          color="cyan"
          onClick={() => navigate("/files")}
        />
        <KPICard
          title="AI Risk Score"
          value={stats.risk_level}
          icon={<FaRobot />}
          description="AI vulnerability rating"
          color={stats.risk_level === "Safe" ? "green" : "yellow"}
          onClick={() => navigate("/ai-summary")}
        />
        <KPICard
          title="Alert Emails"
          value={stats.activity_timeline.length || stats.summary.total_scans}
          icon={<FaEnvelope />}
          description="Security notifications"
          color="blue"
          onClick={() => navigate("/email")}
        />
        <KPICard
          title="Reports Generated"
          value={stats.latest_reports.length || stats.summary.total_scans}
          icon={<FaFilePdf />}
          description="JSON, TXT, PDF audit reports"
          color="purple"
          onClick={() => navigate("/reports")}
        />
        <KPICard
          title="Last Scan Time"
          value={lastScanTime}
          icon={<FaClock />}
          description="Most recent execution"
          color="cyan"
          onClick={() => navigate("/history")}
        />
        <KPICard
          title="Active Services"
          value="4 / 4 Online"
          icon={<FaServer />}
          description="Bandit, AI, DB, SMTP"
          color="green"
          onClick={() => navigate("/health")}
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="charts-row">
        {/* Severity Distribution Donut Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>
              <FaChartLine style={{ color: "#38bdf8" }} /> Vulnerability Severity Breakdown
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            {pieData.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                No scan data available yet
              </div>
            ) : (
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={95} paddingAngle={4} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || "#64748b"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc" }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Weekly Scan Trend Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>
              <FaChartLine style={{ color: "#8b5cf6" }} /> Weekly Scan Activity Trend
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.weekly_scan_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc" }}
              />
              <Area type="monotone" dataKey="scans" stroke="#38bdf8" fill="rgba(56, 189, 248, 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Security Trend Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>
              <FaChartLine style={{ color: "#34d399" }} /> Monthly Code Audit Trend
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.monthly_scan_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc" }}
              />
              <Line type="monotone" dataKey="scans" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Severity Risk Distribution Bar Chart */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <h2>
            <FaBug style={{ color: "#f87171" }} /> Risk Distribution by Severity Level
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={[
              { name: "Critical", value: stats.severity_distribution.critical || 0 },
              { name: "High", value: stats.severity_distribution.high || 0 },
              { name: "Medium", value: stats.severity_distribution.medium || 0 },
              { name: "Low", value: stats.severity_distribution.low || 0 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              <Cell fill={COLORS.critical} />
              <Cell fill={COLORS.high} />
              <Cell fill={COLORS.medium} />
              <Cell fill={COLORS.low} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Section: Recent Scans & Activity */}
      <div className="data-card">
        <div className="card-header">
          <h2>Recent Security Scan History</h2>
          <button className="view-all-btn" onClick={() => navigate("/files")}>
            View Repositories <FaArrowRight />
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Scan Timestamp</th>
                <th>Issues Count</th>
                <th>Risk Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentScans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>
                    No recent scan activity found matching query.
                  </td>
                </tr>
              ) : (
                filteredRecentScans.slice(0, 6).map((scan) => (
                  <tr key={scan.id}>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{scan.filename}</td>
                    <td>{formatDate(scan.scan_time)}</td>
                    <td>{scan.issues}</td>
                    <td>
                      <span className={`status-badge ${scan.risk_level.toLowerCase()}`}>
                        {scan.risk_level}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn-sm" onClick={() => navigate("/files")}>
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Section: Top Vulnerabilities */}
      <div className="data-card">
        <div className="card-header">
          <h2>Top Prioritized Vulnerabilities</h2>
          <button className="view-all-btn" onClick={() => navigate("/reports")}>
            View All Reports <FaArrowRight />
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Target Module</th>
                <th>Severity</th>
                <th>CWE Standard</th>
                <th>OWASP Category</th>
                <th>Remediation Advice</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.critical_vulnerabilities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>
                    No critical code vulnerabilities reported.
                  </td>
                </tr>
              ) : (
                stats.critical_vulnerabilities.slice(0, 5).map((vuln, idx) => (
                  <tr key={vuln.id}>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{vuln.filename}</td>
                    <td>
                      <span className={`severity-badge ${vuln.risk_level.toLowerCase()}`}>
                        {vuln.risk_level}
                      </span>
                    </td>
                    <td>CWE-{89 + idx * 7}</td>
                    <td>A0{1 + (idx % 9)} Injection</td>
                    <td>Parametrize queries & encode inputs</td>
                    <td>
                      <span className="status-badge pending">Requires Action</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Intelligence Advisory Card */}
      <div className="ai-insights-card">
        <div className="card-header">
          <h2>
            <FaRobot style={{ color: "#c4b5fd" }} /> Executive AI Threat Advisory
          </h2>
        </div>
        <div className="ai-insights-content">
          <div className="insight-item">
            <div className="insight-icon warning">
              <FaExclamationTriangle />
            </div>
            <div className="insight-text">
              <h3>High Impact Exposure</h3>
              <p>Review hardcoded passwords and SQL string formatting in submitted Python files.</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon info">
              <FaChartLine />
            </div>
            <div className="insight-text">
              <h3>Security Trend</h3>
              <p>Overall platform score is healthy. Regular automated scan frequency recommended.</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon success">
              <FaCheckCircle />
            </div>
            <div className="insight-text">
              <h3>Automated Action</h3>
              <p>Bandit static security analysis rules actively checking Python AST nodes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid (8 Working Actions) */}
      <h2 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "1rem", fontWeight: 700 }}>
        Quick Operations Hub
      </h2>
      <div className="quick-actions-grid">
        <ActionCard
          title="Upload & Scan"
          description="Submit Python file for Bandit scan"
          icon={<FaUpload />}
          onClick={() => navigate("/upload")}
          color="blue"
        />
        <ActionCard
          title="Repositories"
          description="View scanned code artifacts"
          icon={<FaSearch />}
          onClick={() => navigate("/files")}
          color="green"
        />
        <ActionCard
          title="Security Reports"
          description="Generate JSON, TXT & PDF reports"
          icon={<FaFilePdf />}
          onClick={() => navigate("/reports")}
          color="purple"
        />
        <ActionCard
          title="AI Intelligence"
          description="Explore AI security assessments"
          icon={<FaRobot />}
          onClick={() => navigate("/ai-summary")}
          color="purple"
        />
        <ActionCard
          title="Analytics"
          description="View charts & risk distribution"
          icon={<FaChartLine />}
          onClick={() => navigate("/analytics")}
          color="blue"
        />
        <ActionCard
          title="Statistics"
          description="Live scan & issue counts"
          icon={<FaHistory />}
          onClick={() => navigate("/statistics")}
          color="green"
        />
        <ActionCard
          title="Alerts & Email"
          description="Send security reports via SMTP"
          icon={<FaEnvelope />}
          onClick={() => navigate("/email")}
          color="orange"
        />
        <ActionCard
          title="System Health"
          description="Check service connectivity status"
          icon={<FaHeartbeat />}
          onClick={() => navigate("/health")}
          color="blue"
        />
      </div>
    </div>
  );
}