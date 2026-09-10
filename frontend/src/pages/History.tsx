import { useEffect, useState } from "react";
import api from "../services/api";
import Toast, { type ToastType } from "../components/Toast";
import SkeletonLoader from "../components/SkeletonLoader";
import { formatDate } from "../utils/dateUtils";
import { FaSync, FaTimes, FaHistory } from "react-icons/fa";
import "./History.css";

interface HistoryItem {
  id: number;
  filename: string;
  status: string;
  report_name: string;
  risk_level: string;
  issues: number;
  scan_time: string;
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    let result = [...history];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        item.filename.toLowerCase().includes(q)
      );
    }

    if (filterRisk !== "All") {
      result = result.filter(
        (item) => item.risk_level.toLowerCase() === filterRisk.toLowerCase()
      );
    }

    setFilteredHistory(result);
    setCurrentPage(1);
  }, [history, search, filterRisk]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/history/");
      setHistory(response.data.history);
      setFilteredHistory(response.data.history);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to load scan history logs", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getRiskClass = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "safe":
        return "risk-safe";
      case "low":
        return "risk-low";
      case "medium":
        return "risk-medium";
      case "high":
      case "critical":
      case "unsafe":
      default:
        return "risk-high";
    }
  };

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="history-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="history-header">
        <h1><FaHistory style={{ marginRight: "10px" }} /> Scan History Audit Trail</h1>
        <button className="refresh-btn" onClick={loadHistory} aria-label="Refresh scan history">
          <FaSync /> Refresh
        </button>
      </div>

      <div className="filter-bar">
        <div style={{ position: "relative", flex: 1 }}>
          <label htmlFor="history-search-input" className="sr-only" style={{ display: "none" }}>Search scan history</label>
          <input
            id="history-search-input"
            name="historySearch"
            autoComplete="off"
            className="search-box"
            type="text"
            placeholder="Search history by filename..."
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
              aria-label="Clear search input"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <label htmlFor="history-risk-select" className="sr-only" style={{ display: "none" }}>Filter scan history by risk level</label>
        <select
          id="history-risk-select"
          name="historyRiskFilter"
          className="filter-select"
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
        >
          <option value="All">All Risk Levels</option>
          <option value="Safe">Safe</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High / Unsafe</option>
        </select>
      </div>

      {loading ? (
        <div className="table-card">
          <SkeletonLoader type="table" count={5} />
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Filename</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Issues</th>
                <th>Report File</th>
                <th>Scan Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                    No scan history records found.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td style={{ fontWeight: 600 }}>{item.filename}</td>
                    <td>{item.status}</td>
                    <td>
                      <span className={getRiskClass(item.risk_level)}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td>{item.issues}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {item.report_name}
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {formatDate(item.scan_time)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredHistory.length > itemsPerPage && (
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
        </div>
      )}
    </div>
  );
}