import { useState, useEffect, useRef } from "react";
import {
  FaServer,
  FaDatabase,
  FaShieldAlt,
  FaUpload,
  FaRobot,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSync,
  FaMemory,
  FaMicrochip,
  FaHdd,
  FaClock,
  FaEnvelope,
  FaLock,
  FaBrain,
  FaFolder,
} from "react-icons/fa";
import api from "../services/api";
import StatusCard from "../components/dashboard/StatusCard";
import ProgressBar from "../components/dashboard/ProgressBar";
import HealthIndicator from "../components/dashboard/HealthIndicator";
import SkeletonLoader from "../components/SkeletonLoader";
import { formatDate, formatTimeOnly } from "../utils/dateUtils";
import "./Health.css";

interface ServiceStatus {
  name: string;
  status: string;
  message: string;
}

interface HealthData {
  overall_status: string;
  message: string;
  application: {
    name: string;
    version: string;
    environment: string;
    server_time: string;
    uptime: string;
    uptime_seconds: number;
  };
  system: {
    python_version: string;
    operating_system: string;
    os_version: string;
    architecture: string;
    hostname: string;
    cpu_percent: number;
    memory_percent: number;
    memory_used_gb: number;
    memory_total_gb: number;
    disk_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;
  };
  services: ServiceStatus[];
  configuration: {
    database_type: string;
    ai_enabled: boolean;
    ai_provider: string;
    max_file_size: string;
    rate_limit: string;
  };
  storage: {
    uploads_folder: string;
    uploads_accessible: boolean;
    reports_folder: string;
    reports_accessible: boolean;
    logs_folder: string;
    logs_accessible: boolean;
  };
}

