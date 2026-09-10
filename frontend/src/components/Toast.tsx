import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import "./Toast.css";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastProps {
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, title, duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const getDefaultTitle = () => {
    switch (type) {
      case "success":
        return "Success";
      case "warning":
        return "Warning";
      case "error":
        return "Error";
      case "info":
      default:
        return "Information";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="toast-icon" />;
      case "warning":
        return <FaExclamationTriangle className="toast-icon" />;
      case "error":
        return <FaTimesCircle className="toast-icon" />;
      case "info":
      default:
        return <FaInfoCircle className="toast-icon" />;
    }
  };

  return (
    <div
      className={`toast-notification toast-${type} ${visible ? "toast-enter" : "toast-exit"}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-header-row">
        <div className="toast-icon-wrapper">{getIcon()}</div>
        <div className="toast-text-container">
          <h4 className="toast-title">{title || getDefaultTitle()}</h4>
          <p className="toast-message">{message}</p>
        </div>
        <button
          type="button"
          className="toast-close-btn"
          onClick={handleClose}
          aria-label="Dismiss notification"
        >
          <FaTimes />
        </button>
      </div>
      <div
        className="toast-progress-bar"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

