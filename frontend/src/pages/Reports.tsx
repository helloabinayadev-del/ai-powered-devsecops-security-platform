import { useEffect, useState } from "react";
import api from "../services/api";
import Toast, { type ToastType } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import SkeletonLoader from "../components/SkeletonLoader";
import { formatDate } from "../utils/dateUtils";
import { downloadJsonReport, downloadTextReport, downloadPdfReport } from "../services/reports";
import { FaSync, FaTrash, FaFilePdf, FaFileCode, FaFileAlt, FaTimes } from "react-icons/fa";

import "./Reports.css";

interface Report {
  filename: string;
  id?: number;
}

interface AIReport {
  report_type: string;
  generated_at: string;
  scan_id: number;
  filename: string;
  report_name: string | null;
  analysis_mode: string;
  executive_summary: string;
  security_score: {
    score: number;
    risk_level: string;
    explanation: string;
  };
  overall_security_status: string;
  vulnerability_summary: {
    total_issues: number;
    severity_breakdown: {
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
    findings: any[];
  };
  critical_findings: any[];
  medium_findings: any[];
  ai_explanation: string;
  business_impact: string[];
  attack_scenarios: any[];
  risk_analysis: {
    current_score: number;
    risk_level: string;
    trend: any;
    factors: any;
  };
  priority_recommendations: string[];
  secure_coding_suggestions: string[];
  developer_notes: string[];
  next_steps: string[];
  detailed_analyses: any[];
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scanId, setScanId] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    filename: string;
  }>({
    isOpen: false,
    filename: "",
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredReports(reports);
    } else {
      const q = search.toLowerCase();
      setFilteredReports(reports.filter((r) => r.filename.toLowerCase().includes(q)));
    }
  }, [search, reports]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/reports/");
      const list = response.data.reports.map((item: string) => ({
        filename: item,
      }));
      setReports(list);
      setFilteredReports(list);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to load report repository", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = async (filename: string) => {
    try {
      await downloadJsonReport(filename);
      setToast({ message: `Downloaded ${filename}`, type: "success" });
    } catch {
      setToast({ message: "Failed to download JSON report", type: "error" });
    }
  };

  const handleDownloadTxt = async (filename: string) => {
    try {
      await downloadTextReport(filename);
      setToast({ message: "Downloaded text security report", type: "success" });
    } catch {
      setToast({ message: "Failed to download TXT report", type: "error" });
    }
  };

  const handleDownloadPdf = async (filename: string) => {
    try {
      await downloadPdfReport(filename);
      setToast({ message: "Downloaded PDF security report", type: "success" });
    } catch {
      setToast({ message: "Failed to download PDF report", type: "error" });
    }
  };

  const generateAIReport = async (id: number) => {
    try {
      setAiLoading(true);
      const response = await api.get(`/api/v1/ai/reports/${id}`);
      if (response.data?.scan_id === id) {
        setAiReport(response.data);
        setShowAIReport(true);
        setToast({ message: "AI Security Report generated successfully", type: "success" });
      } else {
        setToast({ message: "Unable to generate AI report for this Scan ID", type: "warning" });
      }
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to generate AI report. Check Scan ID.", type: "error" });
    } finally {
      setAiLoading(false);
    }
  };

  const openDeleteModal = (filename: string) => {
    setDeleteModal({ isOpen: true, filename });
  };

  const confirmDelete = async () => {
    if (!deleteModal.filename) return;
    try {
      await api.delete(`/api/v1/reports/${deleteModal.filename}`);
      setToast({ message: `Deleted ${deleteModal.filename} successfully`, type: "success" });
      setDeleteModal({ isOpen: false, filename: "" });
      await loadReports();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to delete report", type: "error" });
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "SAFE":
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#f59e0b";
      case "HIGH":
      case "CRITICAL":
      case "UNSAFE":
        return "#ef4444";
      default:
        return "#3b82f6";
    }
  };

  return (
    <div className="reports-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="reports-header">
        <h1>Security Reports & Audits</h1>
        <button className="refresh-btn" onClick={loadReports} aria-label="Refresh reports list">
          <FaSync /> Refresh
        </button>
      </div>

      <div className="filter-bar">
        <div style={{ position: "relative", flex: 1 }}>
          <label htmlFor="reports-search-input" className="sr-only" style={{ display: "none" }}>Search reports</label>
          <input
            id="reports-search-input"
            name="reportsSearch"
            autoComplete="off"
            className="search-box"
            placeholder="Search reports by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* AI Report Generation Card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          Generate Comprehensive AI Security Report
        </h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <label htmlFor="scan-id-input" className="sr-only" style={{ display: "none" }}>Scan ID</label>
          <input
            id="scan-id-input"
            name="scanId"
            autoComplete="off"
            type="number"
            className="search-box"
            style={{ maxWidth: "240px" }}
            placeholder="Enter Scan ID (e.g. 1)"
            value={scanId || ""}
            onChange={(e) => setScanId(parseInt(e.target.value, 10) || null)}
          />
          <button
            type="button"
            className="refresh-btn"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            onClick={() => scanId && generateAIReport(scanId)}
            disabled={aiLoading || !scanId}
          >
            {aiLoading ? "Generating..." : "Generate AI Report"}
          </button>
        </div>
      </div>

      {/* AI Report Modal */}
      {showAIReport && aiReport && (
        <div className="card" style={{ marginBottom: "24px", borderColor: "var(--accent-purple)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>AI Executive Security Report</h2>
            <button
              type="button"
              className="action-btn"
              onClick={() => setShowAIReport(false)}
              aria-label="Close AI report view"
            >
              <FaTimes />
            </button>
          </div>
          <div>
            <h4 style={{ color: "var(--accent-cyan)", marginBottom: "8px" }}>Executive Summary</h4>
            <p style={{ lineHeight: "1.6", color: "var(--text-secondary)", marginBottom: "16px" }}>
              {aiReport.executive_summary}
            </p>

            <div style={{ display: "flex", gap: "16px", marginBottom: "16px", alignItems: "center" }}>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  color: getRiskColor(aiReport.security_score.risk_level),
                }}
              >
                Score: {aiReport.security_score.score}/100
              </div>
              <span className="risk-badge" style={{ background: getRiskColor(aiReport.security_score.risk_level), color: "#fff" }}>
                {aiReport.security_score.risk_level}
              </span>
            </div>

            {aiReport.priority_recommendations?.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4>Priority Recommendations</h4>
                <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
                  {aiReport.priority_recommendations.map((action, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Generated on {formatDate(aiReport.generated_at)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="table-card">
          <SkeletonLoader type="table" count={5} />
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Report File</th>
                <th>View JSON</th>
                <th>Export TXT</th>
                <th>Export PDF</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px" }}>
                    No security reports available.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.filename}>
                    <td style={{ fontWeight: 600 }}>{report.filename}</td>
                    <td>
                      <button
                        type="button"
                        className="download-btn json-btn"
                        onClick={() => handleDownloadJson(report.filename)}
                        title="Download JSON Report"
                        aria-label={`Download JSON report for ${report.filename}`}
                      >
                        <FaFileCode /> JSON
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="download-btn txt-btn"
                        onClick={() => handleDownloadTxt(report.filename)}
                        title="Download TXT Report"
                        aria-label={`Download TXT report for ${report.filename}`}
                      >
                        <FaFileAlt /> TXT
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="download-btn pdf-btn"
                        onClick={() => handleDownloadPdf(report.filename)}
                        title="Download PDF Report"
                        aria-label={`Download PDF report for ${report.filename}`}
                      >
                        <FaFilePdf /> PDF
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        onClick={() => openDeleteModal(report.filename)}
                        title="Delete Report"
                        aria-label={`Delete report ${report.filename}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Security Report"
        message={`Are you sure you want to delete report "${deleteModal.filename}"? This will permanently delete all associated report formats.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, filename: "" })}
      />
    </div>
  );
}
