import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Toast, { type ToastType } from "../components/Toast";
import { useTheme } from "../context/ThemeContext";
import {
  FaUser,
  FaShieldAlt,
  FaBell,
  FaCog,
  FaSave,
  FaRobot,
  FaDatabase,
  FaServer,
  FaKey,
  FaInfoCircle,
  FaPalette,
  FaRedo,
  FaSync,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaCheck,
} from "react-icons/fa";

import "./Settings.css";

interface ServiceStatus {
  name: string;
  status: "healthy" | "warning" | "critical";
  color: string;
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
  };
  system: {
    python_version: string;
    operating_system: string;
    os_version: string;
    architecture: string;
    hostname: string;
    cpu_percent?: number;
    memory_percent?: number;
    memory_used_gb?: number;
    memory_total_gb?: number;
  };
  services: ServiceStatus[];
  configuration: {
    database_type: string;
    ai_enabled: boolean;
    ai_provider: string;
    max_file_size: string;
    rate_limit: string;
  };
}

export default function Settings() {
  const { theme: activeTheme, setTheme: setActiveTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"health" | "theme" | "security" | "notifications" | "api" | "about">("health");
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // User & Security state
  const [profile] = useState({
    username: localStorage.getItem("username") || "admin",
    email: "admin@devsecops.local",
    role: "Administrator",
  });

  const [security, setSecurity] = useState({
    sessionTimeout: localStorage.getItem("session_timeout") || "30",
    twoFactorEnabled: false,
  });

  const [passwordChange, setPasswordChange] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notification_prefs");
    return saved
      ? JSON.parse(saved)
      : {
          emailAlerts: true,
          scanComplete: true,
          securityWarnings: true,
          weeklyReports: false,
        };
  });

  // Theme settings
  const [theme, setThemeState] = useState(() => ({
    accentColor: localStorage.getItem("theme_accent") || "#2563eb",
  }));

  // API Config state
  const [apiConfig, setApiConfig] = useState({
    baseUrl: localStorage.getItem("api_base_url") || "http://127.0.0.1:8000",
    timeout: localStorage.getItem("api_timeout") || "30000",
  });

  const loadHealthData = useCallback(async () => {
    try {
      setHealthLoading(true);
      const response = await api.get("/api/v1/health/");
      setHealthData(response.data);
    } catch {
      setToast({ message: "Failed to fetch health data from backend", type: "error" });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  const handleThemeChange = (newMode: "light" | "dark" | "contrast") => {
    setActiveTheme(newMode);
    setToast({ message: `Theme switched to ${newMode} mode`, type: "info" });
  };

  const handleAccentChange = (color: string) => {
    setThemeState({ accentColor: color });
    localStorage.setItem("theme_accent", color);
    document.documentElement.style.setProperty("--accent-blue", color);
  };

  const resetTheme = () => {
    setActiveTheme("dark");
    handleAccentChange("#2563eb");
    setToast({ message: "Theme reset to default settings", type: "info" });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      setToast({ message: "New password and confirmation do not match", type: "error" });
      return;
    }
    if (passwordChange.newPassword.length < 8) {
      setToast({ message: "Password must be at least 8 characters long", type: "error" });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post("/api/v1/auth/change-password", {
        current_password: passwordChange.currentPassword,
        new_password: passwordChange.newPassword,
      });
      setToast({ message: "Password updated successfully", type: "success" });
      setPasswordChange({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to update password";
      setToast({ message: errorMsg, type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveAll = () => {
    setSaving(true);
    try {
      localStorage.setItem("notification_prefs", JSON.stringify(notifications));
      localStorage.setItem("session_timeout", security.sessionTimeout);
      localStorage.setItem("api_base_url", apiConfig.baseUrl);
      localStorage.setItem("api_timeout", apiConfig.timeout);
      setToast({ message: "Settings saved successfully", type: "success" });
    } catch {
      setToast({ message: "Failed to persist settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const renderHealthTab = () => (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h3><FaServer /> System & Service Health Matrix</h3>
          <p className="section-subtext">Real-time status of underlying platform microservices, CPU/Memory metrics, and runtime parameters</p>
        </div>
        <button className="refresh-btn" onClick={loadHealthData} disabled={healthLoading} aria-label="Refresh system health status">
          <FaSync className={healthLoading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {healthLoading ? (
        <div className="loading-container">
          <FaSync className="spin text-2xl text-blue-500" />
          <p>Fetching real-time health data...</p>
        </div>
      ) : healthData ? (
        <>
          <div className="setting-card health-banner-card">
            <div className="setting-card-info">
              <span className="setting-card-title">Overall Health Status</span>
              <span className="setting-card-desc">{healthData.message}</span>
            </div>
            <span className={`status-badge status-${healthData.overall_status}`}>
              {healthData.overall_status.toUpperCase()}
            </span>
          </div>

          <h4 className="card-section-title">Core Microservices</h4>
          <div className="services-grid">
            {healthData.services.map((svc) => (
              <div key={svc.name} className="setting-card service-card">
                <div className="service-header">
                  <span className="service-name">{svc.name}</span>
                  <span className={`status-indicator indicator-${svc.status}`} />
                </div>
                <div className="service-msg">{svc.message}</div>
              </div>
            ))}
          </div>

          <h4 className="card-section-title">Host Metrics & Platform Details</h4>
          <div className="info-grid">
            <div className="setting-card info-item">
              <span className="info-label">Platform Version</span>
              <span className="info-value">{healthData.application.version}</span>
            </div>
            <div className="setting-card info-item">
              <span className="info-label">Environment</span>
              <span className="info-value">{healthData.application.environment}</span>
            </div>
            <div className="setting-card info-item">
              <span className="info-label">System Uptime</span>
              <span className="info-value">{healthData.application.uptime}</span>
            </div>
            <div className="setting-card info-item">
              <span className="info-label">Python Runtime</span>
              <span className="info-value">{healthData.system.python_version}</span>
            </div>
            <div className="setting-card info-item">
              <span className="info-label">Operating System</span>
              <span className="info-value">{healthData.system.operating_system}</span>
            </div>
            <div className="setting-card info-item">
              <span className="info-label">Architecture</span>
              <span className="info-value">{healthData.system.architecture}</span>
            </div>
            {healthData.system.cpu_percent !== undefined && (
              <div className="setting-card info-item">
                <span className="info-label">CPU Usage</span>
                <span className="info-value">{healthData.system.cpu_percent}%</span>
              </div>
            )}
            {healthData.system.memory_percent !== undefined && (
              <div className="setting-card info-item">
                <span className="info-label">Memory Usage</span>
                <span className="info-value">{healthData.system.memory_percent}% ({healthData.system.memory_used_gb} / {healthData.system.memory_total_gb} GB)</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="error-text">Unable to load system health status.</p>
      )}
    </div>
  );

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "transparent" };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score: 25, label: "Weak", color: "#ef4444" };
    if (score === 50) return { score: 50, label: "Moderate", color: "#f59e0b" };
    if (score === 75) return { score: 75, label: "Good", color: "#3b82f6" };
    return { score: 100, label: "Strong (Enterprise Grade)", color: "#22c55e" };
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setToast({ message: `Copied ${fieldName} to clipboard`, type: "success" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderThemeTab = () => (
    <div className="settings-section">
      <h3><FaPalette /> Appearance & Visual Preferences</h3>
      <p className="section-subtext">Customize UI theme mode, accent highlight colors, and presentation parameters</p>

      <div className="setting-card">
        <div className="setting-card-info">
          <label htmlFor="settings-theme-mode" className="setting-card-title">Theme Mode</label>
          <span className="setting-card-desc">Select visual color palette for dark SOC operations or standard light workspace</span>
        </div>
        <select
          id="settings-theme-mode"
          name="themeMode"
          className="setting-select"
          value={activeTheme}
          onChange={(e) => handleThemeChange(e.target.value as "light" | "dark" | "contrast")}
        >
          <option value="dark">Professional Dark (Cybersecurity)</option>
          <option value="light">Professional Light</option>
          <option value="contrast">High Contrast Mode</option>
        </select>
      </div>

      <div className="setting-card">
        <div className="setting-card-info">
          <label htmlFor="settings-theme-accent" className="setting-card-title">Accent Primary Color</label>
          <span className="setting-card-desc">Choose custom highlight color applied to primary action buttons and focus indicators</span>
        </div>
        <div className="color-picker-row">
          <input
            type="color"
            id="settings-theme-accent"
            name="themeAccent"
            value={theme.accentColor}
            onChange={(e) => handleAccentChange(e.target.value)}
          />
          <span className="color-code">{theme.accentColor}</span>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="setting-card theme-preview-card" style={{ flexDirection: "column", alignItems: "flex-start" }}>
        <span className="setting-card-title" style={{ marginBottom: "8px" }}>Live Theme Preview</span>
        <div className="theme-preview-box" style={{ width: "100%", padding: "16px", borderRadius: "10px", background: activeTheme === "light" ? "#ffffff" : activeTheme === "contrast" ? "#030712" : "#0f172a", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: theme.accentColor }} />
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: activeTheme === "light" ? "#0f172a" : "#ffffff" }}>
              Sample Action Component ({activeTheme.toUpperCase()})
            </span>
          </div>
          <button type="button" style={{ background: theme.accentColor, color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
            Active Primary Button
          </button>
        </div>
      </div>

      <div className="theme-actions">
        <button type="button" className="reset-btn" onClick={resetTheme}>
          <FaRedo /> Reset Theme to Defaults
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => {
    const strength = getPasswordStrength(passwordChange.newPassword);

    return (
      <div className="settings-section">
        <h3><FaShieldAlt /> User Profile & Security Credentials</h3>
        <p className="section-subtext">Manage platform administrator account credentials, passwords, and session duration</p>

        <div className="setting-card profile-box">
          <div className="form-group">
            <label htmlFor="profile-username"><FaUser /> Username</label>
            <input
              id="profile-username"
              name="username"
              type="text"
              autoComplete="username"
              value={profile.username}
              disabled
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-email">Email Address</label>
            <input
              id="profile-email"
              name="email"
              type="email"
              autoComplete="email"
              value={profile.email}
              disabled
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-role">Assigned Platform Role</label>
            <input
              id="profile-role"
              name="role"
              type="text"
              autoComplete="off"
              value={profile.role}
              disabled
            />
          </div>
        </div>

        <div className="setting-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <h4 className="card-section-title"><FaKey /> Update Administrator Password</h4>
          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-group">
              <label htmlFor="current-password-input">Current Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="current-password-input"
                  name="currentPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={passwordChange.currentPassword}
                  onChange={(e) => setPasswordChange({ ...passwordChange, currentPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new-password-input">New Password (minimum 8 characters)</label>
              <div style={{ position: "relative" }}>
                <input
                  id="new-password-input"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={passwordChange.newPassword}
                  onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {passwordChange.newPassword && (
                <div className="password-strength-container" style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Password Strength:</span>
                    <strong style={{ color: strength.color }}>{strength.label}</strong>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "#334155", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${strength.score}%`, background: strength.color, transition: "all 0.3s ease" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password-input">Confirm New Password</label>
              <input
                id="confirm-password-input"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={passwordChange.confirmPassword}
                onChange={(e) => setPasswordChange({ ...passwordChange, confirmPassword: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="save-btn" disabled={passwordLoading}>
              {passwordLoading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>

        <div className="setting-card">
          <div className="setting-card-info">
            <label htmlFor="session-timeout-input" className="setting-card-title">Session Inactivity Timeout (Minutes)</label>
            <span className="setting-card-desc">Automatically end idle security sessions after specified duration</span>
          </div>
          <input
            id="session-timeout-input"
            name="sessionTimeout"
            type="number"
            min="5"
            max="480"
            className="setting-input-sm"
            autoComplete="off"
            value={security.sessionTimeout}
            onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
          />
        </div>
      </div>
    );
  };

  const renderNotificationsTab = () => (
    <div className="settings-section">
      <h3><FaBell /> Alert & Notification Dispatch Preferences</h3>
      <p className="section-subtext">Configure automated notification triggers for security audits, email alerts, and weekly summaries</p>

      <div className="setting-card">
        <div className="setting-card-info">
          <span className="setting-card-title">Email Security Vulnerability Alerts</span>
          <span className="setting-card-desc">Send immediate email dispatches when Bandit audit flags unsafe code</span>
        </div>
        <label className="toggle-switch">
          <input
            id="toggle-email-alerts"
            name="emailAlerts"
            type="checkbox"
            checked={notifications.emailAlerts}
            onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
          />
          <span className="slider round" />
        </label>
      </div>

      <div className="setting-card">
        <div className="setting-card-info">
          <span className="setting-card-title">Scan Completion Notifications</span>
          <span className="setting-card-desc">Show notification toasts and alerts when a background scan completes</span>
        </div>
        <label className="toggle-switch">
          <input
            id="toggle-scan-complete"
            name="scanComplete"
            type="checkbox"
            checked={notifications.scanComplete}
            onChange={(e) => setNotifications({ ...notifications, scanComplete: e.target.checked })}
          />
          <span className="slider round" />
        </label>
      </div>

      <div className="setting-card">
        <div className="setting-card-info">
          <span className="setting-card-title">High / Critical Security Warnings</span>
          <span className="setting-card-desc">High-priority alert banner for critical vulnerability thresholds</span>
        </div>
        <label className="toggle-switch">
          <input
            id="toggle-security-warnings"
            name="securityWarnings"
            type="checkbox"
            checked={notifications.securityWarnings}
            onChange={(e) => setNotifications({ ...notifications, securityWarnings: e.target.checked })}
          />
          <span className="slider round" />
        </label>
      </div>

      <div className="setting-card">
        <div className="setting-card-info">
          <span className="setting-card-title">Weekly Summary Email Digest</span>
          <span className="setting-card-desc">Receive consolidated weekly security statistics and AI executive overview</span>
        </div>
        <label className="toggle-switch">
          <input
            id="toggle-weekly-reports"
            name="weeklyReports"
            type="checkbox"
            checked={notifications.weeklyReports}
            onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
          />
          <span className="slider round" />
        </label>
      </div>
    </div>
  );

  const renderApiTab = () => (
    <div className="settings-section">
      <h3><FaCog /> API & System Endpoint Configuration</h3>
      <p className="section-subtext">Manage backend REST API base parameters and static scanner limits</p>

      <div className="setting-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label htmlFor="api-base-url-input" style={{ margin: 0 }}>Backend Base Service URL</label>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(apiConfig.baseUrl, "Backend URL")}
              style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}
              aria-label="Copy backend base URL to clipboard"
            >
              {copiedField === "Backend URL" ? <FaCheck style={{ color: "#22c55e" }} /> : <FaCopy />}
              {copiedField === "Backend URL" ? "Copied!" : "Copy URL"}
            </button>
          </div>
          <input
            id="api-base-url-input"
            name="apiBaseUrl"
            type="text"
            autoComplete="url"
            value={apiConfig.baseUrl}
            onChange={(e) => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="api-timeout-input">Request Timeout Threshold (Milliseconds)</label>
          <input
            id="api-timeout-input"
            name="apiTimeout"
            type="number"
            autoComplete="off"
            value={apiConfig.timeout}
            onChange={(e) => setApiConfig({ ...apiConfig, timeout: e.target.value })}
          />
        </div>
      </div>

      {healthData && (
        <div className="setting-card margin-top-md">
          <h4 className="card-section-title">Active Backend Engine Specs</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label"><FaDatabase /> Database Engine</span>
              <span className="info-value">{healthData.configuration.database_type}</span>
            </div>
            <div className="info-item">
              <span className="info-label"><FaRobot /> AI Provider</span>
              <span className="info-value">{healthData.configuration.ai_provider}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Max File Size</span>
              <span className="info-value">{healthData.configuration.max_file_size} bytes</span>
            </div>
            <div className="info-item">
              <span className="info-label">API Rate Limit</span>
              <span className="info-value">{healthData.configuration.rate_limit} req/min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAboutTab = () => (
    <div className="settings-section">
      <h3><FaInfoCircle /> About AI-Powered DevSecOps Security Platform</h3>
      <p className="section-subtext">Platform build specifications, architecture components, and licensing info</p>

      <div className="setting-card">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Platform Name</span>
            <span className="info-value">AI-Powered DevSecOps Security Platform</span>
          </div>
          <div className="info-item">
            <span className="info-label">Software Version</span>
            <span className="info-value">2.0.0 Enterprise</span>
          </div>
          <div className="info-item">
            <span className="info-label">Technology Stack</span>
            <span className="info-value">FastAPI + React Vite + SQLite + Bandit</span>
          </div>
          <div className="info-item">
            <span className="info-label">Open Source License</span>
            <span className="info-value">MIT License</span>
          </div>
        </div>
        <div className="info-note" style={{ marginTop: "20px" }}>
          An enterprise-grade DevSecOps security analysis platform featuring static security analysis (Bandit), 
          AI-driven vulnerability evaluation, automated report generation, and security audit logs.
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="settings-header">
        <h1>Enterprise Platform Settings</h1>
        <p className="settings-subtitle">Manage preferences, security credentials, notification channels, and system health status</p>
      </div>

      <div className="settings-layout">
        <div className="settings-tabs">
          <button type="button" className={`tab-btn ${activeTab === "health" ? "active" : ""}`} onClick={() => setActiveTab("health")}>
            <FaServer /> Health & Status
          </button>
          <button type="button" className={`tab-btn ${activeTab === "theme" ? "active" : ""}`} onClick={() => setActiveTab("theme")}>
            <FaPalette /> Theme & Appearance
          </button>
          <button type="button" className={`tab-btn ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
            <FaShieldAlt /> Security & Account
          </button>
          <button type="button" className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`} onClick={() => setActiveTab("notifications")}>
            <FaBell /> Notifications
          </button>
          <button type="button" className={`tab-btn ${activeTab === "api" ? "active" : ""}`} onClick={() => setActiveTab("api")}>
            <FaCog /> API & Config
          </button>
          <button type="button" className={`tab-btn ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
            <FaInfoCircle /> About
          </button>
        </div>

        <div className="settings-content card">
          {activeTab === "health" && renderHealthTab()}
          {activeTab === "theme" && renderThemeTab()}
          {activeTab === "security" && renderSecurityTab()}
          {activeTab === "notifications" && renderNotificationsTab()}
          {activeTab === "api" && renderApiTab()}
          {activeTab === "about" && renderAboutTab()}

          {activeTab !== "health" && activeTab !== "about" && (
            <div className="settings-actions">
              <button type="button" className="save-btn" onClick={handleSaveAll} disabled={saving}>
                <FaSave /> {saving ? "Saving Preferences..." : "Save Preferences"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

