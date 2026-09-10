import { type ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan";
  onClick?: () => void;
}

export default function KPICard({
  title,
  value,
  icon,
  trend,
  description,
  color = "blue",
  onClick,
}: KPICardProps) {
  return (
    <div
      className={`kpi-card color-${color} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="kpi-card-header">
        <div className="kpi-card-icon">
          {icon}
        </div>
        <div className="kpi-card-title">{title}</div>
      </div>
      <div className="kpi-card-value">{value}</div>
      {trend && (
        <div className={`kpi-card-trend ${trend.isPositive ? "positive" : "negative"}`}>
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </div>
      )}
      {description && <div className="kpi-card-description">{description}</div>}
    </div>
  );
}

