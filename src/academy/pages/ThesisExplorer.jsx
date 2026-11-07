/**
 * Chapter 4 Results Explorer
 * Every result: what it is / why it matters / how it was computed / how to defend it
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EqBlock, Eq } from "../components/KaTeX.jsx";
import {
  SAMPLE,
  EFA,
  CRI,
  CORRELATIONS,
  LASSO,
  WORKED_EXAMPLE,
} from "../data/thesisResults.js";
import { ChevronLeft, ChevronDown, ChevronUp, Shield } from "lucide-react";

function ResultCard({ title, badge, children, defense }) {
  const [showDefense, setShowDefense] = useState(false);

  return (
    <div className="rounded-xl bg-navy-800/60 border border-white/10 mb-4 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sage/20 text-sage">
            {badge}
          </span>
          <h3 className="font-semibold text-ivory/90 text-sm">{title}</h3>
        </div>
        {children}
      </div>
      {defense && (
        <div className="border-t border-white/8">
          <button
            onClick={() => setShowDefense((s) => !s)}
            className="w-full px-5 py-3 flex items-center gap-2 text-sm text-terracotta/80 hover:text-terracotta hover:bg-terracotta/5 transition-colors"
          >
            <Shield size={14} />
            How to defend this
            {showDefense ? (
              <ChevronUp size={14} className="ml-auto" />
            ) : (
              <ChevronDown size={14} className="ml-auto" />
            )}
          </button>
          {showDefense && (
            <div className="px-5 pb-5 space-y-2">
              {defense.map((point, i) => (
                <div
                  key={i}
                  className="text-sm text-ivory/70 flex gap-3 bg-terracotta/5 rounded-lg p-3"
                >
                  <span className="text-terracotta shrink-0">Q:</span>
                  <span className="leading-snug">{point}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="text-xs text-ivory/40 mb-1">{label}</div>
      <div className="text-lg font-bold text-gold">{value}</div>
      {sub && <div className="text-xs text-ivory/40 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ThesisExplorer() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("sample");

  const sections = [
    { id: "sample", label: "Sample" },
    { id: "efa", label: "EFA" },
    { id: "cri", label: "F90-CRI" },
    { id: "corr", label: "Correlations" },
    { id: "lasso", label: "LASSO" },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <button
        onClick={() => navigate("/academy")}
        className="flex items-center gap-1 text-ivory/40 hover:text-ivory text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Dashboard
      </button>

      <h1 className="text-2xl font-bold text-ivory mb-1">Results Explorer</h1>
      <p className="text-ivory/50 text-sm mb-6">
        Chapter 4 — every result with what it means, why it matters, and how to defend it.
        All values are from your thesis manuscript.
      </p>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeSection === s.id
                ? "bg-gold text-navy"
                : "bg-white/10 text-ivory/60 hover:text-ivory"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── SAMPLE ── */}
      {activeSection === "sample" && (
        <>
          <ResultCard
            title="Participant Sample"
            badge="Descriptive"
            defense={[
              "Why only 133 participants? This reflects your IRB-approved sampling frame. For EFA with 11 variables, N=133 gives subject-to-variable ratio of 12:1 — adequate by most guidelines (minimum 5:1, prefer 10:1).",
              "Is the sample representative? It's a convenience sample from one institution. This limits generalizability, which you acknowledge as a limitation.",
              "50.38% PHQ-2 positive — isn't that too high? This is consistent with literature on doctoral student mental health. PHQ-2 is a sensitivity-optimized screen, not a diagnostic instrument.",
            ]}
          >
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Stat label="Total N" value={SAMPLE.N} />
              <Stat label="PHQ-2 Positive" value={SAMPLE.phq2Positive} sub="50.38%" />
              <Stat label="PHQ-2 Negative" value={SAMPLE.N - SAMPLE.phq2Positive} sub="49.62%" />
            </div>
            <p className="text-sm text-ivory/60 leading-relaxed">
              Your study enrolled {SAMPLE.N} first-year doctoral students. The near-equal split
              between PHQ-2 positive ({SAMPLE.phq2PositivePct}%) and negative groups is consistent
              with published rates of depression risk in doctoral populations.
            </p>
          </ResultCard>
        </>
      )}

      {/* ── EFA ── */}
      {activeSection === "efa" && (
        <>
          <ResultCard
            title="Data Suitability"
            badge="EFA Prerequisites"
            defense={[
              "KMO = 0.822 — what does this tell us? The 11 items share sufficient common variance to support factor extraction. KMO > 0.80 is 'meritorious' (Kaiser, 1974).",
              "What is Bartlett's test testing? H₀: the population correlation matrix is an identity matrix (all items uncorrelated). We reject this decisively (p<.001), confirming items are correlated — a prerequisite for EFA.",
            ]}
          >
            <div className="grid grid-cols-2 gap-3">
              <Stat label="KMO" value={EFA.kmo} sub="Meritorious (> 0.80)" />
              <Stat
                label="Bartlett χ²(55)"
                value={EFA.bartlettChi2}
                sub={`p ${EFA.bartlettP}`}
              />
            </div>
          </ResultCard>

          <ResultCard
            title="Two-Factor Solution Fit"
            badge="Model Fit"
            defense={[
              "RMSEA = 0.098 is above 0.08. How do you defend it? RMSEA is inflated in small-n EFA (Kenny et al., 2015). RMSR = 0.060 is good and less n-sensitive. Report both.",
              "TLI = 0.867 — below the 0.95 cutoff? TLI thresholds are ideal-case guidelines. Your absolute fit (RMSR) is good, and the model is interpretable and parsimonious.",
              "What extraction method did you use? Specify in your methods (commonly ML or PAF). Parallel analysis was used for factor retention.",
            ]}
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Stat label="RMSR" value={EFA.rmsr} sub="< 0.08 ✓ good" />
              <Stat label="TLI" value={EFA.tli} sub="Marginal (> 0.95 ideal)" />
              <Stat label="RMSEA" value={EFA.rmsea} sub="Marginal (< 0.08 ideal)" />
              <Stat label="Factor r" value={EFA.factorCorrelation} sub="Justifies oblique rotation" />
            </div>
          </ResultCard>

          <ResultCard
            title="Factor Loadings"
            badge="Structure"
            defense={[
              "How did you decide which items belong to which factor? Each item was assigned to the factor on which it had the highest primary loading. No cross-loadings exceeded 0.30 for the primary factor's items.",
              "Why is 'Work-Life Balance' on Factor 2 not Factor 1? It loads 0.598 on emotional and 0.312 on practical. The primary loading determines assignment; it loads higher on emotional — suggesting balance struggles feel more interpersonally burdensome than logistically in this sample.",
            ]}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-2 pr-4 text-ivory/40 font-medium">Domain</th>
                    <th className="pb-2 pr-4 text-gold/70 font-medium">F1 Practical</th>
                    <th className="pb-2 text-sage/70 font-medium">F2 Emotional</th>
                  </tr>
                </thead>
                <tbody>
                  {EFA.domainLoadings.map((row, i) => {
                    const f1Primary = row.practical > row.emotional;
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                        <td className="py-1.5 pr-4 text-ivory/70">{row.domain}</td>
                        <td
                          className={`py-1.5 pr-4 font-mono ${
                            f1Primary ? "text-gold font-semibold" : "text-ivory/35"
                          }`}
                        >
                          {row.practical.toFixed(3)}
                        </td>
                        <td
                          className={`py-1.5 font-mono ${
                            !f1Primary ? "text-sage font-semibold" : "text-ivory/35"
                          }`}
                        >
                          {row.emotional.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ivory/40 mt-3">
              Bold = primary loading. Rotation: {EFA.rotation}.
            </p>
          </ResultCard>
        </>
      )}

      {/* ── CRI ── */}
      {activeSection === "cri" && (
        <>
          <ResultCard
            title="F90-CRI Formula"
            badge="Index Construction"
            defense={[
              "Why equal weights for the two factors? Differential weighting requires criterion validation beyond this study's scope. Equal weighting is the principled default when no prior evidence favors one factor.",
              "Why min-max scaling, not z-scoring? Min-max produces an interpretable 0–100 range anchored to your sample. Z-scores still produce negative values and are harder to communicate.",
              "Are the bounds sample-dependent? Yes — C_min and C_max are derived from your N=133 sample. Future studies should either fix these constants or restate bounds explicitly.",
            ]}
          >
            <EqBlock label="F90-CRI Formula">
              {`\\text{F90-CRI} = 100 \\cdot \\frac{C + 2.004654}{4.466533}`}
            </EqBlock>
            <EqBlock label="Where C = composite score">
              {`C = \\frac{\\xi_{\\text{Practical}} + \\xi_{\\text{Emotional}}}{2}`}
            </EqBlock>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Stat label="Sample Mean" value={CRI.mean} sub="F90-CRI units" />
              <Stat label="SD" value={CRI.sd} />
              <Stat label="Range" value={`${CRI.min}–${CRI.max}`} />
            </div>
          </ResultCard>

          <ResultCard
            title="Group Comparison"
            badge="Criterion Validity"
            defense={[
              "Is a 15.41-point gap clinically meaningful? Cohen's d ≈ 15.41/19.01 ≈ 0.81 — a large effect. The gap distinguishes students who screen positive vs. negative on a validated depression screen.",
              "Could the difference be due to chance? No — Spearman ρ=0.409, p<.001 means the association is highly significant (N=133 is well-powered at this effect size).",
            ]}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg bg-terracotta/15 border border-terracotta/20 p-4">
                <div className="text-xs text-terracotta/80 mb-1">PHQ-2 Positive</div>
                <div className="text-2xl font-bold text-terracotta">{CRI.phq2PosMean}</div>
                <div className="text-xs text-ivory/40 mt-1">Mean F90-CRI</div>
              </div>
              <div className="rounded-lg bg-sage/15 border border-sage/20 p-4">
                <div className="text-xs text-sage/80 mb-1">PHQ-2 Negative</div>
                <div className="text-2xl font-bold text-sage">{CRI.phq2NegMean}</div>
                <div className="text-xs text-ivory/40 mt-1">Mean F90-CRI</div>
              </div>
            </div>
            <p className="text-sm text-ivory/60">
              Difference: <span className="text-gold font-semibold">
                {(CRI.phq2PosMean - CRI.phq2NegMean).toFixed(2)} points
              </span>{" "}
              (≈ 0.81 SD) — a large effect size by Cohen's d conventions.
            </p>
          </ResultCard>

          <ResultCard
            title="Worked Example"
            badge="Computation"
            defense={[
              "What does a CRI of 61.48 mean? This individual is above the sample mean (44.88), indicating elevated composite burden — both practical and emotional stressors above average.",
            ]}
          >
            <div className="text-sm text-ivory/60 mb-3">
              Given: Practical ξ₁ = {WORKED_EXAMPLE.practicalZ}, Emotional ξ₂ = {WORKED_EXAMPLE.emotionalZ}
            </div>
            <EqBlock>{`C = \\frac{${WORKED_EXAMPLE.practicalZ} + ${WORKED_EXAMPLE.emotionalZ}}{2} = ${WORKED_EXAMPLE.composite}`}</EqBlock>
            <EqBlock>{`\\text{F90-CRI} = 100 \\cdot \\frac{${WORKED_EXAMPLE.composite} + 2.004654}{4.466533} \\approx ${WORKED_EXAMPLE.cri}`}</EqBlock>
            <div className="mt-3 p-3 rounded-lg bg-gold/10 text-sm text-ivory/70">
              {WORKED_EXAMPLE.description}
            </div>
          </ResultCard>
        </>
      )}

      {/* ── CORRELATIONS ── */}
      {activeSection === "corr" && (
        <>
          <ResultCard
            title="Spearman Correlations with PHQ-2"
            badge="Criterion Validity"
            defense={[
              "Why Spearman, not Pearson? PHQ-2 is binary; Pearson's r assumes continuous normally distributed variables. Spearman works on ranks, making no normality assumption.",
              "Practical factor p=.113 — does this undermine the CRI? No. Practical burden may predict other outcomes (retention, GPA) not measured here. The CRI measures burden holistically, not just depression risk.",
              "Emotional ρ=0.571 — why so much stronger? Depression is closely linked to interpersonal processes (isolation, imposter syndrome, advisor strain). This is theoretically coherent and a substantive finding.",
            ]}
          >
            <div className="space-y-3">
              {[
                { label: "F90-CRI composite", ...CORRELATIONS.criVsPhq2Binary, color: "text-gold" },
                { label: "Practical factor (F1)", ...CORRELATIONS.practicalVsPhq2Binary, color: "text-ivory/50" },
                { label: "Emotional factor (F2)", ...CORRELATIONS.emotionalVsPhq2Binary, color: "text-sage" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-ivory/70">{row.label}</span>
                  <div className="text-right">
                    <span className={`font-mono font-semibold ${row.color}`}>
                      ρ = {row.rho}
                    </span>
                    <span className="text-xs text-ivory/40 ml-2">
                      p = {typeof row.p === "number" ? row.p : row.p}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-ivory/40 mt-3">
              Method: {CORRELATIONS.criVsPhq2Binary.method}. n = {SAMPLE.N}.
            </p>
          </ResultCard>
        </>
      )}

      {/* ── LASSO ── */}
      {activeSection === "lasso" && (
        <>
          <ResultCard
            title="LASSO Logistic Regression"
            badge="Predictive Model"
            defense={[
              "Why LASSO, not standard logistic regression? With N=133 and 11 predictors, standard LR overfits. LASSO penalises complexity and performs variable selection automatically.",
              "What is nested 10-fold CV? The inner loop selects λ; the outer loop evaluates the whole procedure. Prevents optimistic bias from using the same data to tune and evaluate.",
              "AUC=0.861 — how good is that? 0.5=chance, 0.7-0.8=acceptable, 0.8-0.9=excellent, >0.9=outstanding. 0.861 is excellent discrimination.",
              "Why report both λ.min and λ.1se? They represent the tradeoff between predictive accuracy (λ.min, 6.6 predictors) and parsimony (λ.1se, 2.2 predictors). Reporting both is transparent and informative.",
            ]}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-gold/70 mb-2 font-semibold">λ.min</div>
                <div className="text-2xl font-bold text-gold">{LASSO.lambdaMin.auc}</div>
                <div className="text-xs text-ivory/40">AUC</div>
                <div className="mt-2 text-sm text-ivory/60">
                  Brier: {LASSO.lambdaMin.brier}
                </div>
                <div className="text-xs text-ivory/40">
                  ~{LASSO.lambdaMin.meanSelected} predictors
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-sage/70 mb-2 font-semibold">λ.1se (parsimonious)</div>
                <div className="text-2xl font-bold text-sage">{LASSO.lambda1se.auc}</div>
                <div className="text-xs text-ivory/40">AUC</div>
                <div className="mt-2 text-sm text-ivory/60">
                  Brier: {LASSO.lambda1se.brier}
                </div>
                <div className="text-xs text-ivory/40">
                  ~{LASSO.lambda1se.meanSelected} predictors
                </div>
              </div>
            </div>
            <p className="text-sm text-ivory/60">{LASSO.method}</p>
          </ResultCard>
        </>
      )}
    </div>
  );
}
