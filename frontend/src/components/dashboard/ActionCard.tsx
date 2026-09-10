import { type ReactNode } from "react";

interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  color?: "blue" | "green" | "purple" | "orange";
}

export default function ActionCard({
  title,
  description,
  icon,
  onClick,
  color = "blue",
}: ActionCardProps) {
  const colorClasses = {
    blue: "hover:border-blue-500 hover:bg-blue-50",
    green: "hover:border-green-500 hover:bg-green-50",
    purple: "hover:border-purple-500 hover:bg-purple-50",
    orange: "hover:border-orange-500 hover:bg-orange-50",
  };

  return (
    <button
      className={`action-card ${colorClasses[color]}`}
      onClick={onClick}
    >
      <div className="action-card-icon">{icon}</div>
      <div className="action-card-content">
        <div className="action-card-title">{title}</div>
        <div className="action-card-description">{description}</div>
      </div>
    </button>
  );
}
