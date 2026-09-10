import "./RiskBadge.css";

interface RiskBadgeProps {
  risk: string;
}

export default function RiskBadge({ risk }: RiskBadgeProps) {
  const level = risk.toLowerCase();

  let className: string;
  // Each switch branch assigns the visible icon; the initial value keeps the
  // component resilient if a new risk level is introduced.
  // eslint-disable-next-line no-useless-assignment
  let icon = "🔴";

  switch (level) {
    case "safe":
      className = "badge-safe";
      icon = "🟢";
      break;

    case "low":
      className = "badge-low";
      icon = "🟡";
      break;

    case "medium":
      className = "badge-medium";
      icon = "🟠";
      break;

    case "high":
      className = "badge-high";
      icon = "🔴";
      break;

    case "unsafe":
      className = "badge-high";
      icon = "🔴";
      break;

    default:
      className = "badge-high";
      icon = "🔴";
  }

  return (
    <span className={`risk-badge ${className}`}>
      <span className="risk-icon">{icon}</span>
      <span>{risk}</span>
    </span>
  );
}
