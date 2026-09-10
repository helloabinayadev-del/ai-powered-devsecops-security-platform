import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FaCheckCircle, FaCloudUploadAlt, FaFileCode, FaSpinner } from "react-icons/fa";
import api from "../services/api";
import { formatDate } from "../utils/dateUtils";
import "./Upload.css";

interface ScanResult {
  filename: string;
  status: string;
  risk_level: string;
  issues: number;
  report_name: string;
  uploaded_by: string;
}

export default function Upload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".py")) {
      setMessage("Only Python (.py) files can be scanned.");
      return;
    }
    setSelectedFile(file);
    setMessage("");
    setScanResult(null);
    setProgress(0);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0]);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Choose a Python file before starting a scan.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      setProgress(0);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await api.post("/api/v1/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) =>
          event.total && setProgress(Math.round((event.loaded * 100) / event.total)),
      });
      setScanResult(response.data);
      setMessage("File uploaded and security scan completed.");
    } catch {
      setMessage("The upload could not be completed. Please retry in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="upload-container page">
      <header className="upload-header">
        <div>
          <p className="eyebrow">SECURITY SCANNING</p>
          <h1>Upload &amp; scan source code</h1>
          <p className="subtitle">Submit a Python file for automated Bandit and AI-powered security analysis.</p>
        </div>
      </header>

      <section className="upload-panel" aria-labelledby="upload-drop-title">
        <div
          className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          <FaCloudUploadAlt className="drop-icon" aria-hidden="true" />
          <h2 id="upload-drop-title">Drop a Python file here</h2>
          <p>or select one from your device</p>
          <label htmlFor="scan-file" className="sr-only" style={{ display: "none" }}>Upload Python File</label>
          <input
            ref={inputRef}
            id="scan-file"
            name="scan-file"
            type="file"
            accept=".py,text/x-python"
            onChange={handleFileChange}
            className="visually-hidden"
          />
          <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>
            Browse files
          </button>
          <p className="upload-hint">Python (.py) files only</p>
        </div>

        {selectedFile && (
          <div className="file-card" aria-live="polite">
            <FaFileCode aria-hidden="true" />
            <div>
              <h2>{selectedFile.name}</h2>
              <p>{(selectedFile.size / 1024).toFixed(2)} KB · Last modified {formatDate(selectedFile.lastModified)}</p>
            </div>
            <button className="upload-btn" disabled={loading} onClick={handleUpload}>
              {loading ? <><FaSpinner className="spin" /> Scanning…</> : "Start security scan"}
            </button>
          </div>
        )}

        {loading && (
          <div className="progress-box" aria-live="polite">
            <div className="progress-label">
              <span>Uploading and analyzing</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-bar" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {message && (
          <div className={`message-box ${scanResult ? "success" : ""}`} role="status">
            {scanResult && <FaCheckCircle aria-hidden="true" />}
            {message}
          </div>
        )}
      </section>

      {scanResult && (
        <section className="result-card" aria-labelledby="scan-result-title">
          <h2 id="scan-result-title">Scan result</h2>
          <dl className="scan-result-grid">
            <div><dt>Filename</dt><dd>{scanResult.filename}</dd></div>
            <div><dt>Status</dt><dd>{scanResult.status}</dd></div>
            <div><dt>Risk level</dt><dd>{scanResult.risk_level}</dd></div>
            <div><dt>Issues found</dt><dd>{scanResult.issues}</dd></div>
            <div><dt>Report</dt><dd>{scanResult.report_name}</dd></div>
            <div><dt>Uploaded by</dt><dd>{scanResult.uploaded_by}</dd></div>
          </dl>
        </section>
      )}
    </main>
  );
}
