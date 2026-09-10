import { useState } from "react";
import api from "../services/api";

interface RiskScore {
  scan_id?: number;
  filename?: string;
  score: number;
  risk_level: string;
  explanation: string;
  severity_breakdown?: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  total_issues?: number;
  trend?: {
    direction: string;
    detail: string;
  };
}

export default function RiskScoring() {
  const [scanId, setScanId] = useState<number | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [overallScore, setOverallScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"scan" | "overall">("scan");

  const handleGetScanScore = async () => {
    if (!scanId) {
      setError("Please enter a scan ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/api/v1/ai/risk/score/${scanId}`);
      setRiskScore(response.data);
      setOverallScore(null);
    } catch (error: any) {
      console.error(error);
      setError(error.response?.data?.detail || "Failed to get risk score");
    } finally {
      setLoading(false);
    }
  };

  const handleGetOverallScore = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/v1/ai/risk/score");
      setOverallScore(response.data);
      setRiskScore(null);
    } catch (error: any) {
      console.error(error);
      setError(error.response?.data?.detail || "Failed to get overall risk score");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "CRITICAL": return "#dc2626";
      case "HIGH": return "#ef4444";
      case "MEDIUM": return "#f59e0b";
      case "LOW": return "#22c55e";
      default: return "#64748b";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#ef4444";
    return "#dc2626";
  };

  const currentScore = mode === "scan" ? riskScore : overallScore;

  return (
    <div className="risk-scoring-container">
      <h1>Intelligent Risk Scoring</h1>
      <p className="subtitle">
        AI-powered security risk assessment and scoring
      </p>

      <div className="mode-selector">
        <button
          className={mode === "scan" ? "active" : ""}
          onClick={() => setMode("scan")}
        >
          Scan Risk Score
        </button>
        <button
          className={mode === "overall" ? "active" : ""}
          onClick={() => setMode("overall")}
        >
          Overall Platform Risk
        </button>
      </div>

      {mode === "scan" ? (
        <div className="scan-input-section">
          <div className="input-group">
            <label>Scan ID:</label>
            <input
              type="number"
              value={scanId || ""}
              onChange={(e) => setScanId(parseInt(e.target.value) || null)}
              placeholder="Enter scan ID"
            />
            <button onClick={handleGetScanScore} disabled={loading}>
              {loading ? "Calculating..." : "Get Score"}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="overall-section">
          <button onClick={handleGetOverallScore} disabled={loading}>
            {loading ? "Calculating..." : "Calculate Overall Risk"}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      {currentScore && (
        <div className="risk-results">
          <div className="score-display">
            <div
              className="score-circle"
              style={{
                borderColor: getScoreColor(currentScore.score),
                background: `linear-gradient(135deg, ${getScoreColor(currentScore.score)}20, transparent)`,
              }}
            >
              <div className="score-value">{currentScore.score}</div>
              <div className="score-label">Security Score</div>
            </div>
            <div
              className="risk-badge"
              style={{ background: getRiskColor(currentScore.risk_level) }}
            >
              {currentScore.risk_level} Risk
            </div>
          </div>

          <div className="risk-details">
            <div className="detail-card">
              <h3>Explanation</h3>
              <p>{currentScore.explanation}</p>
            </div>

            {currentScore.filename && (
              <div className="detail-card">
                <h3>File</h3>
                <p>{currentScore.filename}</p>
              </div>
            )}

            {currentScore.severity_breakdown && (
              <div className="detail-card">
                <h3>Severity Breakdown</h3>
                <div className="severity-bars">
                  <div className="severity-item">
                    <span>High:</span>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{
                          width: `${Math.min(currentScore.severity_breakdown.HIGH * 10, 100)}%`,
                          background: "#ef4444",
                        }}
                      />
                    </div>
                    <span>{currentScore.severity_breakdown.HIGH}</span>
                  </div>
                  <div className="severity-item">
                    <span>Medium:</span>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{
                          width: `${Math.min(currentScore.severity_breakdown.MEDIUM * 10, 100)}%`,
                          background: "#f59e0b",
                        }}
                      />
                    </div>
                    <span>{currentScore.severity_breakdown.MEDIUM}</span>
                  </div>
                  <div className="severity-item">
                    <span>Low:</span>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{
                          width: `${Math.min(currentScore.severity_breakdown.LOW * 10, 100)}%`,
                          background: "#22c55e",
                        }}
                      />
                    </div>
                    <span>{currentScore.severity_breakdown.LOW}</span>
                  </div>
                </div>
              </div>
            )}

            {currentScore.total_issues !== undefined && (
              <div className="detail-card">
                <h3>Total Issues</h3>
                <p className="issues-count">{currentScore.total_issues}</p>
              </div>
            )}

            {currentScore.trend && (
              <div className="detail-card">
                <h3>Trend</h3>
                <div className="trend-info">
                  <span
                    className={`trend-direction ${currentScore.trend.direction}`}
                  >
                    {currentScore.trend.direction === "improving" && "📈 Improving"}
                    {currentScore.trend.direction === "worsening" && "📉 Worsening"}
                    {currentScore.trend.direction === "stable" && "➡️ Stable"}
                  </span>
                  <p>{currentScore.trend.detail}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .risk-scoring-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .risk-scoring-container h1 {
          color: #1e293b;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #64748b;
          margin-bottom: 30px;
        }

        .mode-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .mode-selector button {
          flex: 1;
          padding: 12px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #64748b;
          transition: all 0.2s;
        }

        .mode-selector button.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .scan-input-section,
        .overall-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .input-group label {
          font-weight: 600;
          color: #475569;
        }

        .input-group input {
          flex: 1;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
        }

        .input-group button,
        .overall-section button {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .input-group button:disabled,
        .overall-section button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .error-message {
          color: #ef4444;
          margin-top: 10px;
          font-size: 14px;
        }

        .risk-results {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 30px;
        }

        .score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 30px;
        }

        .score-circle {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 8px solid;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
        }

        .score-value {
          font-size: 48px;
          font-weight: bold;
          color: #1e293b;
        }

        .score-label {
          font-size: 14px;
          color: #64748b;
        }

        .risk-badge {
          padding: 10px 24px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 18px;
        }

        .risk-details {
          display: grid;
          gap: 20px;
        }

        .detail-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }

        .detail-card h3 {
          margin: 0 0 10px 0;
          color: #1e293b;
          font-size: 16px;
        }

        .detail-card p {
          color: #475569;
          margin: 0;
          line-height: 1.6;
        }

        .issues-count {
          font-size: 32px;
          font-weight: bold;
          color: #1e293b;
        }

        .severity-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .severity-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .severity-item span:first-child {
          width: 80px;
          font-weight: 600;
          color: #475569;
        }

        .bar-container {
          flex: 1;
          height: 24px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .severity-item span:last-child {
          width: 30px;
          text-align: right;
          font-weight: 600;
          color: #475569;
        }

        .trend-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .trend-direction {
          font-weight: 600;
          font-size: 16px;
        }

        .trend-direction.improving {
          color: #22c55e;
        }

        .trend-direction.worsening {
          color: #ef4444;
        }

        .trend-direction.stable {
          color: #64748b;
        }
        `}</style>
    </div>
  );
}
