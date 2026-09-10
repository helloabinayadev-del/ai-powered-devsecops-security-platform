import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaShieldAlt, FaUser } from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setMessage("Enter your username and password to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");
      const formData = new URLSearchParams({ username, password });
      const response = await api.post("/api/v1/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(response.data.access_token, response.data.user);
      navigate("/dashboard");
    } catch {
      setMessage("Unable to sign in. Check your credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand" aria-hidden="true"><FaShieldAlt /></div>
        <p className="eyebrow">SECURITY OPERATIONS</p>
        <h1 id="login-title">AI-Powered DevSecOps Security Platform</h1>
        <p className="login-subtitle">Enterprise AI Security Management</p>
        <form className="login-form" onSubmit={handleLogin} noValidate>
          <div className="field-group">
            <label htmlFor="login-username">Username</label>
            <div className="input-with-icon"><FaUser aria-hidden="true" /><input id="login-username" name="username" type="text" autoComplete="username" placeholder="Enter your username" value={username} onChange={(event) => setUsername(event.target.value)} /></div>
          </div>
          <div className="field-group">
            <div className="field-label-row"><label htmlFor="login-password">Password</label><a href="mailto:support@example.com?subject=Password%20reset">Forgot password?</a></div>
            <div className="input-with-icon"><FaLock aria-hidden="true" /><input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
          </div>
          <label className="remember-me" htmlFor="remember-session"><input id="remember-session" name="remember" type="checkbox" defaultChecked /> Keep me signed in</label>
          {message && <p className="login-message" role="alert">{message}</p>}
          <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in securely"}</button>
        </form>
        <footer className="login-footer">AI-Powered DevSecOps Security Platform · Version 1.0 · © {new Date().getFullYear()}</footer>
      </section>
    </main>
  );
}
