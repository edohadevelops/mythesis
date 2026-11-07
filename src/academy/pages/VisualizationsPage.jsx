/**
 * Visualizations hub — interactive charts for LASSO, ROC, and EFA
 */
import React, { useState } from "react";
import LASSOPath from "../components/visualizations/LASSOPath.jsx";
import ROCVisualizer from "../components/visualizations/ROCVisualizer.jsx";
import { BarChart2, TrendingUp, GitBranch } from "lucide-react";

const TABS = [
  { id: "lasso", label: "LASSO Path", icon: TrendingUp },
  { id: "roc",   label: "ROC Curves", icon: BarChart2 },
];

function EFALoadingHeatmap() {
  // Factor loadings from thesis Table X (primary loadings)
  const domains = [
    { label: "Financial Strain",     f1: 0.782, f2: 0.054 },
    { label: "Academic Pressure",    f1: 0.714, f2: 0.089 },
    { label: "Research Workload",    f1: 0.690, f2: 0.112 },
    { label: "Housing",              f1: 0.651, f2: 0.070 },
    { label: "Time Management",      f1: 0.634, f2: 0.098 },
    { label: "Career Uncertainty",   f1: 0.621, f2: 0.141 },
    { label: "Advisor Relationship", f1: 0.098, f2: 0.831 },
    { label: "Sense of Belonging",   f1: 0.143, f2: 0.779 },
    { label: "Social Isolation",     f1: 0.187, f2: 0.743 },
    { label: "Work-Life Balance",    f1: 0.312, f2: 0.598 },
    { label: "Discrimination",       f1: 0.201, f2: 0.541 },
  ];

  function cellColor(val, factor) {
    const base = factor === 1 ? [198, 163, 106] : [111, 146, 137]; // gold / sage
    const alpha = Math.abs(val);
    return `rgba(${base[0]},${base[1]},${base[2]},${alpha})`;
  }

  return (
    <div className="rounded-xl bg-navy-800/60 border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-ivory mb-1">EFA Factor Loading Heatmap</h3>
      <p className="text-xs text-ivory/50 mb-4">
        Factor loadings from Promax rotation (N=133, 2 factors).
        Primary loadings highlighted. Factor correlation φ=0.395.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-ivory/40 font-normal pb-2 pr-3">Domain</th>
              <th className="text-center text-gold font-semibold pb-2 px-2 w-20">F1 Practical</th>
              <th className="text-center text-sage font-semibold pb-2 px-2 w-20">F2 Emotional</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => {
              const primary = d.f1 > d.f2 ? 1 : 2;
              return (
                <tr key={d.label} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 text-ivory/70">{d.label}</td>
                  <td className="py-1.5 px-2 text-center">
                    <div
                      className="rounded px-2 py-0.5 inline-block font-mono"
                      style={{
                        background: cellColor(d.f1, 1),
                        color: primary === 1 ? "#101D32" : "rgba(246,242,233,0.5)",
                        fontWeight: primary === 1 ? 700 : 400,
                        border: primary === 1 ? "1px solid rgba(198,163,106,0.5)" : "1px solid transparent",
                      }}
                    >
                      {d.f1.toFixed(3)}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <div
                      className="rounded px-2 py-0.5 inline-block font-mono"
                      style={{
                        background: cellColor(d.f2, 2),
                        color: primary === 2 ? "#101D32" : "rgba(246,242,233,0.5)",
                        fontWeight: primary === 2 ? 700 : 400,
                        border: primary === 2 ? "1px solid rgba(111,146,137,0.5)" : "1px solid transparent",
                      }}
                    >
                      {d.f2.toFixed(3)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-ivory/40">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gold/80" />
          <span>Primary F1 loading</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-sage/80" />
          <span>Primary F2 loading</span>
        </div>
        <div className="ml-auto">φ = 0.395</div>
      </div>
    </div>
  );
}

export default function VisualizationsPage() {
  const [tab, setTab] = useState("lasso");

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ivory mb-1">Interactive Visualizations</h1>
        <p className="text-ivory/50 text-sm">
          Explore your thesis models dynamically — LASSO shrinkage paths, ROC performance curves, and EFA factor loadings
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                tab === t.id
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "text-ivory/50 hover:text-ivory/80 hover:bg-white/5"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
        <button
          onClick={() => setTab("efa")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            tab === "efa"
              ? "bg-gold/20 text-gold border border-gold/30"
              : "text-ivory/50 hover:text-ivory/80 hover:bg-white/5"
          }`}
        >
          <GitBranch size={15} />
          EFA Loadings
        </button>
      </div>

      {/* Content */}
      {tab === "lasso" && (
        <div>
          <LASSOPath />
          <div className="mt-4 rounded-lg bg-white/5 border border-white/8 p-4 text-xs text-ivory/50">
            <strong className="text-ivory/70">Reading this chart:</strong> As λ increases (right),
            predictors shrink toward zero and eventually are excluded. At λ.min, ~6.6 predictors remain active
            (AUC=0.861). At λ.1se, ~2.2 remain (AUC=0.836). The chart uses illustrative paths
            consistent with your thesis — exact paths require the glmnet model object.
          </div>
        </div>
      )}

      {tab === "roc" && (
        <div>
          <ROCVisualizer />
          <div className="mt-4 rounded-lg bg-white/5 border border-white/8 p-4 text-xs text-ivory/50">
            <strong className="text-ivory/70">Reading this chart:</strong> The ROC curve plots
            sensitivity vs. (1−specificity) across all possible classification thresholds. The closer
            the curve to the top-left corner, the better the discrimination. AUC = area under this
            curve. The operating point (gold dot) moves as you adjust the threshold — higher threshold
            = higher specificity but lower sensitivity.
          </div>
        </div>
      )}

      {tab === "efa" && (
        <div>
          <EFALoadingHeatmap />
          <div className="mt-4 rounded-lg bg-white/5 border border-white/8 p-4 text-xs text-ivory/50">
            <strong className="text-ivory/70">Reading this table:</strong> Bold numbers indicate
            primary loadings (highest for that domain). Stronger color = higher loading magnitude.
            Work-Life Balance has moderate cross-loadings on both factors (0.312 F1, 0.598 F2) —
            a limitation worth noting in your defense.
          </div>
        </div>
      )}
    </div>
  );
}
