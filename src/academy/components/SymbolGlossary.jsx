import React, { useState } from "react";
import { Eq } from "./KaTeX.jsx";

const SYMBOLS = [
  { sym: "\\lambda_{ij}", name: "Factor loading", desc: "Effect of factor j on item i in the EFA model" },
  { sym: "\\xi_j", name: "Latent factor", desc: "Unobserved factor j (Practical Pressure, Emotional Strain)" },
  { sym: "\\Phi", name: "Factor correlation matrix", desc: "Correlation between factors; non-identity under oblique rotation" },
  { sym: "\\Psi", name: "Unique variance matrix", desc: "Diagonal matrix of item-specific (non-shared) variances" },
  { sym: "\\Sigma", name: "Reproduced covariance matrix", desc: "ΛΦΛᵀ + Ψ — predicted by the EFA model" },
  { sym: "\\hat{R}", name: "Sample correlation matrix", desc: "Observed correlations among the 11 survey domains" },
  { sym: "\\text{RMSR}", name: "Root mean square residual", desc: "Average discrepancy between observed and reproduced correlations. Your value: 0.060 (good)" },
  { sym: "\\text{RMSEA}", name: "Root mean square error of approximation", desc: "Parsimony-corrected fit index. Your value: 0.098 (marginal; sample-size-sensitive)" },
  { sym: "\\text{TLI}", name: "Tucker-Lewis Index", desc: "Fit relative to null model, penalised for complexity. Your value: 0.867 (marginal)" },
  { sym: "\\text{KMO}", name: "Kaiser-Meyer-Olkin", desc: "Sampling adequacy for EFA. Your value: 0.822 (meritorious)" },
  { sym: "C", name: "Composite factor score", desc: "(ξ₁ + ξ₂)/2 — mean of Practical and Emotional factor scores" },
  { sym: "C_{\\min}", name: "Minimum composite", desc: "−2.004654 — anchors the 0 end of the F90-CRI scale" },
  { sym: "C_{\\max}", name: "Maximum composite", desc: "2.461879 — anchors the 100 end of the F90-CRI scale" },
  { sym: "\\text{F90-CRI}", name: "F90 Composite Index", desc: "100 · (C + 2.004654) / 4.466533; your sample mean: 44.88, SD: 19.01" },
  { sym: "\\rho_s", name: "Spearman ρ", desc: "Rank correlation coefficient; your CRI vs PHQ-2: 0.409, p<.001" },
  { sym: "\\lambda_{\\text{LASSO}}", name: "LASSO penalty", desc: "Controls sparsity in logistic regression; λ.min gives 6.6 predictors (AUC=0.861), λ.1se gives 2.2 (AUC=0.836)" },
  { sym: "\\alpha", name: "Cronbach's alpha", desc: "Internal consistency reliability of multi-item scales" },
  { sym: "h^2_i", name: "Communality", desc: "Proportion of item i's variance explained by all factors" },
  { sym: "n", name: "Sample size", desc: "N = 133 participants in your study" },
  { sym: "p", name: "Number of items/variables", desc: "p = 11 adjustment domains in your survey" },
  { sym: "m", name: "Number of factors", desc: "m = 2 (Practical Pressure + Emotional/Interpersonal Strain)" },
];

export default function SymbolGlossary({ compact = false }) {
  const [search, setSearch] = useState("");
  const filtered = SYMBOLS.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={compact ? "" : "max-w-3xl mx-auto"}>
      {!compact && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search symbols…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-ivory placeholder-ivory/40 focus:outline-none focus:border-gold text-sm"
          />
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/20 text-left">
            <th className="pb-2 pr-6 text-gold font-medium w-24">Symbol</th>
            <th className="pb-2 pr-6 text-gold font-medium w-40">Name</th>
            <th className="pb-2 text-gold font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-2 pr-6 font-mono">
                <Eq>{s.sym}</Eq>
              </td>
              <td className="py-2 pr-6 opacity-90 font-medium">{s.name}</td>
              <td className="py-2 opacity-70 leading-snug">{s.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p className="text-center opacity-50 py-8 text-sm">No symbols matching "{search}"</p>
      )}
    </div>
  );
}
