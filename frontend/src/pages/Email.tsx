import { useEffect, useState } from "react";
import api from "../services/api";
import Toast, { type ToastType } from "../components/Toast";
import SkeletonLoader from "../components/SkeletonLoader";
import { formatDate } from "../utils/dateUtils";
import { FaPaperPlane, FaSync, FaEnvelope, FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaFileAlt } from "react-icons/fa";

interface ReportFile {
  id: number;
  filename: string;
  status: string;
  risk_level: string;
  issues: number;
  scan_time: string;
  report_name: string;
}

interface EmailHistoryItem {
  id: number;
  receiver: string;
  report_name: string;
  sent_by: string;
  sent_at?: string;
  sent_time?: string;
  formatted_sent_time?: string;
}

interface SmtpStatus {
  status: string;
  message: string;
  smtp_server?: string;
  smtp_port?: string;
  email_address?: string;
  error?: string;
}

export default function Email() {
  const [receiverEmail, setReceiverEmail] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadReports(), loadHistory(), checkSmtpStatus()]);
    } catch (error) {
      console.error("Error loading email page data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const response = await api.get("/api/v1/files/");
      setReports(response.data.files || []);
    } catch (error) {
      console.error("Failed to load report files:", error);
      setReports([]);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get("/api/v1/email/history");
      setHistory(response.data || []);
    } catch (error) {
      console.error("Failed to load email history:", error);
      setHistory([]);
    }
  };

  const checkSmtpStatus = async () => {
    try {
      const response = await api.get("/api/v1/email/status");
      setSmtpStatus(response.data);
    } catch (error: any) {
      setSmtpStatus({
        status: "error",
        message: error?.response?.data?.message || "Failed to contact SMTP status service",
      });
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const sendEmail = async () => {
    if (!receiverEmail || !selectedReport) {
      setToast({ message: "Please enter a valid recipient email and select a report file.", type: "error" });
      return;
    }

    setSending(true);
    try {
      const response = await api.post("/api/v1/email/send", null, {
        params: {
          receiver_email: receiverEmail,
          filename: selectedReport,
        },
      });

      if (response.data.success) {
        setToast({ message: response.data.message || "Security report emailed successfully!", type: "success" });
        setReceiverEmail("");
        setSelectedReport("");
        loadHistory();
      } else {
        setToast({ message: response.data.message || "Failed to send email.", type: "error" });
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || "Failed to send email. Check SMTP credentials.";
      setToast({ message: errorMsg, type: "error" });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = () => {
    if (!smtpStatus) return null;
    const s = smtpStatus.status.toLowerCase();

    if (s === "connected" || s === "configured") {
      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(34, 197, 94, 0.18)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.4)", padding: "6px 14px", borderRadius: "20px", fontWeight: 600, fontSize: "0.9rem" }}>
          <FaCheckCircle /> SMTP Connected ({smtpStatus.email_address || "Configured"})
        </div>
      );
    }
    if (s === "not_configured") {
      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(245, 158, 11, 0.18)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "6px 14px", borderRadius: "20px", fontWeight: 600, fontSize: "0.9rem" }}>
          <FaExclamationCircle /> SMTP Credentials Not Configured
        </div>
      );
    }
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.18)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "6px 14px", borderRadius: "20px", fontWeight: 600, fontSize: "0.9rem" }}>
        <FaTimesCircle /> SMTP Error: {smtpStatus.message || smtpStatus.error}
      </div>
    );
  };

  return (
    <div className="page email-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#F97316", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaEnvelope /> Email Report Dispatch Center
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Dispatch security scan reports & attachments via SMTP</p>
        </div>
        <button
          className="refresh-btn"
          onClick={loadAllData}
          aria-label="Refresh SMTP status and email history"
        >
          <FaSync /> Refresh
        </button>
      </div>

      {/* SMTP Status Overview Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0" }}>SMTP Service Status</h3>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Server: {smtpStatus?.smtp_server || "smtp.gmail.com"}:{smtpStatus?.smtp_port || "587"}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Send Form Card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.3rem", margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaEnvelope style={{ color: "#F97316" }} /> Send Security Report
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
          <div>
            <label htmlFor="receiver-email-input" style={{ display: "block", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>Recipient Email Address</label>
            <input
              id="receiver-email-input"
              name="receiverEmail"
              type="email"
              autoComplete="email"
              className="search-box"
              style={{ width: "100%" }}
              placeholder="e.g. security-lead@company.com"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="security-report-select" style={{ display: "block", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>Select Security Report File</label>
            <select
              id="security-report-select"
              name="selectedReport"
              className="filter-select"
              style={{ width: "100%" }}
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <option value="">Choose Report File...</option>
              {reports.map((report) => (
                <option key={report.id} value={report.report_name || report.filename}>
                  {report.filename} ({report.risk_level} Risk - {report.issues} Issues)
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={sendEmail}
          disabled={sending}
          style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
        >
          <FaPaperPlane /> {sending ? "Sending Security Report..." : "Send Report"}
        </button>
      </div>

      {/* Email History Table Card */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "1.3rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaFileAlt style={{ color: "#8B5CF6" }} /> Dispatch History Logs
          </h2>
          <button
            type="button"
            onClick={loadHistory}
            className="refresh-btn"
            style={{ padding: "6px 14px", fontSize: "0.85rem", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            aria-label="Refresh dispatch history logs"
            title="Refresh logs list"
          >
            <FaSync className={loading ? "spin" : ""} /> Refresh Logs
          </button>
        </div>

        {loading ? (
          <div className="table-card" style={{ overflowX: "auto" }}>
            <SkeletonLoader type="table" count={4} />
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <FaEnvelope style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)", margin: "0 0 6px 0", fontWeight: 600 }}>No Dispatch Logs Found</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
              Security scan reports dispatched via email will automatically be logged here.
            </p>
          </div>
        ) : (
          <div className="table-card" style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-card)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
              <thead>
                <tr>
                  <th scope="col" style={{ padding: "14px 18px", textAlign: "left" }}>Recipient</th>
                  <th scope="col" style={{ padding: "14px 18px", textAlign: "left" }}>Report File</th>
                  <th scope="col" style={{ padding: "14px 18px", textAlign: "left" }}>Sent By</th>
                  <th scope="col" style={{ padding: "14px 18px", textAlign: "left" }}>Dispatch Time</th>
                  <th scope="col" style={{ padding: "14px 18px", textAlign: "left" }}>Status</th>
                  <th scope="col" style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const sentTimeFormatted = formatDate(item.sent_time || item.sent_at || item.formatted_sent_time);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 600, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.receiver}>
                        {item.receiver}
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--accent-cyan)", fontWeight: 500, maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.report_name}>
                        {item.report_name}
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                        {item.sent_by || "Administrator"}
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {sentTimeFormatted}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "#22C55E",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          <FaCheckCircle style={{ fontSize: "0.75rem" }} /> Delivered
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setReceiverEmail(item.receiver);
                              setSelectedReport(item.report_name);
                              window.scrollTo({ top: 200, behavior: "smooth" });
                            }}
                            className="action-btn"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              borderRadius: "6px",
                              background: "var(--bg-secondary)",
                              color: "var(--text-primary)",
                              border: "1px solid var(--border-color)",
                              cursor: "pointer",
                            }}
                            aria-label={`Resend or select report for ${item.receiver}`}
                            title="Prefill send form with recipient & report file"
                          >
                            Resend
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
