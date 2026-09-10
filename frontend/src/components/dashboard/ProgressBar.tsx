interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  showPercentage?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  color = "blue",
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="progress-bar-container">
      {label && <div className="progress-bar-label">{label}</div>}
      <div className="progress-bar-wrapper">
        <div
          className={`progress-bar-fill ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="progress-bar-percentage">{percentage.toFixed(1)}%</div>
      )}
    </div>
  );
}
