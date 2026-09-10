import {
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBug,
} from "react-icons/fa";

interface AnalyticsCardsProps {
  totalScans: number;
  safeScans: number;
  riskyScans: number;
  totalIssues: number;
}

export default function AnalyticsCards({
  totalScans,
  safeScans,
  riskyScans,
  totalIssues,
}: AnalyticsCardsProps) {
  return (
    <div className="dashboard-cards">

      <div className="dashboard-card total-card">
        <div className="card-icon">
          <FaShieldAlt />
        </div>

        <div className="card-content">
          <h3>Total Scans</h3>
          <h1>{totalScans}</h1>
        </div>
      </div>

      <div className="dashboard-card safe-card">
        <div className="card-icon">
          <FaCheckCircle />
        </div>

        <div className="card-content">
          <h3>Safe Files</h3>
          <h1>{safeScans}</h1>
        </div>
      </div>

      <div className="dashboard-card risk-card">
        <div className="card-icon">
          <FaExclamationTriangle />
        </div>

        <div className="card-content">
          <h3>Risky Files</h3>
          <h1>{riskyScans}</h1>
        </div>
      </div>

      <div className="dashboard-card issue-card">
        <div className="card-icon">
          <FaBug />
        </div>

        <div className="card-content">
          <h3>Total Issues</h3>
          <h1>{totalIssues}</h1>
        </div>
      </div>

    </div>
  );
}