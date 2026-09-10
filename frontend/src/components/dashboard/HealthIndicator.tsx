interface HealthIndicatorProps {
  score: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

export default function HealthIndicator({
  score,
  size = "medium",
  showLabel = true,
}: HealthIndicatorProps) {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32",
  };

  const textSizeClasses = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-3xl",
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  const healthColor = getHealthColor(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const colorClasses = {
    green: "stroke-green-500",
    yellow: "stroke-yellow-500",
    red: "stroke-red-500",
  };

  return (
    <div className="health-indicator">
      <div className={`health-indicator-circle ${sizeClasses[size]}`}>
        <svg viewBox="0 0 100 100" className="health-indicator-svg">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={`health-indicator-progress ${colorClasses[healthColor]}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
          />
        </svg>
        <div className={`health-indicator-score ${textSizeClasses[size]}`}>
          {score}%
        </div>
      </div>
      {showLabel && (
        <div className={`health-indicator-label health-${healthColor}`}>
          {healthColor === "green" && "Excellent"}
          {healthColor === "yellow" && "Warning"}
          {healthColor === "red" && "Critical"}
        </div>
      )}
    </div>
  );
}