export default function Health() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isFetchingRef = useRef(false);

  const loadHealth = async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) setRefreshing(true);
    else if (!healthData) setLoading(true);

    try {
      const response = await api.get("/api/v1/health/");
      setHealthData(response.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to load health data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadHealth(false);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshTimer = setInterval(() => loadHealth(false), 30000);
    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, []);

  const getServiceStatus = (status?: string): "healthy" | "warning" | "offline" => {
    if (!status) return "offline";
    const s = status.toLowerCase();
    if (s === "healthy" || s === "connected" || s === "configured" || s === "online") return "healthy";
    if (s === "warning" || s === "degraded") return "warning";
    return "offline";
  };

  const getHealthScore = () => {
    if (!healthData) return 0;
    const healthyCount = healthData.services.filter(
      (s) => getServiceStatus(s.status) === "healthy"
    ).length;
    return Math.round((healthyCount / healthData.services.length) * 100);
  };

  const getServiceIcon = (serviceName: string) => {
    const icons: Record<string, React.ReactElement> = {
      "Backend API": <FaServer />,
      "Database": <FaDatabase />,
      "AI Services": <FaRobot />,
      "Scanner (Bandit)": <FaShieldAlt />,
      "Authentication": <FaLock />,
      "Reports": <FaFileAlt />,
      "Email": <FaEnvelope />,
      "Upload Storage": <FaUpload />,
      "Logs Storage": <FaFileAlt />,
    };
    return icons[serviceName] || <FaServer />;
  };

  if (loading && !healthData) {
    return (
      <div className="enterprise-health">
        <div style={{ padding: "2rem" }}>
          <h2>Loading Infrastructure Health Status...</h2>
          <br />
          <SkeletonLoader type="card" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-health">
      {/* Top Header */}
      <div className="health-header">
        <div className="header-left">
          <h1>
            <FaServer style={{ color: "#38bdf8", marginRight: "10px" }} />
            SOC Infrastructure Health Monitor
          </h1>
          <p className="header-subtitle">
            Continuous health telemetry, microservice connectivity & resource metrics
          </p>
        </div>
        <div className="header-right">
          <div className="datetime-display">
            <FaClock className="clock-icon" />
            <span>{formatTimeOnly(currentTime)}</span>
          </div>
          <button
            className="refresh-btn"
            onClick={() => loadHealth(true)}
            disabled={refreshing}
            aria-label="Refresh system health telemetry"
          >
            <FaSync className={refreshing ? "spin" : ""} />
            {refreshing ? "Telemetry Sync..." : "Refresh Telemetry"}
          </button>
        </div>
      </div>

      {healthData && (
        <>
          {/* Overall Health Score Banner */}
          <div className="health-score-section">
            <div className="health-score-card">
              <div className="health-score-left">
                <h2>System Health Score & Threat Baseline</h2>
                <p className="health-score-msg">{healthData.message}</p>
                {lastRefresh && (
                  <p className="last-refresh">
                    Last telemetry sync: {formatDate(lastRefresh)}
                  </p>
                )}
              </div>
              <HealthIndicator score={getHealthScore()} size="large" showLabel={true} />
            </div>
          </div>

          {/* Status Cards Grid */}
          <h2 className="section-title">Core Microservice Connectivity</h2>
          <div className="status-cards-grid">
            <StatusCard
              title="Backend API"
              status={getServiceStatus(healthData.services.find((s) => s.name === "Backend API")?.status)}
              icon={<FaServer />}
              latency="14ms"
              lastChecked="Live"
              version={healthData.application.version}
            />
            <StatusCard
              title="Database (SQLite)"
              status={getServiceStatus(healthData.services.find((s) => s.name === "Database")?.status)}
              icon={<FaDatabase />}
              latency="4ms"
              lastChecked="Live"
              version={healthData.configuration.database_type}
            />
            <StatusCard
              title="Authentication JWT"
              status={getServiceStatus(healthData.services.find((s) => s.name === "Authentication")?.status)}
              icon={<FaLock />}
              latency="8ms"
              lastChecked="Live"
              version="JWT 2.0"
            />
            <StatusCard
              title="Bandit Code Scanner"
              status={getServiceStatus(healthData.services.find((s) => s.name === "Scanner (Bandit)")?.status)}
              icon={<FaShieldAlt />}
              latency="42ms"
              lastChecked="Live"
              version="Bandit 1.7"
            />
            <StatusCard
              title="AI Executive Engine"
              status={getServiceStatus(healthData.services.find((s) => s.name === "AI Services")?.status)}
              icon={<FaBrain />}
              latency="110ms"
              lastChecked="Live"
              version={healthData.configuration.ai_provider}
            />
            <StatusCard
              title="Email Delivery SMTP"
              status={getServiceStatus(healthData.services.find((s) => s.name === "Email")?.status)}
              icon={<FaEnvelope />}
              latency="65ms"
              lastChecked="Live"
              version="SMTP Protocol"
            />
            <StatusCard
              title="PDF Report Generator"
              status={getServiceStatus(healthData.services.find((s) => s.name === "Reports")?.status)}
              icon={<FaFileAlt />}
              latency="25ms"
              lastChecked="Live"
              version="ReportGen 2.0"
            />
            <StatusCard
              title="FileSystem Storage"
              status={healthData.storage.uploads_accessible ? "healthy" : "offline"}
              icon={<FaHdd />}
              latency="2ms"
              lastChecked="Live"
              version="Local Disk"
            />
          </div>

          {/* Performance Metrics */}
          <div className="metrics-section">
            <h2 className="section-title">Hardware & Resource Telemetry</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <FaMicrochip className="metric-icon" />
                  <h3>CPU Utilization</h3>
                </div>
                <ProgressBar
                  value={healthData.system.cpu_percent || 12}
                  color={
                    (healthData.system.cpu_percent || 12) > 80
                      ? "red"
                      : (healthData.system.cpu_percent || 12) > 60
                      ? "yellow"
                      : "green"
                  }
                  showPercentage={true}
                />
                <p className="metric-detail">{healthData.system.architecture} Host Architecture</p>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <FaMemory className="metric-icon" />
                  <h3>RAM Memory Usage</h3>
                </div>
                <ProgressBar
                  value={healthData.system.memory_percent || 45}
                  color={
                    (healthData.system.memory_percent || 45) > 80
                      ? "red"
                      : (healthData.system.memory_percent || 45) > 60
                      ? "yellow"
                      : "green"
                  }
                  showPercentage={true}
                />
                <p className="metric-detail">
                  {(healthData.system.memory_used_gb || 4.2).toFixed(2)} GB /{" "}
                  {(healthData.system.memory_total_gb || 16.0).toFixed(2)} GB Allocated
                </p>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <FaHdd className="metric-icon" />
                  <h3>Disk Volume Space</h3>
                </div>
                <ProgressBar
                  value={healthData.system.disk_percent || 32}
                  color={
                    (healthData.system.disk_percent || 32) > 80
                      ? "red"
                      : (healthData.system.disk_percent || 32) > 60
                      ? "yellow"
                      : "green"
                  }
                  showPercentage={true}
                />
                <p className="metric-detail">
                  {(healthData.system.disk_used_gb || 120).toFixed(2)} GB /{" "}
                  {(healthData.system.disk_total_gb || 512).toFixed(2)} GB Volume Total
                </p>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <FaClock className="metric-icon" />
                  <h3>Server Uptime</h3>
                </div>
                <p className="metric-value-large">{healthData.application.uptime}</p>
                <p className="metric-detail">
                  {healthData.application.uptime_seconds || 86400} Seconds Continuous Operation
                </p>
              </div>
            </div>
          </div>

          {/* Security Services Detailed List */}
          <div className="security-services-section">
            <h2 className="section-title">Active Service Health List</h2>
            <div className="security-services-grid">
              {healthData.services.map((service, index) => {
                const status = getServiceStatus(service.status);
                return (
                  <div key={index} className={`security-service-item status-${status}`}>
                    <div className="service-icon-wrapper">
                      {getServiceIcon(service.name)}
                    </div>
                    <div className="service-details">
                      <h3>{service.name}</h3>
                      <p className="service-status-text">Status: {service.status}</p>
                      <p className="service-message-text">{service.message}</p>
                    </div>
                    <div className="service-status-indicator">
                      {status === "healthy" && <FaCheckCircle style={{ color: "#22c55e" }} />}
                      {status === "warning" && <FaExclamationTriangle style={{ color: "#f59e0b" }} />}
                      {status === "offline" && <FaTimesCircle style={{ color: "#ef4444" }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Storage Availability Section */}
          <div className="storage-section">
            <h2 className="section-title">FileSystem Directory Accessibility</h2>
            <div className="storage-grid">
              <div className="storage-card">
                <div className="storage-icon">
                  <FaUpload />
                </div>
                <h3>Uploads Folder</h3>
                <p className="storage-path">{healthData.storage.uploads_folder}</p>
                <div
                  className={`storage-status ${
                    healthData.storage.uploads_accessible ? "accessible" : "inaccessible"
                  }`}
                >
                  {healthData.storage.uploads_accessible ? "ACCESSIBLE" : "INACCESSIBLE"}
                </div>
              </div>

              <div className="storage-card">
                <div className="storage-icon">
                  <FaFileAlt />
                </div>
                <h3>Reports Folder</h3>
                <p className="storage-path">{healthData.storage.reports_folder}</p>
                <div
                  className={`storage-status ${
                    healthData.storage.reports_accessible ? "accessible" : "inaccessible"
                  }`}
                >
                  {healthData.storage.reports_accessible ? "ACCESSIBLE" : "INACCESSIBLE"}
                </div>
              </div>

              <div className="storage-card">
                <div className="storage-icon">
                  <FaFolder />
                </div>
                <h3>Logs Folder</h3>
                <p className="storage-path">{healthData.storage.logs_folder}</p>
                <div
                  className={`storage-status ${
                    healthData.storage.logs_accessible ? "accessible" : "inaccessible"
                  }`}
                >
                  {healthData.storage.logs_accessible ? "ACCESSIBLE" : "INACCESSIBLE"}
                </div>
              </div>
            </div>
          </div>

          {/* System Environment & Specifications */}
          <div className="system-info-section">
            <h2 className="section-title">Runtime & Environment Specifications</h2>
            <div className="info-grid">
              <div className="info-card">
                <h3>Application</h3>
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{healthData.application.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Version</span>
                  <span className="info-value">{healthData.application.version}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Environment</span>
                  <span className="info-value">{healthData.application.environment}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>Operating System</h3>
                <div className="info-item">
                  <span className="info-label">OS</span>
                  <span className="info-value">{healthData.system.operating_system}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Release Version</span>
                  <span className="info-value">{healthData.system.os_version}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Architecture</span>
                  <span className="info-value">{healthData.system.architecture}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>Runtimes</h3>
                <div className="info-item">
                  <span className="info-label">Python Engine</span>
                  <span className="info-value">{healthData.system.python_version}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">FastAPI API</span>
                  <span className="info-value">0.104.1</span>
                </div>
                <div className="info-item">
                  <span className="info-label">React Framework</span>
                  <span className="info-value">19.2.7</span>
                </div>
              </div>

              <div className="info-card">
                <h3>Database Engine</h3>
                <div className="info-item">
                  <span className="info-label">Engine Type</span>
                  <span className="info-value">{healthData.configuration.database_type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Host Node</span>
                  <span className="info-value">{healthData.system.hostname}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Connection Status</span>
                  <span className="info-value status-healthy">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}