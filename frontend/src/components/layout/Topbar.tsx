import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaCog, FaMoon, FaSun, FaBell, FaSignOutAlt } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import "./Topbar.css";

const pageTitles: Record<string, string> = {
  "/dashboard": "Security Overview",
  "/upload": "Source Code Scanning",
  "/files": "Repository Inventory",
  "/history": "Audit History Trail",
  "/statistics": "Security Statistics",
  "/reports": "Security Audit Reports",
  "/analytics": "Security Analytics",
  "/ai-summary": "AI Intelligence",
  "/email": "Report Delivery Center",
  "/health": "Platform Infrastructure Health",
  "/settings": "Platform Settings",
  "/admin/users": "User Management",
};

export default function Topbar() {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const title = pageTitles[location.pathname] ?? "AI-Powered DevSecOps Security Platform";

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "US";

  return (
    <header className="topbar" role="banner">
      <div className="breadcrumb" aria-label="Breadcrumb navigation">
        <span className="breadcrumb-root">Security Workspace</span>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <strong className="breadcrumb-current">{title}</strong>
      </div>

      <div className="topbar-actions">
        {/* Notifications Icon Button */}
        <div className="topbar-notification-wrapper" style={{ position: "relative" }}>
          <button
            className="topbar-icon-button notification-btn"
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View security alerts and notifications"
            aria-expanded={showNotifications}
            title="Security Alerts (3 Unread)"
          >
            <FaBell className="topbar-icon" />
            <span className="notification-badge-dot" title="3 active security alerts" />
          </button>

          {showNotifications && (
            <div className="notification-dropdown card" role="region" aria-label="Recent notifications">
              <div className="notification-dropdown-header">
                <h4>Security System Alerts</h4>
                <span className="badge-count">3 Active</span>
              </div>
              <ul className="notification-list">
                <li className="notification-item">
                  <span className="dot dot-green" />
                  <div>
                    <strong>Static Audit Complete</strong>
                    <small>Bandit scanned Python modules</small>
                  </div>
                </li>
                <li className="notification-item">
                  <span className="dot dot-amber" />
                  <div>
                    <strong>Medium Severity Warning</strong>
                    <small>Security checks updated</small>
                  </div>
                </li>
                <li className="notification-item">
                  <span className="dot dot-blue" />
                  <div>
                    <strong>AI Summary Generated</strong>
                    <small>Executive assessment report available</small>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          className="topbar-icon-button theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark theme mode" : "Switch to light theme mode"}
          title={theme === "light" ? "Switch to Professional Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <FaMoon className="topbar-icon" /> : <FaSun className="topbar-icon" />}
        </button>

        {/* Settings Link Button */}
        <Link
          className="topbar-icon-button settings-btn"
          to="/settings"
          aria-label="Open platform settings panel"
          title="Platform Settings"
        >
          <FaCog className="topbar-icon" />
        </Link>

        {/* User Profile Avatar Pill */}
        <div className="topbar-profile" aria-label={`Signed in as ${user?.username || 'User'}`} role="contentinfo">
          <span className="avatar-pill">{initials}</span>
          <div className="profile-text">
            <strong>{user?.username || "User"}</strong>
            <small>{user?.role ? user.role.toUpperCase() : "USER"}</small>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              marginLeft: 8,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </header>
  );
}


