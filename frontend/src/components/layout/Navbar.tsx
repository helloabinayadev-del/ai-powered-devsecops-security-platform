import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaHome,
  FaUpload,
  FaFolderOpen,
  FaHistory,
  FaChartBar,
  FaFileAlt,
  FaRobot,
  FaEnvelope,
  FaHeartbeat,
  FaSignOutAlt,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
  FaBars,
  FaTimes,
  FaUserShield,
} from "react-icons/fa";

import "./Navbar.css";

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/upload", label: "Upload & Scan", icon: <FaUpload /> },
    { path: "/files", label: "Repositories", icon: <FaFolderOpen /> },
    { path: "/history", label: "Audit History", icon: <FaHistory /> },
    { path: "/statistics", label: "Statistics", icon: <FaChartBar /> },
    { path: "/reports", label: "Reports", icon: <FaFileAlt /> },
    { path: "/analytics", label: "Analytics", icon: <FaChartBar /> },
    { path: "/ai-summary", label: "AI Intelligence", icon: <FaRobot /> },
    { path: "/email", label: "Alerts & Mail", icon: <FaEnvelope /> },
    { path: "/health", label: "System Health", icon: <FaHeartbeat /> },
    { path: "/settings", label: "Settings", icon: <FaCog /> },
  ];

  if (user?.role?.toUpperCase() === "ADMIN") {
    menuItems.push({ path: "/admin/users", label: "User Management", icon: <FaUserShield /> });
  }

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Top Navbar Header */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <FaShieldAlt className="logo-icon" />
          <span>DevSecOps</span>
        </div>
        <button
          className="mobile-toggle-btn"
          onClick={toggleMobile}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
        aria-label="Sidebar Navigation"
      >
        <div className="sidebar-header">
          <div className="logo-container">
            <FaShieldAlt className="logo-icon" />
            {!collapsed && <span className="logo-text">DevSecOps</span>}
          </div>
          <button
            className="collapse-btn"
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`nav-item ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="logout">
          <Link
            to="/"
            onClick={() => { logout(); setMobileOpen(false); }}
            title={collapsed ? "Logout" : undefined}
          >
            <span className="icon">
              <FaSignOutAlt />
            </span>
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
