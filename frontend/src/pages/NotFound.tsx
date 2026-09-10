import { Link } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import "./NotFound.css";

export default function NotFound() {
  return <main className="not-found page"><section><FaShieldAlt aria-hidden="true" /><p className="eyebrow">404 · ROUTE NOT FOUND</p><h1>This security console view doesn’t exist.</h1><p>The link may be outdated or you may not have access to that area.</p><Link to="/dashboard"><FaArrowLeft aria-hidden="true" /> Return to dashboard</Link></section></main>;
}
