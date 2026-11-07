import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import SymbolGlossary from "../components/SymbolGlossary.jsx";

export default function GlossaryPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto pb-16">
      <button
        onClick={() => navigate("/academy")}
        className="flex items-center gap-1 text-ivory/40 hover:text-ivory text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Dashboard
      </button>
      <h1 className="text-2xl font-bold text-ivory mb-1">Symbol Glossary</h1>
      <p className="text-ivory/50 text-sm mb-8">
        Every mathematical symbol used in your thesis, with its definition and your actual value.
      </p>
      <SymbolGlossary />
    </div>
  );
}
