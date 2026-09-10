import { type ReactNode } from "react";

interface StatusCardProps {
  title: string;
  status: "healthy" | "warning" | "offline";
  icon: ReactNode;
  latency?: string;
  lastChecked?: string;
  version?: string;
}

export default function StatusCard({
  title,
  status,
  icon,
  latency,
  lastChecked,
  version,
}: StatusCardProps) {
  const statusConfig = {
    healthy: {
      color: "green",
      label: "Healthy",
      dotColor: "bg-green-500",
    },
    warning: {
      color: "yellow",
      label: "Warning",
      dotColor: "bg-yellow-500",
    },
    offline: {
      color: "red",
      label: "Offline",
      dotColor: "bg-red-500",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="status-card">
      <div className="status-card-header">
        <div className="status-card-icon">{icon}</div>
        <div className={`status-card-indicator ${config.dotColor}`} />
      </div>
      <div className="status-card-title">{title}</div>
      <div className={`status-card-status status-${config.color}`}>
        {config.label}
      </div>
      {latency && (
        <div className="status-card-metric">
          <span className="metric-label">Latency:</span>
          <span className="metric-value">{latency}</span>
        </div>
      )}
      {lastChecked && (
        <div className="status-card-metric">
          <span className="metric-label">Last Checked:</span>
          <span className="metric-value">{lastChecked}</span>
        </div>
      )}
      {version && (
        <div className="status-card-metric">
          <span className="metric-label">Version:</span>
          <span className="metric-value">{version}</span>
        </div>
      )}
    </div>
  );
}
