import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface SecurityScoreProps {
  totalScans: number;
  safeScans: number;
  riskyScans: number;
}

export default function SecurityScore({
  totalScans,
  safeScans,
  riskyScans,
}: SecurityScoreProps) {
  // Security Score Calculation
  const score =
    totalScans === 0
      ? 100
      : Math.round((safeScans / totalScans) * 100);

  return (
    <div className="chart-card security-score-card">
      <h2>Security Score</h2>

      <div className="security-score-circle">
        <CircularProgressbar
          value={score}
          text={`${score}%`}
          styles={{
            path: {
              stroke:
                score >= 90
                  ? "#16a34a"
                  : score >= 75
                  ? "#2563eb"
                  : score >= 50
                  ? "#f59e0b"
                  : "#dc2626",
              strokeLinecap: "round",
            },
            trail: {
              stroke: "#e5e7eb",
            },
            text: {
              fill: "#1e293b",
              fontSize: "18px",
              fontWeight: "bold",
            },
          }}
        />
      </div>

      <h3 className="score-title">
        {score >= 90
          ? "Excellent Security"
          : score >= 75
          ? "Good Security"
          : score >= 50
          ? "Needs Improvement"
          : "Critical Risk"}
      </h3>

      <div className="score-stats">
        <p>
          <strong>Total Scans:</strong> {totalScans}
        </p>

        <p style={{ color: "#16a34a" }}>
          <strong>Safe Files:</strong> {safeScans}
        </p>

        <p style={{ color: "#dc2626" }}>
          <strong>Risky Files:</strong> {riskyScans}
        </p>
      </div>

      <p className="score-description">
        Overall security posture based on scanned files.
      </p>
    </div>
  );
}