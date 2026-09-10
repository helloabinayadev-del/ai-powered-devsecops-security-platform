import { useEffect, useState } from "react";
import api from "../services/api";
import Toast, { type ToastType } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import SkeletonLoader from "../components/SkeletonLoader";
import { formatDate } from "../utils/dateUtils";
import { downloadPdfReport, downloadJsonReport } from "../services/reports";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaDownload,
  FaTrash,
  FaRobot,
  FaSync,
  FaTimes,
} from "react-icons/fa";
import "./Files.css";

interface FileData {
  id: number;
  filename: string;
  status: string;
  risk_level: string;
  issues: number;
  scan_time: string;
  report_name: string;
}

export default function Files() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("scan_time");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    fileId: number | null;
    filename: string;
  }>({
    isOpen: false,
    fileId: null,
    filename: "",
  });

  useEffect(() => {
    loadFiles();
  }, []);

  // Debounce search input for high performance instant search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    filterAndSortFiles();
  }, [debouncedSearch, files, sortField, sortDirection, riskFilter, statusFilter]);

  async function loadFiles() {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/files/");
      setFiles(response.data.files);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to load file index", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const filterAndSortFiles = () => {
    let result = [...files];

    // Search by Repository Name, File Name, Risk Level, or Status
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (file) =>
          file.filename.toLowerCase().includes(q) ||
          (file.report_name && file.report_name.toLowerCase().includes(q)) ||
          file.risk_level.toLowerCase().includes(q) ||
          file.status.toLowerCase().includes(q)
      );
    }

    if (riskFilter !== "all") {
      result = result.filter((file) => file.risk_level.toLowerCase() === riskFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((file) => file.status.toLowerCase() === statusFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "filename") {
        comparison = a.filename.localeCompare(b.filename);
      } else if (sortField === "risk_level") {
        comparison = a.risk_level.localeCompare(b.risk_level);
      } else if (sortField === "issues") {
        comparison = a.issues - b.issues;
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      } else {
        comparison = new Date(a.scan_time).getTime() - new Date(b.scan_time).getTime();
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredFiles(result);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="sort-icon muted" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  const getRiskClass = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical":
      case "high":
      case "unsafe":
        return "risk-badge risk-high";
      case "medium":
        return "risk-badge risk-medium";
      case "low":
        return "risk-badge risk-low";
      case "safe":
      default:
        return "risk-badge risk-safe";
    }
  };

  const viewReport = async (reportName: string) => {
    if (!reportName) {
      setToast({ message: "No scan report available for this file", type: "warning" });
      return;
    }
    try {
      await downloadJsonReport(reportName);
      setToast({ message: "Downloaded scan JSON report", type: "success" });
    } catch {
      setToast({ message: "Failed to fetch scan report", type: "error" });
    }
  };

  const viewAIReport = async (fileId: number) => {
    try {
      const response = await api.get(`/api/v1/ai/reports/${fileId}`);
      if (response.data?.scan_id === fileId) {
        const reportWindow = window.open("", "_blank");
        if (reportWindow) {
          reportWindow.document.write(`
            <html>
              <head><title>AI Security Analysis Report</title></head>
              <body style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; line-height: 1.6;">
                <h2>AI-Powered DevSecOps Security Platform - Executive Report</h2>
                <pre style="white-space: pre-wrap; background: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
${JSON.stringify(response.data, null, 2)}
                </pre>
              </body>
            </html>
          `);
        }
      }
    } catch {
      setToast({ message: "AI report not generated yet. Run AI Analysis first.", type: "info" });
    }
  };

  const downloadReport = async (reportName: string) => {
    if (!reportName) {
      setToast({ message: "No report available to download", type: "warning" });
      return;
    }
    try {
      await downloadPdfReport(reportName);
      setToast({ message: "Downloaded PDF Security Report", type: "success" });
    } catch {
      setToast({ message: "Report download failed", type: "error" });
    }
  };

  const openDeleteModal = (fileId: number, filename: string) => {
    setDeleteModal({ isOpen: true, fileId, filename });
  };

  const confirmDelete = async () => {
    if (!deleteModal.fileId) return;
    try {
      await api.delete(`/api/v1/files/${deleteModal.fileId}`);
      setToast({ message: `Deleted ${deleteModal.filename} successfully`, type: "success" });
      setDeleteModal({ isOpen: false, fileId: null, filename: "" });
      await loadFiles();
    } catch {
      setToast({ message: "Failed to delete file", type: "error" });
    }
  };

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="files-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="files-header">
        <h1>Files Directory</h1>
        <button className="refresh-btn" onClick={loadFiles} aria-label="Refresh files list">
          <FaSync /> Refresh
        </button>
      </div>

      <div className="filters-row">
        <div className="enterprise-search-wrapper">
          <label htmlFor="files-search-input" className="sr-only" style={{ display: "none" }}>Search repositories</label>
          <input
            id="files-search-input"
            name="search"
            autoComplete="off"
            className="enterprise-search-input"
            placeholder="Search by repository name, file name, risk level, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search query"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <label htmlFor="risk-filter-select" className="sr-only" style={{ display: "none" }}>Filter by risk level</label>
        <select
          id="risk-filter-select"
          name="riskFilter"
          className="filter-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="safe">Safe</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High / Unsafe</option>
        </select>

        <label htmlFor="status-filter-select" className="sr-only" style={{ display: "none" }}>Filter by status</label>
        <select
          id="status-filter-select"
          name="statusFilter"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="table-card">
          <SkeletonLoader type="table" count={5} />
        </div>
      ) : (
        <>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort("filename")} style={{ cursor: "pointer" }}>
                    Filename {getSortIcon("filename")}
                  </th>
                  <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                    Status {getSortIcon("status")}
                  </th>
                  <th onClick={() => handleSort("risk_level")} style={{ cursor: "pointer" }}>
                    Risk {getSortIcon("risk_level")}
                  </th>
                  <th onClick={() => handleSort("issues")} style={{ cursor: "pointer" }}>
                    Issues {getSortIcon("issues")}
                  </th>
                  <th onClick={() => handleSort("scan_time")} style={{ cursor: "pointer" }}>
                    Scan Time {getSortIcon("scan_time")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px" }}>
                      No files matching the selected search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedFiles.map((file) => (
                    <tr key={file.id}>
                      <td style={{ fontWeight: 600 }}>{file.filename}</td>
                      <td>{file.status}</td>
                      <td>
                        <span className={getRiskClass(file.risk_level)}>
                          {file.risk_level}
                        </span>
                      </td>
                      <td>{file.issues}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        {formatDate(file.scan_time)}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="action-btn view-btn"
                            onClick={() => viewReport(file.report_name)}
                            title="View JSON Report"
                            aria-label={`View JSON report for ${file.filename}`}
                          >
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            className="action-btn ai-btn"
                            onClick={() => viewAIReport(file.id)}
                            title="View AI Report"
                            aria-label={`View AI report for ${file.filename}`}
                          >
                            <FaRobot />
                          </button>
                          <button
                            type="button"
                            className="action-btn download-btn"
                            onClick={() => downloadReport(file.report_name)}
                            title="Download PDF"
                            aria-label={`Download PDF for ${file.filename}`}
                          >
                            <FaDownload />
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            onClick={() => openDeleteModal(file.id, file.filename)}
                            title="Delete"
                            aria-label={`Delete ${file.filename}`}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Security Audit Record"
        message={`Are you sure you want to delete "${deleteModal.filename}"? This will permanently remove all associated scan logs and reports.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, fileId: null, filename: "" })}
      />
    </div>
  );
}
