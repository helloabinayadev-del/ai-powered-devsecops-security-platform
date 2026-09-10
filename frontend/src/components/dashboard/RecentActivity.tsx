import {
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

interface Activity {
  filename: string;
  risk_level: string;
  scan_time: string;
}

interface RecentActivityProps {
  scans: Activity[];
}

export default function RecentActivity({
  scans,
}: RecentActivityProps) {

  return (

    <div className="chart-card">

      <h2>Recent Activity</h2>

      {scans.length === 0 ? (

        <p>No recent activity.</p>

      ) : (

        scans.map((scan, index) => (

          <div
            key={index}
            className="activity-item"
          >

            <div className="activity-icon">

              {scan.risk_level.toLowerCase() === "safe" ? (

                <FaCheckCircle color="#16a34a" />

              ) : (

                <FaExclamationTriangle color="#dc2626" />

              )}

            </div>

            <div className="activity-info">

              <h4>{scan.filename}</h4>

              <p>{scan.scan_time}</p>

            </div>

            <div
              className={`activity-status ${
                scan.risk_level.toLowerCase() === "safe"
                  ? "safe"
                  : "risk"
              }`}
            >

              {scan.risk_level}

            </div>

          </div>

        ))

      )}

    </div>

  );
}