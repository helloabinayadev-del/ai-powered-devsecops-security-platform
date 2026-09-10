import { Component, type ErrorInfo, type ReactNode } from "react";
import { FaExclamationTriangle, FaRedo } from "react-icons/fa";
import "./ErrorBoundary.css";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Application error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <main className="error-page"><section className="error-card" role="alert"><FaExclamationTriangle aria-hidden="true" /><p className="eyebrow">APPLICATION ERROR</p><h1>We couldn’t load this view</h1><p>An unexpected error interrupted the page. Your session and security scan data are unchanged.</p><button type="button" onClick={() => window.location.reload()}><FaRedo aria-hidden="true" /> Reload application</button></section></main>;
    return this.props.children;
  }
}
