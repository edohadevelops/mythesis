/**
 * Academy root — layout wrapper + sub-routes
 * Lives at /academy/*
 * Never modifies ThesisApp.jsx or its routes.
 */
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AcademyDashboard from "./pages/AcademyDashboard.jsx";
import MathLab from "./pages/MathLab.jsx";
import ThesisExplorer from "./pages/ThesisExplorer.jsx";
import MockDefense from "./pages/MockDefense.jsx";
import GlossaryPage from "./pages/GlossaryPage.jsx";
import CRICalculator from "./pages/CRICalculator.jsx";
import VisualizationsPage from "./pages/VisualizationsPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AITutor from "./pages/AITutor.jsx";
import ThesisFullExplorer from "./pages/ThesisFullExplorer.jsx";
import { GraduationCap, Home, User, Bot } from "lucide-react";

function AcademyLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    // Lazy import to avoid bundling auth everywhere
    import("./auth.js").then(({ getUser }) => {
      const u = getUser();
      setUserEmail(u?.email || null);
    });
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#101D32",
        color: "#F6F2E9",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: "rgba(16,29,50,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(246,242,233,0.08)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate("/academy")}
            className="flex items-center gap-2 text-sm font-semibold hover:text-gold transition-colors"
            style={{ color: "#C6A36A" }}
          >
            <GraduationCap size={18} />
            F90 Defense Academy
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate("/academy/tutor")}
            className="text-xs opacity-40 hover:opacity-80 transition-opacity flex items-center gap-1 mr-2"
          >
            <Bot size={12} />
            Tutor
          </button>
          <button
            onClick={() => navigate("/academy/auth")}
            className="text-xs opacity-40 hover:opacity-80 transition-opacity flex items-center gap-1 mr-3"
          >
            <User size={12} />
            {userEmail ? userEmail.split("@")[0] : "Sign in"}
          </button>
          <a
            href="/"
            className="text-xs opacity-40 hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            <Home size={12} />
            Tracker
          </a>
        </div>
      </div>

      {/* Page content */}
      <div className="px-4 pt-8">{children}</div>
    </div>
  );
}

export default function AcademyRoot() {
  return (
    <AcademyLayout>
      <Routes>
        <Route index element={<AcademyDashboard />} />
        <Route path="thesis" element={<ThesisExplorer />} />
        <Route path="math" element={<MathLab />} />
        <Route path="math/:lessonId" element={<MathLab />} />
        <Route path="defense" element={<MockDefense />} />
        <Route path="glossary" element={<GlossaryPage />} />
        <Route path="cri" element={<CRICalculator />} />
        <Route path="visualize" element={<VisualizationsPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="tutor" element={<AITutor />} />
        <Route path="explore" element={<ThesisFullExplorer />} />
      </Routes>
    </AcademyLayout>
  );
}
