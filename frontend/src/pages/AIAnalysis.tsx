import { useState } from "react";
import api from "../services/api";

interface Vulnerability {
  vulnerability_id: string;
  vulnerability_type: string;
  severity: string;
  confidence: string;
  filename: string;
  line_number: number;
  issue_text: string;
  simple_explanation: string;
  technical_explanation: string;
  business_impact: string;
  attack_scenario: string;
  risk_reasoning: string;
  recommended_remediation: string;
  secure_coding_example: string;
}

interface ScanAnalysis {
  scan_id: number;
  filename: string;
  total_vulnerabilities: number;
  analyses: Vulnerability[];
  analysis_mode: string;
}

export default function AIAnalysis() {
  const [scanId, setScanId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

  const handleAnalyze = async () => {
    if (!scanId) {
      setError("Please enter a scan ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post(`/api/v1/ai/analyze/${scanId}`);
      setAnalysis(response.data);
    } catch (error: any) {
      console.error(error);
      setError(error.response?.data?.detail || "Failed to analyze scan");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "HIGH": return "#ef4444";
      case "MEDIUM": return "#f59e0b";
      case "LOW": return "#22c55e";
      default: return "#64748b";
    }
  };

  return (
    <div className="ai-analysis-container">
      <h1>AI Vulnerability Analysis</h1>
      <p className="subtitle">
        Get detailed AI-powered explanations for security vulnerabilities
      </p>

      <div className="scan-input-section">
          <div className="input-group">
            <label>Scan ID:</label>
            <input
              type="number"
              value={scanId || ""}
              onChange={(e) => setScanId(parseInt(e.target.value) || null)}
              placeholder="Enter scan ID"
            />
            <button onClick={handleAnalyze} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        {analysis && (
          <div className="analysis-results">
            <div className="analysis-header">
              <h2>Analysis Results</h2>
              <div className="analysis-meta">
                <span><strong>File:</strong> {analysis.filename}</span>
                <span><strong>Total Vulnerabilities:</strong> {analysis.total_vulnerabilities}</span>
                <span><strong>Analysis Mode:</strong> {analysis.analysis_mode}</span>
              </div>
            </div>

            <div className="vulnerabilities-list">
              {analysis.analyses.map((vuln) => (
                <div
                  key={vuln.vulnerability_id}
                  className="vulnerability-card"
                  onClick={() => setSelectedVuln(vuln)}
                  style={{ borderLeft: `4px solid ${getSeverityColor(vuln.severity)}` }}
                >
                  <div className="vuln-header">
                    <h3>{vuln.vulnerability_type}</h3>
                    <span className="severity-badge" style={{ background: getSeverityColor(vuln.severity) }}>
                      {vuln.severity}
                    </span>
                  </div>
                  <p className="vuln-location">
                    {vuln.filename}:{vuln.line_number}
                  </p>
                  <p className="vuln-summary">{vuln.simple_explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedVuln && (
          <div className="vuln-detail-modal" onClick={() => setSelectedVuln(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedVuln.vulnerability_type}</h2>
                <button onClick={() => setSelectedVuln(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Simple Explanation</h3>
                  <p>{selectedVuln.simple_explanation}</p>
                </div>
                <div className="detail-section">
                  <h3>Technical Explanation</h3>
                  <p>{selectedVuln.technical_explanation}</p>
                </div>
                <div className="detail-section">
                  <h3>Business Impact</h3>
                  <p>{selectedVuln.business_impact}</p>
                </div>
                <div className="detail-section">
                  <h3>Attack Scenario</h3>
                  <p>{selectedVuln.attack_scenario}</p>
                </div>
                <div className="detail-section">
                  <h3>Risk Reasoning</h3>
                  <p>{selectedVuln.risk_reasoning}</p>
                </div>
                <div className="detail-section">
                  <h3>Recommended Remediation</h3>
                  <p>{selectedVuln.recommended_remediation}</p>
                </div>
                <div className="detail-section">
                  <h3>Secure Coding Example</h3>
                  <pre>{selectedVuln.secure_coding_example}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .ai-analysis-container {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
          }

          .ai-analysis-container h1 {
            color: #1e293b;
            margin-bottom: 10px;
          }

          .subtitle {
            color: #64748b;
            margin-bottom: 30px;
          }

          .scan-input-section {
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

          .input-group button {
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          }

          .input-group button:disabled {
            background: #94a3b8;
            cursor: not-allowed;
          }

          .error-message {
            color: #ef4444;
            margin-top: 10px;
            font-size: 14px;
          }

          .analysis-results {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .analysis-header {
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
          }

          .analysis-header h2 {
            margin: 0 0 15px 0;
            color: #1e293b;
          }

          .analysis-meta {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 14px;
            color: #64748b;
          }

          .vulnerabilities-list {
            padding: 20px;
            display: grid;
            gap: 15px;
          }

          .vulnerability-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .vulnerability-card:hover {
            background: #f1f5f9;
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .vuln-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .vuln-header h3 {
            margin: 0;
            color: #1e293b;
            font-size: 16px;
          }

          .severity-badge {
            padding: 4px 12px;
            border-radius: 12px;
            color: white;
            font-size: 12px;
            font-weight: 600;
          }

          .vuln-location {
            color: #64748b;
            font-size: 13px;
            margin: 5px 0;
          }

          .vuln-summary {
            color: #475569;
            margin: 10px 0 0 0;
            font-size: 14px;
          }

          .vuln-detail-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 800px;
            max-height: 90vh;
            width: 90%;
            overflow-y: auto;
          }

          .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header h2 {
            margin: 0;
            color: #1e293b;
          }

          .modal-header button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #64748b;
          }

          .modal-body {
            padding: 20px;
          }

          .detail-section {
            margin-bottom: 25px;
          }

          .detail-section h3 {
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 16px;
          }

          .detail-section p {
            color: #475569;
            line-height: 1.6;
            margin: 0;
          }

          .detail-section pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 0;
          }
        `}</style>
    </div>
  );
}
