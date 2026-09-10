import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import SkeletonLoader from "./components/SkeletonLoader";
import Navbar from "./components/layout/Navbar";
import Topbar from "./components/layout/Topbar";

import "./styles/App.css";
import "./styles/Enterprise.css";

// Lazy-loaded page components
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Upload = lazy(() => import("./pages/Upload"));
const History = lazy(() => import("./pages/History"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Files = lazy(() => import("./pages/Files"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AISummary = lazy(() => import("./pages/AISummary"));
const AIAnalysis = lazy(() => import("./pages/AIAnalysis"));
const RiskScoring = lazy(() => import("./pages/RiskScoring"));
const SecurityAssistant = lazy(() => import("./pages/SecurityAssistant"));
const Email = lazy(() => import("./pages/Email"));
const Health = lazy(() => import("./pages/Health"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-8"><SkeletonLoader type="card" count={3} /></div>}>
        <Routes>
          {/* Login & Register */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Navbar />

                  <main className="main-content">
                    <Topbar />
                    <Suspense fallback={<div className="p-8"><SkeletonLoader type="card" count={3} /></div>}>
                      <Routes>
                        <Route path="home" element={<Home />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="upload" element={<Upload />} />
                        <Route path="history" element={<History />} />
                        <Route path="statistics" element={<Statistics />} />
                        <Route path="files" element={<Files />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="ai-summary" element={<AISummary />} />
                        <Route path="ai-analysis" element={<AIAnalysis />} />
                        <Route path="risk-scoring" element={<RiskScoring />} />
                        <Route path="security-assistant" element={<SecurityAssistant />} />
                        <Route path="email" element={<Email />} />
                        <Route path="health" element={<Health />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="admin/users" element={<AdminUsers />} />

                        {/* Default Route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
